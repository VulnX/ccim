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
    use serial_test::serial;
    use std::path::PathBuf;

    use super::*;

    async fn init_test() -> TestServer {
        let _ = tokio::fs::remove_dir_all(PathBuf::new().join("data")).await;
        let app = app();
        let server = TestServer::new(app).unwrap();
        server
    }

    #[tokio::test]
    #[serial]
    async fn test_running_server() {
        let server = init_test().await;

        let response = server.get("/api/status").await;
        response.assert_status(StatusCode::OK);
    }

    #[tokio::test]
    #[serial]
    async fn test_successful_upload() {
        let server = init_test().await;

        let info = json!({
            "name": "some clipboard name",
            "passwd_hash": "AAAABBBB",
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
    #[serial]
    async fn test_duplicate_upload() {
        let server = init_test().await;

        let info = json!({
            "name": "some clipboard name",
            "passwd_hash": "AAAABBBB",
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

        let info = json!({
            "name": "some clipboard name",
            "passwd_hash": "AAAABBBB",
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
        response.assert_status(StatusCode::CONFLICT);
    }

    #[tokio::test]
    #[serial]
    async fn test_successful_get() {
        let server = init_test().await;

        let response = server.get("/api/clipboards").await;
        response.assert_status(StatusCode::NO_CONTENT);

        let info = json!({
            "name": "some clipboard name",
            "passwd_hash": "AAAABBBB",
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

    #[tokio::test]
    #[serial]
    async fn test_delete() {
        let server = init_test().await;

        let info = json!({
            "name": "clip1",
            "passwd_hash": "AAAABBBB",
            "expire_after": 30,
        });
        let info = Part::text(info.to_string());
        let form = MultipartForm::new().add_part("info", info);
        let response = server.post("/api/clipboards").multipart(form).await;
        response.assert_status(StatusCode::CREATED);
        let info = json!({
            "name": "clip2",
            "passwd_hash": "AAAABBBB",
            "expire_after": 30,
        });
        let info = Part::text(info.to_string());
        let text = Part::text("some text here");
        let file =
            Part::bytes("some file contents here".as_bytes().to_vec()).file_name("myfile.txt");
        let form = MultipartForm::new()
            .add_part("info", info)
            .add_part("text", text)
            .add_part("file", file);
        let response = server.post("/api/clipboards").multipart(form).await;
        response.assert_status(StatusCode::CREATED);

        let response = server.delete("/api/clipboard/clip1").await;
        response.assert_status(StatusCode::NO_CONTENT);
        let response = server.delete("/api/clipboard/clip2").await;
        response.assert_status(StatusCode::NO_CONTENT);
        let response = server.delete("/api/clipboard/clip3").await;
        response.assert_status(StatusCode::NOT_FOUND);
    }
}
