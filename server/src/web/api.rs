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
    models::{self, get_files_dir},
};

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
        .layer(RequestBodyLimitLayer::new((100 + 1 + 1) * 1024 * 1024)) // 100MiB for files, 1MiB for text & 1MiB buffer space
}

async fn status() -> Result<StatusCode> {
    Ok(StatusCode::OK)
}

async fn create_clipboard(
    State(db_controller): State<models::DatabaseController>,
    mut multipart: Multipart,
) -> Result<StatusCode> {
    let mut files: HashMap<String, String> = HashMap::new();
    let mut text_file_id: Option<String> = None;
    let mut clipboard_info: Option<models::ClipboardOptions> = None;

    // Parse multipart payload and store text/file(s)
    while let Some(mut field) = multipart.next_field().await.unwrap() {
        let id = uuid::Uuid::new_v4().to_string();
        let path = get_files_dir().join(&id);
        match field.name().unwrap() {
            "text" => {
                if text_file_id.is_none() {
                    let mut file = File::create(&path).await.unwrap();
                    while let Some(chunk) = field.chunk().await.unwrap() {
                        file.write_all(&chunk).await.unwrap();
                    }
                    text_file_id = Some(id);
                }
            }
            "file" => {
                let mut file = File::create(&path).await.unwrap();
                while let Some(chunk) = field.chunk().await.unwrap() {
                    file.write_all(&chunk).await.unwrap();
                }
                let file_name = field.file_name().unwrap().to_string();
                files.insert(file_name, id);
            }
            "info" => {
                let info = field.bytes().await.unwrap();
                let info = std::str::from_utf8(&info).unwrap();
                let Ok(info) = serde_json::from_str::<models::ClipboardOptions>(info.into()) else {
                    return Ok(StatusCode::BAD_REQUEST);
                };
                if clipboard_info.is_none() {
                    clipboard_info = Some(info);
                }
            }
            _ => {}
        }
    }

    // Create clipboard payload
    let Some(info) = clipboard_info else {
        return Ok(StatusCode::BAD_REQUEST);
    };
    let expiry = Utc::now().timestamp() + info.expire_after;
    let name = info.name;
    let passwd_hash = info.passwd_hash;
    let clipboard = models::CreateClipboardPayload {
        clipboard_name: name,
        text_file_id: text_file_id.clone(),
        files: files.clone(),
        passwd_hash,
        expiry,
    };

    // Attempt to add to database
    match db_controller.add_clipboard(clipboard).await {
        Ok(_) => Ok(()),
        Err(e) => {
            match e {
                // Reject this request because unique `name` constraint not satisfied
                crate::error::Error::NameAlreadyExistsInDB => {
                    // Cleanup stored text/file(s) since this request will be rejected
                    if let Some(text) = text_file_id {
                        tokio::fs::remove_file(get_files_dir().join(text))
                            .await
                            .unwrap();
                    }
                    for (_name, id) in files {
                        tokio::fs::remove_file(get_files_dir().join(id))
                            .await
                            .unwrap();
                    }
                    Err(e)
                }
                _ => Err(e),
            }
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
            let text = tokio::fs::read_to_string(get_files_dir().join(text_file_id))
                .await
                .map_err(|e| Error::UnhandledError(e.into()))?;
            clipboard.text = Some(text);
        }

        let files: Vec<String> = clipboard
            .files
            .keys()
            .map(|file_name| file_name.clone())
            .collect();

        res.push(models::GetClipboardsResponse {
            name: clipboard.name.clone(),
            text: clipboard.text.clone(),
            files,
            is_encrypted: clipboard.is_encrypted,
        });
    }

    if res.is_empty() {
        return Ok((StatusCode::NO_CONTENT, Json(res)));
    } else {
        return Ok((StatusCode::OK, Json(res)));
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
    if let Some(text_id) = to_be_deleted.text_file_id {
        tokio::fs::remove_file(get_files_dir().join(text_id))
            .await
            .map_err(|e| Error::UnhandledError(e.into()))?;
    }

    for file_id in to_be_deleted.file_ids {
        tokio::fs::remove_file(get_files_dir().join(file_id))
            .await
            .map_err(|e| Error::UnhandledError(e.into()))?;
    }
    Ok(StatusCode::NO_CONTENT)
}
