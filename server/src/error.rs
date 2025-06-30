use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde_json::json;
use tracing::error;
pub type Result<T> = core::result::Result<T, Error>;

#[derive(Debug)]
pub enum Error {
    Unhandled(anyhow::Error),
    NameAlreadyExistsInDB,
    ClipboardDoesNotExist,
}

impl IntoResponse for Error {
    fn into_response(self) -> Response {
        match self {
            Error::NameAlreadyExistsInDB => (
                StatusCode::CONFLICT,
                json!({
                    "messsage": "A clipboard by the same name already exists"
                })
                .to_string(),
            ),
            Error::ClipboardDoesNotExist => (
                StatusCode::NOT_FOUND,
                json!({
                    "message": "Clipboard does not exist"
                })
                .to_string(),
            ),
            Error::Unhandled(msg) => {
                error!("UNHANDLED ERROR : {msg}");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "||UNHANDLED_SERVER_SIDE_ERROR||\nPlease check logs".into(),
                )
            }
        }
        .into_response()
    }
}
