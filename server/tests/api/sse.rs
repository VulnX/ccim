use crate::common::{init_test, make_clipboard_form};
use axum::http::{header::ACCEPT, StatusCode};
use serial_test::serial;
use tokio_stream::StreamExt;

#[tokio::test]
#[serial]
async fn test_sse_list() {
    let server = init_test().await;
    let url = format!(
        "{}/api/clipboards",
        server
            .server_address()
            .unwrap()
            .to_string()
            .trim_end_matches('/')
    );
    println!("Testing URL: {}", url);

    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header(ACCEPT, "text/event-stream")
        .send()
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let mut stream = response.bytes_stream();

    // Read first event (initial state)
    let item = stream.next().await.unwrap().unwrap();
    let text = String::from_utf8_lossy(&item);
    println!("Received SSE: {}", text);
    assert!(text.contains("data:"));
    assert!(text.contains("[]")); // Initially empty
}

#[tokio::test]
#[serial]
async fn test_sse_list_updates() {
    let server = init_test().await;
    let url = format!(
        "{}/api/clipboards",
        server
            .server_address()
            .unwrap()
            .to_string()
            .trim_end_matches('/')
    );

    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header(ACCEPT, "text/event-stream")
        .send()
        .await
        .unwrap();

    let mut stream = response.bytes_stream();

    // Skip initial state
    let _ = stream.next().await.unwrap().unwrap();

    // Create a new clipboard
    let form = make_clipboard_form("clip1", 300, None, vec![], false, false).await;
    server
        .post("/api/clipboards")
        .multipart(form)
        .await
        .assert_status(StatusCode::CREATED);

    // Read next event (update)
    let item = stream.next().await.unwrap().unwrap();
    let text = String::from_utf8_lossy(&item);
    assert!(text.contains("clip1"));
}

#[tokio::test]
#[serial]
async fn test_sse_clipboard_events() {
    let server = init_test().await;

    // Create a clipboard
    let form = make_clipboard_form("clip", 300, Some("initial"), vec![], false, false).await;
    server
        .post("/api/clipboards")
        .multipart(form)
        .await
        .assert_status(StatusCode::CREATED);

    let url = format!(
        "{}/api/clipboards/clip/events",
        server
            .server_address()
            .unwrap()
            .to_string()
            .trim_end_matches('/')
    );

    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header(ACCEPT, "text/event-stream")
        .send()
        .await
        .unwrap();

    let mut stream = response.bytes_stream();

    // Update the clipboard
    let info = serde_json::json!({
        "new_text": "updated".as_bytes().to_vec(),
    });
    let part = axum_test::multipart::Part::text(info.to_string());
    let form = axum_test::multipart::MultipartForm::new().add_part("info", part);

    server
        .patch("/api/clipboards/clip")
        .multipart(form)
        .await
        .assert_status_ok();

    // Read update event
    let item = stream.next().await.unwrap().unwrap();
    let text = String::from_utf8_lossy(&item);
    println!("Received Event: {}", text);
    let json_data = text.strip_prefix("data: ").unwrap();
    let data: ccim_server::models::ClipboardDataResponse = serde_json::from_str(json_data).unwrap();
    assert_eq!(data.text, b"updated");
}
