use axum::{extract::State, http::StatusCode, routing::post, Json, Router};
use chrono::{Duration, Utc};

use crate::{
    error::Result,
    models::{ClipboardEntry, CreateClipboardEntryRequest, DatabaseController},
};

pub fn routes() -> Router {
    let app_state = DatabaseController::new();
    Router::new()
        .route(
            "/clipboards",
            post(create_clipboard)
                .get(list_clipboards)
                .patch(update_clipboard)
                .delete(delete_clipboard),
        )
        .with_state(app_state)
}

async fn create_clipboard(
    State(app_state): State<DatabaseController>,
    Json(payload): Json<CreateClipboardEntryRequest>,
) -> Result<StatusCode> {
    let expiry = Utc::now() + Duration::minutes(5);
    let expiry = expiry.format("%Y-%m-%d %H:%M:%S").to_string();
    let clipboard = ClipboardEntry {
        name: payload.name,
        text: payload.text,
        is_encrypted: payload.is_encrypted,
        expiry,
    };
    app_state.add_clipboard(clipboard).await.unwrap();
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
