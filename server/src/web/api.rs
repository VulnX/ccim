use std::{collections::HashMap, time::Duration};

use axum::{
    extract::{DefaultBodyLimit, Multipart, State},
    http::StatusCode,
    routing::{get, post},
    Router,
};
use chrono::Utc;
use tokio::{fs::File, io::AsyncWriteExt};
use tower_http::limit::RequestBodyLimitLayer;

use crate::{
    error::Result,
    models::{self},
};

pub fn routes() -> Router {
    let db_controller = models::DatabaseController::new();
    Router::new()
        .route(
            "/clipboards",
            post(create_clipboard)
                .get(list_clipboards)
                .patch(update_clipboard)
                .delete(delete_clipboard),
        )
        .route("/status", get(status))
        .with_state(db_controller)
        .layer(DefaultBodyLimit::disable())
        .layer(RequestBodyLimitLayer::new((100 + 1 + 1) * 1024 * 1024)) // 100MiB for files, 1MiB for text & 1MiB buffer space
}

async fn create_clipboard(
    State(db_controller): State<models::DatabaseController>,
    mut multipart: Multipart,
) -> Result<StatusCode> {
    let mut files: Option<HashMap<String, String>> = None;
    let mut text: Option<String> = None;
    let mut info: Option<models::ClipboardOptions> = None;

    // Parse multipart payload and store text/file(s)
    while let Some(mut field) = multipart.next_field().await.unwrap() {
        let id = uuid::Uuid::new_v4().to_string();
        let path = models::get_data_dir().join("files").join(&id);
        match field.name().unwrap() {
            "text" => {
                if text.is_none() {
                    let mut file = File::create(&path).await.unwrap();
                    while let Some(chunk) = field.chunk().await.unwrap() {
                        file.write_all(&chunk).await.unwrap();
                    }
                    text = Some(id);
                }
            }
            "file" => {
                let mut file = File::create(&path).await.unwrap();
                while let Some(chunk) = field.chunk().await.unwrap() {
                    file.write_all(&chunk).await.unwrap();
                }
                if files.is_none() {
                    files = Some(HashMap::new());
                }
                if let Some(file_list) = &mut files {
                    file_list.insert(field.file_name().unwrap().to_string(), id);
                }
            }
            "info" => {
                let info_ = field.bytes().await.unwrap();
                let info_ = std::str::from_utf8(&info_).unwrap();
                let info_ = serde_json::from_str::<models::ClipboardOptions>(info_.into()).unwrap();
                if info.is_none() {
                    info = Some(info_);
                }
            }
            _ => {}
        }
    }

    // Create clipboard payload
    let Some(info) = info else {
        return Ok(StatusCode::BAD_REQUEST);
    };
    let expiry = Utc::now() + Duration::from_secs(info.expire_after);
    let expiry = expiry.format("%Y-%m-%d %H:%M:%S").to_string();
    let name = info.name;
    let is_encrypted = info.is_encrypted;
    let clipboard = models::CreateClipboardPayload {
        name,
        text: text.clone(),
        files: files.clone(),
        is_encrypted,
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
                    if let Some(text) = text {
                        tokio::fs::remove_file(models::get_data_dir().join("files").join(text))
                            .await
                            .unwrap();
                    }
                    if let Some(files) = files {
                        for (_name, id) in files {
                            tokio::fs::remove_file(models::get_data_dir().join("files").join(id))
                                .await
                                .unwrap();
                        }
                    }
                    Err(e)
                }
                _ => Err(e),
            }
        }
    }?;

    Ok(StatusCode::CREATED)
}

async fn list_clipboards(State(app_state): State<models::DatabaseController>) -> Result<String> {
    let clipboards = app_state.get_clipboards().await.unwrap();
    dbg!(&clipboards);
    Ok(format!("{clipboards:#?}"))
}

async fn update_clipboard() -> Result<()> {
    todo!()
}

async fn delete_clipboard() -> Result<()> {
    todo!()
}

async fn status() -> Result<StatusCode> {
    Ok(StatusCode::OK)
}
