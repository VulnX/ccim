use axum::http::StatusCode;
use serial_test::serial;

use crate::common::{init_test, make_clipboard_form};

#[tokio::test]
#[serial]
async fn test_successful() {
    let server = init_test().await;
    let form = make_clipboard_form("clip", 300, None, vec![], true).await;
    server
        .post("/api/clipboards")
        .multipart(form)
        .await
        .assert_status(StatusCode::CREATED);
    server
        .delete("/api/clipboards/clip")
        .await
        .assert_status(StatusCode::NO_CONTENT);
}

#[tokio::test]
#[serial]
async fn test_duplicate() {
    let server = init_test().await;
    let form = make_clipboard_form("clip", 300, None, vec![], true).await;
    server
        .post("/api/clipboards")
        .multipart(form)
        .await
        .assert_status(StatusCode::CREATED);
    server
        .delete("/api/clipboards/clip")
        .await
        .assert_status(StatusCode::NO_CONTENT);
    server
        .delete("/api/clipboards/clip")
        .await
        .assert_status(StatusCode::NOT_FOUND);
}
