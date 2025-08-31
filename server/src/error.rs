use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use tracing::error;
pub type Result<T> = core::result::Result<T, Error>;

#[derive(Debug)]
pub enum Error {
    Unhandled(anyhow::Error),
    NameAlreadyExistsInDB,
    ClipboardDoesNotExist,
    BadRequest(Option<&'static str>),
    Unauthorized(Option<&'static str>),
    Database(rusqlite::Error),
    FileDoesNotExist,
}

impl IntoResponse for Error {
    fn into_response(self) -> Response {
        match self {
            Error::Unhandled(msg) => {
                error!("UNHANDLED ERROR : {msg}");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({
                        "message": "||UNHANDLED_SERVER_SIDE_ERROR||\nPlease check logs"
                    })),
                )
            }
            Error::NameAlreadyExistsInDB => (
                StatusCode::CONFLICT,
                Json(json!({
                    "message": "A clipboard by the same name already exists"
                })),
            ),
            Error::ClipboardDoesNotExist => (
                StatusCode::NOT_FOUND,
                Json(json!({
                    "message": "Clipboard does not exist"
                })),
            ),
            Error::BadRequest(msg) => (
                StatusCode::BAD_REQUEST,
                Json(json!({
                    "message": msg.unwrap_or("Invalid request. Please refer to API docs")
                })),
            ),
            Error::Unauthorized(msg) => (
                StatusCode::UNAUTHORIZED,
                Json(json!({
                    "message": msg.unwrap_or("UNAUTHORIZED! THIS INCIDENT WILL BE REPORTED")
                })),
            ),
            Error::Database(msg) => {
                error!("DATABASE ERROR : {msg}");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({
                        "message": "A database error has occured. Please try again"
                    })),
                )
            }
            Error::FileDoesNotExist => (
                StatusCode::NOT_FOUND,
                Json(json!({
                    "message": "Invalid file id"
                })),
            ),
        }
        .into_response()
    }
}
