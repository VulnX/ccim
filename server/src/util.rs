use std::path::PathBuf;

pub fn get_data_dir() -> PathBuf {
    PathBuf::new().join("data")
}

pub fn get_files_dir() -> PathBuf {
    get_data_dir().join("files")
}

pub async fn cleanup_files(text: Option<String>, files: Vec<String>) {
    if let Some(id) = text {
        delete_file(id).await;
    }
    for id in files {
        delete_file(id).await;
    }
}

async fn delete_file(name: String) {
    tokio::fs::remove_file(get_files_dir().join(name))
        .await
        .unwrap();
}
