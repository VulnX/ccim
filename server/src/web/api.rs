use std::{collections::HashMap, time::Duration};

use axum::{
    extract::{DefaultBodyLimit, Multipart, State},
    http::StatusCode,
    response::Html,
    routing::{get, post},
    Router,
};
use chrono::Utc;
use tokio::{fs::File, io::AsyncWriteExt};
use tower_http::limit::RequestBodyLimitLayer;

use crate::{
    error::{Error, Result},
    models::{self, ClipboardOptions, CreateClipboardPayload, DatabaseController},
};

pub fn routes() -> Router {
    let db_controller = DatabaseController::new();
    Router::new()
        .route(
            "/clipboards",
            post(create_clipboard)
                .get(list_clipboards)
                .patch(update_clipboard)
                .delete(delete_clipboard),
        )
        .route("/status", get(status))
        .route("/form", get(show_form))
        .with_state(db_controller)
        .layer(DefaultBodyLimit::disable())
        .layer(RequestBodyLimitLayer::new((100 + 1 + 1) * 1024 * 1024)) // 100MiB for files, 1MiB for text & 1MiB buffer space
}

async fn create_clipboard(
    State(db_controller): State<DatabaseController>,
    mut multipart: Multipart,
) -> Result<StatusCode> {
    let mut files: Option<HashMap<String, String>> = None;
    let mut text: Option<String> = None;
    let mut info: Option<ClipboardOptions> = None;

    while let Some(mut field) = multipart.next_field().await.unwrap() {
        let id = uuid::Uuid::new_v4().to_string();
        let path = models::get_data_dir().join("files").join(&id);
        let mut file = File::create(&path).await.unwrap();
        match field.name().unwrap() {
            "text" => {
                if text.is_none() {
                    while let Some(chunk) = field.chunk().await.unwrap() {
                        file.write_all(&chunk).await.unwrap();
                    }
                    text = Some(id);
                }
            }
            "file" => {
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
                let info_ = serde_json::from_str::<ClipboardOptions>(info_.into()).unwrap();
                if info.is_none() {
                    info = Some(info_);
                }
            }
            _ => {}
        }
    }

    let info = info.ok_or(Error::InvalidInfoSupplied)?;
    let expiry = Utc::now() + Duration::from_secs(info.expire_after);
    let expiry = expiry.format("%Y-%m-%d %H:%M:%S").to_string();

    let clipboard = CreateClipboardPayload {
        name: info.name,
        text,
        files,
        is_encrypted: info.is_encrypted,
        expiry,
    };
    db_controller.add_clipboard(clipboard).await.unwrap();

    Ok(StatusCode::CREATED)
}

async fn list_clipboards(State(app_state): State<DatabaseController>) -> Result<String> {
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

async fn show_form() -> Html<&'static str> {
    Html(
        r#"
        <!doctype html>
        <html>
            <head></head>
            <body>
                <form action="/api/clipboards" method="post" enctype="multipart/form-data">
                    <label>
                        Upload file:
                        <input type="file" name="file" multiple>
                    </label>
                    <input type="text" name="text">

                    <input type="submit" value="Upload files">
                </form>
            </body>
        </html>
        "#,
    )
}
