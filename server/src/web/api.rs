use std::{collections::HashMap, convert::Infallible};

use axum::{
    body::Body,
    extract::{DefaultBodyLimit, Multipart, Path, State},
    http::{
        header::{CONTENT_DISPOSITION, CONTENT_LENGTH, CONTENT_TYPE},
        StatusCode,
    },
    response::{sse::Event, Response, Sse},
    routing::{get, post},
    Json, Router,
};
use chrono::Utc;
use tokio::{
    fs::{File, OpenOptions},
    io::AsyncWriteExt,
};
use tokio_stream::{wrappers::BroadcastStream, Stream, StreamExt};
use tower_http::limit::RequestBodyLimitLayer;

use crate::{
    error::{Error, Result},
    models::{self, ClipboardDataResponse},
    util,
};

const FILES_MAX_SIZE: usize = 100;
const TEXT_MAX_SIZE: usize = 1;
const ADDITIONAL_BUFFER_SIZE: usize = 1;

/// Returns the API router with all defined HTTP routes.
pub fn routes() -> Router {
    let app_state = models::AppState::new();
    Router::new()
        .route("/status", get(status))
        .route("/publickey", get(public_key))
        .route("/clipboards", post(create_clipboard).get(list_clipboards))
        .route(
            "/clipboards/{name}",
            get(get_clipboard)
                .patch(update_clipboard)
                .delete(delete_clipboard),
        )
        .route("/clipboards/file/{id}", get(download_file))
        .with_state(app_state)
        .layer(DefaultBodyLimit::disable())
        .layer(RequestBodyLimitLayer::new(
            (FILES_MAX_SIZE + TEXT_MAX_SIZE + ADDITIONAL_BUFFER_SIZE) * 1024 * 1024,
        ))
}

/// Health check endpoint. Always returns `200 OK`.
async fn status() -> Result<StatusCode> {
    Ok(StatusCode::OK)
}

/// Returns the contents of the RSA public key file.
async fn public_key() -> Result<String> {
    let public_key_pem = tokio::fs::read_to_string(util::get_data_dir().join("public.pem"))
        .await
        .map_err(|e| Error::Unhandled(e.into()))?;
    Ok(public_key_pem)
}

