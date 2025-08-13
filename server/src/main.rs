use anyhow::Result;
use axum::Router;
use tracing::{info, Level};

mod error;
mod filter;
mod models;
mod util;
mod web;

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_line_number(true)
        .with_max_level(Level::DEBUG)
        .init();

    util::generate_key_pair().await.unwrap();

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await?;

    info!("Starting axum server on : {listener:?}");
    axum::serve(listener, app()).await?;

    Ok(())
}

fn app() -> Router {
    let route_apis = web::api::routes();
    Router::new().nest("/api", route_apis)
}

#[cfg(test)]
mod api_test {
    use std::{thread::sleep, time::Duration};

    use axum::http::StatusCode;
    use axum_test::{
        multipart::{MultipartForm, Part},
        TestServer,
    };
    use chrono::Utc;
    use serde_json::json;
    use serial_test::serial;

    use super::*;

    async fn init_test() -> TestServer {
        // Remove only the stored files and database
        // Retain the key pair files to avoid unnecessary slowdown between tests
        let _ = tokio::fs::remove_dir_all(util::get_files_dir()).await;
        let _ = tokio::fs::remove_file(util::get_data_dir().join("database.db3")).await;
        // If either of the keys do not already exist (fresh setup), regenerate them
        let private_key_does_not_exist = !util::get_data_dir().join("private.pem").exists();
        let public_key_does_not_exist = !util::get_data_dir().join("public.pem").exists();
        if private_key_does_not_exist || public_key_does_not_exist {
            util::generate_key_pair().await.unwrap();
        }
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

        let passwd_hash = json!({
            "hash": vec![0],
            "timestamp": Utc::now().timestamp() as u64,
        })
        .to_string();
        let info = json!({
            "name": "some clipboard name",
            "expire_after": 300,
            "passwd_hash": util::encrypt(passwd_hash.into()).await,
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
    async fn test_unencrypted_upload() {
        let server = init_test().await;

        let info = json!({
            "name": "some clipboard name",
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

        let passwd_hash = json!({
            "hash": vec![0],
            "timestamp": Utc::now().timestamp() as u64,
        })
        .to_string();
        let info = json!({
            "name": "some clipboard name",
            "expire_after": 300,
            "passwd_hash": util::encrypt(passwd_hash.into()).await,
        });
        let info = Part::text(info.to_string());
        let text = Part::text("some clipboard text here");
        let file = Part::bytes("file contents here".as_bytes().to_vec()).file_name("example.txt");
        let form = MultipartForm::new()
            .add_part("text", text.clone())
            .add_part("file", file.clone())
            .add_part("info", info.clone());

        let response = server.post("/api/clipboards").multipart(form).await;
        response.assert_status(StatusCode::CREATED);

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

        let passwd_hash = json!({
            "hash": vec![0],
            "timestamp": Utc::now().timestamp() as u64,
        })
        .to_string();
        let info = json!({
            "name": "some clipboard name",
            "expire_after": 300,
            "passwd_hash": util::encrypt(passwd_hash.into()).await,
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

        let response = server.get("/api/clipboards").await;
        response.assert_status(StatusCode::OK);
    }

    #[tokio::test]
    #[serial]
    async fn test_delete() {
        let server = init_test().await;

        let passwd_hash = json!({
            "hash": vec![0],
            "timestamp": Utc::now().timestamp() as u64,
        })
        .to_string();
        let info = json!({
            "name": "clip1",
            "expire_after": 300,
            "passwd_hash": util::encrypt(passwd_hash.into()).await,
        });
        let info = Part::text(info.to_string());
        let form = MultipartForm::new().add_part("info", info);
        let response = server.post("/api/clipboards").multipart(form).await;
        response.assert_status(StatusCode::CREATED);
        let passwd_hash = json!({
            "hash": vec![0],
            "timestamp": Utc::now().timestamp() as u64,
        })
        .to_string();
        let info = json!({
            "name": "clip2",
            "expire_after": 300,
            "passwd_hash": util::encrypt(passwd_hash.into()).await,
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

        let response = server.delete("/api/clipboards/clip1").await;
        response.assert_status(StatusCode::NO_CONTENT);
        let response = server.delete("/api/clipboards/clip2").await;
        response.assert_status(StatusCode::NO_CONTENT);
        let response = server.delete("/api/clipboards/clip3").await;
        response.assert_status(StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    #[serial]
    async fn test_expired_clipboards() {
        let server = init_test().await;

        let passwd_hash = json!({
            "hash": vec![0],
            "timestamp": Utc::now().timestamp() as u64,
        })
        .to_string();
        let info = json!({
            "name": "some clipboard name",
            "expire_after": 0,
            "passwd_hash": util::encrypt(passwd_hash.into()).await,
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

        sleep(Duration::from_secs(1));

        let response = server.get("/api/clipboards").await;
        response.assert_status(StatusCode::NO_CONTENT);
    }

    #[tokio::test]
    #[serial]
    async fn test_update_clipboard() {
        let server = init_test().await;

        let passwd_hash = json!({
            "hash": vec![0],
            "timestamp": Utc::now().timestamp() as u64,
        })
        .to_string();
        let info = json!({
            "name": "clip1",
            "expire_after": 300,
            "passwd_hash": util::encrypt(passwd_hash.into()).await,
        });
        let info = Part::text(info.to_string());
        let text = Part::text("AAAA");
        let form = MultipartForm::new()
            .add_part("info", info)
            .add_part("text", text);
        let response = server.post("/api/clipboards").multipart(form).await;
        response.assert_status(StatusCode::CREATED);

        let passwd_hash = json!({
            "hash": vec![0],
            "timestamp": Utc::now().timestamp() as u64,
        })
        .to_string();
        let info = json!({
            "passwd": util::encrypt(passwd_hash.into()).await,
            "new_text": "BBBB",
        });
        let info = Part::text(info.to_string());
        let form = MultipartForm::new().add_part("info", info);
        let response = server.patch("/api/clipboards/clip1").multipart(form).await;
        response.assert_status(StatusCode::OK);
    }
}
