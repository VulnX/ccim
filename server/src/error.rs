use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
};

pub type Result<T> = core::result::Result<T, Error>;

#[derive(Debug)]
pub enum Error {
    FailedToQueryDB,
    FailedToInsertIntoDB,
    InvalidInfoSupplied,
}

impl IntoResponse for Error {
    fn into_response(self) -> Response {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "UNHANDLED_SERVER_SIDE_ERROR",
        )
            .into_response()
    }
}
