use axum::http::StatusCode;
use axum_test::multipart::{MultipartForm, Part};
use chrono::Utc;
use serde_json::json;
use serial_test::serial;

use crate::common::{init_test, make_clipboard_form};

#[tokio::test]
#[serial]
async fn test_successful() {
    let server = init_test().await;
    let form = make_clipboard_form("clip", 300, None, vec![], true, false).await;
    server
        .post("/api/clipboards")
        .multipart(form)
        .await
        .assert_status(StatusCode::CREATED);
    let passwd = json!({
        "hash": vec![0],
        "timestamp": Utc::now().timestamp() as u64,
    })
    .to_string();
    let passwd = json!(ccim_server::util::encrypt(passwd.into()).await);
    let form = MultipartForm::new().add_part("passwd", Part::text(passwd));
    server
        .delete("/api/clipboards/clip")
        .multipart(form)
        .await
        .assert_status(StatusCode::NO_CONTENT);
}

#[tokio::test]
#[serial]
async fn test_duplicate() {
    let server = init_test().await;
    let form = make_clipboard_form("clip", 300, None, vec![], false, false).await;
    server
        .post("/api/clipboards")
        .multipart(form)
        .await
        .assert_status(StatusCode::CREATED);
    let form = MultipartForm::new();
    server
        .delete("/api/clipboards/clip")
        .multipart(form)
        .await
        .assert_status(StatusCode::NO_CONTENT);
    let form = MultipartForm::new();
    server
        .delete("/api/clipboards/clip")
        .multipart(form)
        .await
        .assert_status(StatusCode::NOT_FOUND);
}

#[tokio::test]
#[serial]
async fn test_unauthorized() {
    let server = init_test().await;
    let form = make_clipboard_form("clip", 300, None, vec![], true, false).await;
    server
        .post("/api/clipboards")
        .multipart(form)
        .await
        .assert_status(StatusCode::CREATED);
    let form = MultipartForm::new();
    server
        .delete("/api/clipboards/clip")
        .multipart(form)
        .await
        .assert_status_bad_request();
}
