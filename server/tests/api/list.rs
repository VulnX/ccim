use crate::common::{init_test, make_clipboard_form, CLIPBOARD_TEXT};
use axum::http::StatusCode;
use ccim_server::models::GetClipboardsResponse;
use chrono::Utc;
use serial_test::serial;
use std::collections::{HashMap, HashSet};

#[tokio::test]
#[serial]
async fn test_list() {
    let server = init_test().await;
    server
        .get("/api/clipboards")
        .await
        .assert_status(StatusCode::NO_CONTENT);
    let form = make_clipboard_form("clip1", 300, None, vec![], true).await;
    server
        .post("/api/clipboards")
        .multipart(form)
        .await
        .assert_status(StatusCode::CREATED);
    let form = make_clipboard_form(
        "clip2",
        300,
        Some(CLIPBOARD_TEXT),
        vec![("file1", "file 1 contents"), ("file2", "file 2 contents")],
        false,
    )
    .await;
    server
        .post("/api/clipboards")
        .multipart(form)
        .await
        .assert_status(StatusCode::CREATED);
    let body = server.get("/api/clipboards").await.text();
    let clipboards = serde_json::from_str::<Vec<GetClipboardsResponse>>(&body).unwrap();
    assert_eq!(clipboards.len(), 2);
    assert_eq!(
        clipboards[0],
        GetClipboardsResponse {
            name: "clip1".into(),
            text: "".into(),
            file_map: HashMap::new(),
            is_encrypted: true,
            expiry: Utc::now().timestamp() as u64 + 300
        },
    );
    assert_eq!(clipboards[1].name, "clip2");
    assert_eq!(clipboards[1].text, CLIPBOARD_TEXT);
    assert_eq!(
        clipboards[1]
            .file_map
            .keys()
            .cloned()
            .collect::<HashSet<_>>(),
        ["file1", "file2"]
            .iter()
            .map(|s| s.to_string())
            .collect::<HashSet<_>>()
    );
    assert_eq!(clipboards[1].is_encrypted, false);
}

#[tokio::test]
#[serial]
async fn test_expired_list() {
    let server = init_test().await;
    let form = make_clipboard_form("clip", 0, None, vec![], true).await;
    server
        .post("/api/clipboards")
        .multipart(form)
        .await
        .assert_status(StatusCode::CREATED);
    server
        .get("/api/clipboards")
        .await
        .assert_status(StatusCode::NO_CONTENT);
}
