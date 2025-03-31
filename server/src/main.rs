use anyhow::Result;
use axum::Router;
use tracing::Level;
mod error;
mod models;
mod web;

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_line_number(true)
        .with_max_level(Level::DEBUG)
        .init();

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await?;

    println!("starting axum server on : {:?}", listener);
    axum::serve(listener, app()).await?;

    Ok(())
}

fn app() -> Router {
    let route_apis = web::api::routes();
    Router::new().nest("/api", route_apis)
}

#[cfg(test)]
mod api_test {
    use axum::http::StatusCode;
    use axum_test::{
        multipart::{MultipartForm, Part},
        TestServer,
    };
    use serde_json::json;
    use std::path::PathBuf;

    use super::*;

    async fn clear_data_dir() {
        let _ = tokio::fs::remove_dir_all(PathBuf::new().join("data")).await;
        let _ = tokio::fs::create_dir_all(PathBuf::new().join("data").join("files")).await;
    }

    #[tokio::test]
    async fn test_successful_upload() {
        clear_data_dir().await;

        let app = app();
        let server = TestServer::new(app).unwrap();
        let info = json!({
            "name": "some clipboard name",
            "is_encrypted": false,
            "expire_after": 300,
        });
        let info = Part::text(info.to_string());
        let text = Part::text("some clipboard text here");
        let file = Part::bytes("file contents here".as_bytes().to_vec()).file_name("example.txt");
        let form = MultipartForm::new()
            .add_part("text", text)
            .add_part("file", file)
            .add_part("info", info);
        let response = server.post("/api/clipboards").multipart(form).await;
        response.assert_status(StatusCode::CREATED);
    }

    #[tokio::test]
    async fn test_empty_get() {
        clear_data_dir().await;

        let app = app();
        let server = TestServer::new(app).unwrap();
        let response = server.get("/api/clipboards").await;
        response.assert_status(StatusCode::NO_CONTENT);
    }

    #[tokio::test]
    async fn test_successful_get() {
        clear_data_dir().await;

        let app = app();
        let server = TestServer::new(app).unwrap();
        let info = json!({
            "name": "some clipboard name",
            "is_encrypted": false,
            "expire_after": 300,
        });
        let info = Part::text(info.to_string());
        let text = Part::text("some clipboard text here");
        let file = Part::bytes("file contents here".as_bytes().to_vec()).file_name("example.txt");
        let form = MultipartForm::new()
            .add_part("text", text)
            .add_part("file", file)
            .add_part("info", info);
        server.post("/api/clipboards").multipart(form).await;

        let response = server.get("/api/clipboards").await;
        response.assert_status(StatusCode::OK);
    }
}