/// Creates a new clipboard with optional text, files, and metadata sent via multipart form data.
async fn create_clipboard(
    State(mut state): State<models::AppState>,
    mut multipart: Multipart,
) -> Result<StatusCode> {
    let mut file_map: HashMap<String, String> = HashMap::new(); // Maps the actual file name to its uuid name in the filesystem
    let text_file_id: String = uuid::Uuid::new_v4().to_string();
    File::create(util::get_files_dir().join(&text_file_id))
        .await
        .unwrap();
    let mut clipboard_info: Option<models::ClipboardInfo> = None;

    // Parse multipart payload and store text/file(s)
    while let Some(mut field) = multipart.next_field().await.unwrap() {
        match field.name() {
            Some("text") => {
                let path = util::get_files_dir().join(&text_file_id);
                let mut file = OpenOptions::new().write(true).open(path).await.unwrap();
                while let Some(chunk) = field.chunk().await.unwrap() {
                    file.write_all(&chunk).await.unwrap();
                }
                file.flush().await.unwrap();
            }
            Some("file") => {
                let id = uuid::Uuid::new_v4().to_string();
                let path = util::get_files_dir().join(&id);
                let mut file = File::create(&path).await.unwrap();
                while let Some(chunk) = field.chunk().await.unwrap() {
                    file.write_all(&chunk).await.unwrap();
                }
                file.flush().await.unwrap();
                let file_name = field.file_name().unwrap().to_string();
                file_map.insert(file_name, id);
            }
            Some("info") => {
                if clipboard_info.is_none() {
                    // Parse part `info` as `CreateClipboardRequest`
                    let info_bytes = field.bytes().await.unwrap();
                    let Ok(info) =
                        serde_json::from_slice::<models::CreateClipboardRequest>(&info_bytes)
                    else {
                        util::cleanup_files(text_file_id, file_map.values().cloned().collect())
                            .await;
                        return Err(Error::BadRequest(Some(
                            "Failed to parse part `info` as `CreateClipboardRequest`",
                        )));
                    };
                    // Obtain an optional `passwd_hash` from the request
                    let mut passwd = None;
                    if let Some(passwd_bytes) = info.passwd_hash {
                        let _passwd = match util::get_passwd(passwd_bytes).await {
                            Ok(hash) => hash,
                            Err(e) => {
                                util::cleanup_files(
                                    text_file_id,
                                    file_map.values().cloned().collect(),
                                )
                                .await;
                                return Err(e);
                            }
                        };
                        passwd = Some(_passwd);
                    }
                    // Sanity check : Ensure expiry is no more than 24 hours
                    if 24 * 60 * 60 < info.expire_after {
                        util::cleanup_files(text_file_id, file_map.values().cloned().collect())
                            .await;
                        return Err(Error::BadRequest(Some(
                            "Clipboard lifetime cannot exceed 24 hours",
                        )));
                    }

                    clipboard_info = Some(models::ClipboardInfo {
                        name: info.name,
                        expire_after: info.expire_after,
                        passwd,
                    });
                }
            }
            _ => {} // Don't care about any other part (not a part of API)
        }
    }

    // Ensure `info` part was indeed provided
    let Some(clipboard_info) = clipboard_info else {
        util::cleanup_files(text_file_id, file_map.values().cloned().collect()).await;
        return Err(Error::BadRequest(Some("No clipboard info supplied")));
    };
    // Create clipboard payload
    let expiry = Utc::now().timestamp() as u64 + clipboard_info.expire_after;
    let clipboard_name = clipboard_info.name;
    let passwd_hash = clipboard_info.passwd;
    let clipboard = models::CreateClipboardPayload {
        clipboard_name,
        text_file_id: text_file_id.clone(),
        file_map: file_map.clone(),
        passwd: passwd_hash,
        expiry,
    };

    // Attempt to add to database
    match state.add_clipboard(clipboard).await {
        Ok(_) => Ok(()),
        Err(e) => {
            // Cleanup stored text/file(s) since this request will be rejected
            util::cleanup_files(text_file_id, file_map.values().cloned().collect()).await;
            Err(e)
        }
    }?;

    Ok(StatusCode::CREATED)
}

/// Returns a list of all active clipboards (and their metadata).
async fn list_clipboards(
    State(state): State<models::AppState>,
) -> Sse<impl Stream<Item = std::result::Result<Event, Infallible>>> {
    let initial_state = state
        .db_controller
        .fetch_active_clipboards()
        .await
        .unwrap_or_default();
    let initial_stream = futures_util::stream::once(async move {
        let json = serde_json::to_string(&initial_state).unwrap_or_else(|_| "[]".into());
        Ok(Event::default().data(json))
    });

    let rx = state.tx.subscribe();
    let updates = BroadcastStream::new(rx).filter_map(|res| match res {
        Ok(json) => Some(Ok(Event::default().data(json))),
        Err(_) => None,
    });

    let stream = initial_stream.chain(updates);

    Sse::new(stream)
}

async fn get_clipboard(
    State(state): State<models::AppState>,
    Path(name): Path<String>,
) -> Result<(StatusCode, Json<models::ClipboardDataResponse>)> {
    let clipboard_data = state.get_clipboard(&name).await?;

    let text = tokio::fs::read(util::get_files_dir().join(clipboard_data.text_file_id))
        .await
        .map_err(|e| Error::Unhandled(e.into()))?;

    let mut files = Vec::new();
    for (name, id) in clipboard_data.file_map {
        let metadata = tokio::fs::metadata(util::get_files_dir().join(&id))
            .await
            .map_err(|e| Error::Unhandled(e.into()))?;
        let size = metadata.len();
        files.push(models::FileInfo { name, id, size });
    }

    Ok((StatusCode::OK, Json(ClipboardDataResponse { text, files })))
}

