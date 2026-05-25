use axum::http::StatusCode;
use ccim_server::models::{ClipboardDataResponse, ClipboardMetadata};
use serial_test::serial;

use crate::common::{init_test, make_clipboard_form};

#[tokio::test]
#[serial]
async fn test_download_file() {
    let server = init_test().await;
    let file_name = "file1";
    let file_contents = "file contents here";
    let form = make_clipboard_form(
        "clip",
        300,
        None,
        vec![(file_name, file_contents)],
        true,
        false,
    )
    .await;
    server
        .post("/api/clipboards")
        .multipart(form)
        .await
        .assert_status(StatusCode::CREATED);
    let body = server.get("/api/clipboards").await.text();
    let res = serde_json::from_str::<Vec<ClipboardMetadata>>(&body).unwrap();
    let clipboard_name = &res[0].name;

    let body = server
        .get(&format!("/api/clipboards/{}", clipboard_name))
        .await
        .text();
    let data = serde_json::from_str::<ClipboardDataResponse>(&body).unwrap();
    let file_id = &data.files[0].id;

    let text = server
        .get(&format!("/api/clipboards/file/{}", file_id))
        .await
        .text();
    assert_eq!(text, file_contents);
}
