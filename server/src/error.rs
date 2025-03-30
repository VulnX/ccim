use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde_json::json;

pub type Result<T> = core::result::Result<T, Error>;

#[derive(Debug)]
pub enum Error {
    UnhandledError(anyhow::Error),
    FailedToQueryDB,
    NameAlreadyExistsInDB,
}

impl IntoResponse for Error {
    fn into_response(self) -> Response {
        println!("Received error : {:?}", self);
        match self {
            Error::NameAlreadyExistsInDB => (
                StatusCode::CONFLICT,
                json!({
                    "messsage": "A clipboard by the same name already exists"
                })
                .to_string(),
            ),
            Error::UnhandledError(msg) => {
                eprintln!("Unhandled error : {msg}");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "UNHANDLED_SERVER_SIDE_ERROR".into(),
                )
            }
            _ => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "please take care of this error in server side".into(),
            ),
        }
        .into_response()
    }
}