/// Updates an existing clipboard with new text, added files, or removed files.
async fn update_clipboard(
    State(mut state): State<models::AppState>,
    Path(name): Path<String>,
    mut multipart: Multipart,
) -> Result<StatusCode> {
    let mut new_info = None;
    let mut deleted_files = Vec::new();
    let mut added_file_map = HashMap::new();
    while let Ok(Some(mut field)) = multipart.next_field().await {
        match field.name() {
            Some("info") => {
                let bytes = field.bytes().await.unwrap();
                new_info = Some(
                    serde_json::from_slice::<models::UpdateClipboardInfoPayload>(&bytes)
                        .map_err(|_| Error::BadRequest(Some("Part `info` is poorly formatted")))?,
                );
            }
            Some("delete") => {
                let bytes = field.bytes().await.unwrap();
                deleted_files = serde_json::from_slice::<Vec<String>>(&bytes)
                    .map_err(|_| Error::BadRequest(Some("Part `delete` is poorly formatted")))?;
            }
            Some("file") => {
                let id = uuid::Uuid::new_v4().to_string();
                let path = util::get_files_dir().join(&id);
                let mut file = File::create(&path).await.unwrap();
                while let Some(chunk) = field.chunk().await.unwrap() {
                    file.write_all(&chunk).await.unwrap();
                }
                file.flush().await.unwrap();
                let file_name = field.file_name().unwrap().to_string();
                added_file_map.insert(file_name, id);
            }
            _ => {}
        }
    }

    let res = match state
        .update_clipboard(&name, &new_info, &deleted_files, &added_file_map)
        .await
    {
        Ok(res) => Ok(res),
        Err(e) => {
            for (_file_name, file_id) in added_file_map {
                util::delete_file(file_id).await;
            }
            Err(e)
        }
    }?;

    if let Some(text_file_id) = res.text_file_id {
        // Update text content in filesystem
        let text_content = new_info.unwrap().new_text.unwrap();
        let file_path = util::get_files_dir().join(text_file_id);
        let mut file = OpenOptions::new()
            .write(true)
            .open(file_path)
            .await
            .unwrap();
        file.write_all(&text_content).await.unwrap();
        file.flush().await.unwrap();
    }

    // Delete files from filesystem
    for file_id in deleted_files {
        util::delete_file(file_id).await;
    }

    Ok(StatusCode::OK)
}

/// Deletes a clipboard and all associated files from the system.
async fn delete_clipboard(
    State(mut state): State<models::AppState>,
    Path(name): Path<String>,
    mut multipart: Multipart,
) -> Result<StatusCode> {
    let mut passwd: Option<models::Passwd> = None;
    while let Ok(Some(field)) = multipart.next_field().await {
        if let Some("passwd") = field.name() {
            let text = field.text().await.unwrap();
            let passwd_bytes = serde_json::from_str::<Vec<u8>>(&text)
                .map_err(|_| Error::BadRequest(Some("Failed to parse `passwd` part")))?;
            let _passwd = util::get_passwd(passwd_bytes).await?;
            passwd = Some(_passwd);
        }
    }
    let to_be_deleted = state.delete_clipboard(name, passwd).await?;
    util::cleanup_files(to_be_deleted.text_file_id, to_be_deleted.file_ids).await;
    Ok(StatusCode::NO_CONTENT)
}

/// Streams a file to the client by its ID, if it exists.
async fn download_file(
    State(state): State<models::AppState>,
    Path(id): Path<String>,
) -> Result<Response> {
    // TODO : Add password hash checks (do we need this)
    let file_name = state.get_file_name(&id).await?;
    let file_path = util::get_files_dir().join(id);
    if !file_path.exists() {
        return Ok(Response::builder()
            .status(StatusCode::NOT_FOUND)
            .body(Body::empty())
            .unwrap());
    }
    let file = tokio::fs::File::open(&file_path).await.unwrap();
    let file_size = tokio::fs::metadata(&file_path).await.unwrap().len();
    let reader_stream = tokio_util::io::ReaderStream::new(file);
    let body = Body::from_stream(reader_stream);
    Ok(Response::builder()
        .header(CONTENT_TYPE, "application/octet-stream")
        .header(CONTENT_LENGTH, file_size)
        .header(
            CONTENT_DISPOSITION,
            format!("attachment; filename=\"{file_name}\""),
        )
        .body(body)
        .unwrap())
}
