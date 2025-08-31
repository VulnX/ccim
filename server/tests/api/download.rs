use axum::http::StatusCode;
use ccim_server::models::GetClipboardsResponse;
use serial_test::serial;

use crate::common::{init_test, make_clipboard_form};

#[tokio::test]
#[serial]
async fn test_download_file() {
    let server = init_test().await;
    let file_name = "file1";
    let file_contents = "file contents here";
    let form = make_clipboard_form("clip", 300, None, vec![(file_name, file_contents)], true).await;
    server
        .post("/api/clipboards")
        .multipart(form)
        .await
        .assert_status(StatusCode::CREATED);
    let body = server.get("/api/clipboards").await.text();
    let res = serde_json::from_str::<Vec<GetClipboardsResponse>>(&body).unwrap();
    let file_id = &res[0].file_map[file_name];
    let text = server
        .get(&format!("/api/clipboards/file/{}", file_id))
        .await
        .text();
    assert_eq!(text, file_contents);
}
