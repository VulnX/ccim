use std::collections::HashMap;

use axum::{
    extract::{DefaultBodyLimit, Multipart, Path, State},
    http::StatusCode,
    routing::{get, patch, post},
    Json, Router,
};
use chrono::Utc;
use tokio::{fs::File, io::AsyncWriteExt};
use tower_http::limit::RequestBodyLimitLayer;

use crate::{
    error::{Error, Result},
    models, util,
};

const FILES_MAX_SIZE: usize = 100;
const TEXT_MAX_SIZE: usize = 1;
const ADDITIONAL_BUFFER_SIZE: usize = 1;

pub fn routes() -> Router {
    let db_controller = models::DatabaseController::new();
    Router::new()
        .route("/clipboards", post(create_clipboard).get(list_clipboards))
        .route(
            "/clipboard/{name}",
            patch(update_clipboard).delete(delete_clipboard),
        )
        .route("/status", get(status))
        .with_state(db_controller)
        .layer(DefaultBodyLimit::disable())
        .layer(RequestBodyLimitLayer::new(
            (FILES_MAX_SIZE + TEXT_MAX_SIZE + ADDITIONAL_BUFFER_SIZE) * 1024 * 1024,
        ))
}

async fn status() -> Result<StatusCode> {
    Ok(StatusCode::OK)
}

async fn create_clipboard(
    State(db_controller): State<models::DatabaseController>,
    mut multipart: Multipart,
) -> Result<StatusCode> {
    let mut files: HashMap<String, String> = HashMap::new(); // Maps the actual file name to its uuid name in the filesystem
    let mut text_file_id: Option<String> = None;
    let mut clipboard_info: Option<models::ClipboardOptions> = None;

    // Parse multipart payload and store text/file(s)
    while let Some(mut field) = multipart.next_field().await.unwrap() {
        match field.name().unwrap() {
            "text" => {
                if text_file_id.is_none() {
                    let id = uuid::Uuid::new_v4().to_string();
                    let path = util::get_files_dir().join(&id);
                    let mut file = File::create(&path).await.unwrap();
                    while let Some(chunk) = field.chunk().await.unwrap() {
                        file.write_all(&chunk).await.unwrap();
                    }
                    file.flush().await.unwrap();
                    text_file_id = Some(id);
                }
            }
            "file" => {
                let id = uuid::Uuid::new_v4().to_string();
                let path = util::get_files_dir().join(&id);
                let mut file = File::create(&path).await.unwrap();
                while let Some(chunk) = field.chunk().await.unwrap() {
                    file.write_all(&chunk).await.unwrap();
                }
                file.flush().await.unwrap();
                let file_name = field.file_name().unwrap().to_string();
                files.insert(file_name, id);
            }
            "info" => {
                if clipboard_info.is_none() {
                    let info = field.bytes().await.unwrap();
                    let info = std::str::from_utf8(&info).unwrap();
                    let Ok(info) = serde_json::from_str::<models::ClipboardOptions>(info) else {
                        util::cleanup_files(text_file_id, files.values().cloned().collect()).await;
                        return Err(Error::BadRequest(Some(
                            "Failed to parse json field `info`".into(),
                        )));
                    };
                    // Sanity check : Ensure expiry is no more than 24 hours
                    if 24 * 60 * 60 < info.expire_after {
                        util::cleanup_files(text_file_id, files.values().cloned().collect()).await;
                        return Err(Error::BadRequest(Some(
                            "Clipboard lifetime cannot exceed 24 hours".into(),
                        )));
                    }
                    clipboard_info = Some(info);
                }
            }
            _ => {} // Don't care about any other field (not a part of API)
        }
    }

    // Create clipboard payload
    let Some(clipboard_info) = clipboard_info else {
        util::cleanup_files(text_file_id, files.values().cloned().collect()).await;
        return Err(Error::BadRequest(Some("No clipboard info supplied".into())));
    };
    let expiry = Utc::now().timestamp() as u64 + clipboard_info.expire_after;
    let clipboard_name = clipboard_info.name;
    let passwd_hash = clipboard_info.passwd_hash;
    let clipboard = models::CreateClipboardPayload {
        clipboard_name,
        text_file_id: text_file_id.clone(),
        files: files.clone(),
        passwd_hash,
        expiry,
    };

    // Attempt to add to database
    match db_controller.add_clipboard(clipboard).await {
        Ok(_) => Ok(()),
        Err(e) => {
            // Cleanup stored text/file(s) since this request will be rejected
            util::cleanup_files(text_file_id, files.values().cloned().collect()).await;
            Err(e)
        }
    }?;

    Ok(StatusCode::CREATED)
}

async fn list_clipboards(
    State(db_controller): State<models::DatabaseController>,
) -> Result<(StatusCode, Json<Vec<models::GetClipboardsResponse>>)> {
    let mut clipboards = db_controller.get_clipboards().await?;
    let mut res: Vec<models::GetClipboardsResponse> = Vec::new();
    for clipboard in &mut clipboards {
        if let Some(text_file_id) = &clipboard.text {
            let text = tokio::fs::read_to_string(util::get_files_dir().join(text_file_id))
                .await
                .map_err(|e| Error::Unhandled(e.into()))?;
            clipboard.text = Some(text);
        }

        let files: Vec<String> = clipboard.files.keys().cloned().collect();

        res.push(models::GetClipboardsResponse {
            name: clipboard.name.clone(),
            text: clipboard.text.clone(),
            files,
            is_encrypted: clipboard.is_encrypted,
        });
    }

    if res.is_empty() {
        Ok((StatusCode::NO_CONTENT, Json(res)))
    } else {
        Ok((StatusCode::OK, Json(res)))
    }
}

async fn update_clipboard() -> Result<()> {
    todo!()
}

async fn delete_clipboard(
    State(db_controller): State<models::DatabaseController>,
    Path(name): Path<String>,
) -> Result<StatusCode> {
    let to_be_deleted = db_controller.delete_clipboard(name).await?;
    util::cleanup_files(to_be_deleted.text_file_id, to_be_deleted.file_ids).await;
    Ok(StatusCode::NO_CONTENT)
}
