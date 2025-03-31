use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde_json::json;
use tracing::error;
pub type Result<T> = core::result::Result<T, Error>;

#[derive(Debug)]
pub enum Error {
    UnhandledError(anyhow::Error),
    NameAlreadyExistsInDB,
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
            Error::UnhandledError(msg) => {
                error!("UNHANDLED ERROR : {msg}");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "UNHANDLED_SERVER_SIDE_ERROR".into(),
                )
            }
        }
        .into_response()
    }
}
