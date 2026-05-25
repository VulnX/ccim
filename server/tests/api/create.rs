use crate::common::{init_test, make_clipboard_form, CLIPBOARD_TEXT};
use axum::http::StatusCode;
use axum_test::multipart::{MultipartForm, Part};
use serial_test::serial;

#[tokio::test]
#[serial]
async fn test_successful() {
    let server = init_test().await;
    let form = make_clipboard_form(
        "clip",
        300,
        Some(CLIPBOARD_TEXT),
        vec![("file1", "content1")],
        true,
        false,
    )
    .await;
    server
        .post("/api/clipboards")
        .multipart(form)
        .await
        .assert_status(StatusCode::CREATED);
}

#[tokio::test]
#[serial]
async fn test_unencrypted() {
    let server = init_test().await;
    let form = make_clipboard_form(
        "clip",
        300,
        Some(CLIPBOARD_TEXT),
        vec![("file1", "content1")],
        false,
        false,
    )
    .await;
    server
        .post("/api/clipboards")
        .multipart(form)
        .await
        .assert_status(StatusCode::CREATED);
}

#[tokio::test]
#[serial]
async fn test_invalid_info() {
    let server = init_test().await;
    let form = MultipartForm::new().add_part("info", Part::text("invalid"));
    server
        .post("/api/clipboards")
        .multipart(form)
        .await
        .assert_status_bad_request();
}

#[tokio::test]
#[serial]
async fn test_no_info() {
    let server = init_test().await;
    let form = MultipartForm::new().add_text("text", CLIPBOARD_TEXT);
    server
        .post("/api/clipboards")
        .multipart(form)
        .await
        .assert_status_bad_request();
}

#[tokio::test]
#[serial]
async fn test_large_expiry() {
    let server = init_test().await;
    let form = make_clipboard_form("clip", 1e6 as u64, None, vec![], true, false).await;
    server
        .post("/api/clipboards")
        .multipart(form)
        .await
        .assert_status_bad_request();
}

#[tokio::test]
#[serial]
async fn test_duplicate() {
    let server = init_test().await;
    let form = make_clipboard_form("clip", 300 as u64, None, vec![], true, false).await;
    server
        .post("/api/clipboards")
        .multipart(form)
        .await
        .assert_status(StatusCode::CREATED);
    let form = make_clipboard_form("clip", 300 as u64, None, vec![], true, false).await;
    server
        .post("/api/clipboards")
        .multipart(form)
        .await
        .assert_status_conflict();
}
