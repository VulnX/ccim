use axum_test::{
    multipart::{MultipartForm, Part},
    TestServer,
};
use ccim_server::util;
use chrono::Utc;
use serde_json::json;

pub const CLIPBOARD_TEXT: &'static str = "some clipboard text";

pub async fn init_test() -> TestServer {
    let _ = tokio::fs::remove_dir_all(ccim_server::util::get_files_dir()).await;
    let _ = tokio::fs::remove_file(ccim_server::util::get_data_dir().join("database.db3")).await;
    if !ccim_server::util::get_data_dir()
        .join("private.pem")
        .exists()
        || !ccim_server::util::get_data_dir()
            .join("public.pem")
            .exists()
    {
        ccim_server::util::generate_key_pair().await.unwrap();
    }
    TestServer::new(ccim_server::app()).unwrap()
}

pub async fn make_clipboard_form(
    name: &str,
    expire_after: u64,
    text: Option<&str>,
    files: Vec<(&str, &str)>,
    encrypted: bool,
) -> MultipartForm {
    let mut info = json!({ "name": name, "expire_after": expire_after });
    if encrypted {
        let passwd_hash = json!({
            "hash": vec![0],
            "timestamp": Utc::now().timestamp() as u64,
        })
        .to_string();
        info["passwd_hash"] = json!(util::encrypt(passwd_hash.into()).await);
    }
    let mut form = MultipartForm::new().add_part("info", Part::text(info.to_string()));
    if let Some(txt) = text {
        form = form.add_part("text", Part::text(txt));
    }
    for (filename, contents) in files {
        form = form.add_part(
            "file",
            Part::bytes(contents.as_bytes().to_vec()).file_name(filename),
        );
    }
    form
}
