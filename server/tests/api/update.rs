use axum::http::StatusCode;
use axum_test::multipart::{MultipartForm, Part};
use ccim_server::models::ClipboardDataResponse;
use chrono::Utc;
use serde_json::json;
use serial_test::serial;

use crate::common::{init_test, make_clipboard_form};

#[tokio::test]
#[serial]
async fn test_update() {
    let server = init_test().await;

    let form = make_clipboard_form("clip", 300, Some("AAAA"), vec![], true, false).await;
    server
        .post("/api/clipboards")
        .multipart(form)
        .await
        .assert_status(StatusCode::CREATED);

    let passwd_hash = json!({
        "hash": vec![0],
        "timestamp": Utc::now().timestamp() as u64,
    })
    .to_string();
    let info = json!({
        "passwd": ccim_server::util::encrypt(passwd_hash.into()).await,
        "new_text": "BBBB".as_bytes().to_vec(),
    });
    let info = Part::text(info.to_string());
    let form = MultipartForm::new().add_part("info", info);
    server
        .patch("/api/clipboards/clip")
        .multipart(form)
        .await
        .assert_status_ok();

    let body = server.get("/api/clipboards/clip").await.text();
    let data = serde_json::from_str::<ClipboardDataResponse>(&body).unwrap();
    assert_eq!(data.text, "BBBB".as_bytes().to_vec());
}

#[tokio::test]
#[serial]
async fn test_update_files() {
    let server = init_test().await;
    let form = make_clipboard_form(
        "clip",
        300,
        Some("AAAA"),
        vec![("file1", "file 1 contents"), ("file2", "file 2 contents")],
        false,
        false,
    )
    .await;
    server
        .post("/api/clipboards")
        .multipart(form)
        .await
        .assert_status(StatusCode::CREATED);

    let body = server.get("/api/clipboards/clip").await.text();
    let data = serde_json::from_str::<ClipboardDataResponse>(&body).unwrap();
    let file1_id = data
        .files
        .iter()
        .find(|file| file.name == "file1")
        .map(|file| file.id.clone())
        .unwrap();
    let files = vec![file1_id];
    let files = serde_json::to_string(&files).unwrap();
    let files = Part::text(files);
    let file3 = Part::bytes("file 3 contents".as_bytes().to_vec()).file_name("file3");
    let form = MultipartForm::new()
        .add_part("delete", files)
        .add_part("file", file3);
    server
        .patch("/api/clipboards/clip")
        .multipart(form)
        .await
        .assert_status(StatusCode::OK);

    let body = server.get("/api/clipboards/clip").await.text();
    let data = serde_json::from_str::<ClipboardDataResponse>(&body).unwrap();

    assert!(!data.files.iter().any(|file| file.name == "file1"));
    assert!(data.files.iter().any(|file| file.name == "file3"));
}

#[tokio::test]
#[serial]
async fn test_non_existing() {
    let server = init_test().await;
    let passwd_hash = json!({
        "hash": vec![0],
        "timestamp": Utc::now().timestamp() as u64,
    })
    .to_string();
    let info = json!({
        "passwd": ccim_server::util::encrypt(passwd_hash.into()).await,
        "new_text": "BBBB".as_bytes().to_vec(),
    });
    let info = Part::text(info.to_string());
    let form = MultipartForm::new().add_part("info", info);
    server
        .patch("/api/clipboards/clip")
        .multipart(form)
        .await
        .assert_status_not_found();
}

#[tokio::test]
#[serial]
async fn test_invalid_passwd() {
    let server = init_test().await;
    let form = make_clipboard_form("clip", 300, None, vec![], true, false).await;
    server
        .post("/api/clipboards")
        .multipart(form)
        .await
        .assert_status(StatusCode::CREATED);
    let passwd_hash = json!({
        "hash": vec![1],
        "timestamp": Utc::now().timestamp() as u64,
    })
    .to_string();
    let info = json!({
        "passwd": ccim_server::util::encrypt(passwd_hash.into()).await,
        "new_text": "BBBB".as_bytes().to_vec(),
    });
    let info = Part::text(info.to_string());
    let file = Part::bytes("new contents".as_bytes().to_vec()).file_name("new");
    let form = MultipartForm::new()
        .add_part("file", file)
        .add_part("info", info);
    server
        .patch("/api/clipboards/clip")
        .multipart(form)
        .await
        .assert_status_unauthorized();
}
