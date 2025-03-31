use crate::error::{Error, Result};
use axum::extract::FromRef;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, path::PathBuf, sync::Arc};
use tokio::sync::Mutex;

pub fn get_data_dir() -> PathBuf {
    PathBuf::new().join("data")
}

#[derive(Debug, Deserialize)]
pub struct ClipboardOptions {
    pub name: String,
    pub is_encrypted: bool,
    pub expire_after: i64,
}

#[derive(Debug)]
pub struct CreateClipboardPayload {
    pub name: String,
    pub text: Option<String>,
    pub files: Option<HashMap<String, String>>,
    pub is_encrypted: bool,
    pub expiry: i64,
}

#[derive(Debug, Serialize)]
pub struct GetClipboardsResponse {
    pub name: String,
    pub text: Option<String>,
    pub is_encrypted: bool,
    pub files: Option<HashMap<String, String>>,
}

#[derive(Debug)]
struct ClipboardsEntry {
    clipboard_name: String,
    text_file_id: Option<String>,
    is_encrypted: bool,
    expiry: i64,
}

#[derive(Debug)]
struct ClipboardFilesEntry {
    file_id: String,
    file_name: String,
}

#[derive(Debug, Clone, FromRef)]
pub struct DatabaseController {
    db: Arc<Mutex<Connection>>,
}

impl DatabaseController {
    pub fn new() -> Self {
        std::fs::create_dir_all(get_data_dir().join("files")).unwrap();
        let conn = Connection::open(get_data_dir().join("database.db3")).unwrap();
        conn.execute(
            "
        CREATE TABLE IF NOT EXISTS clipboards
(
  clipboard_name TEXT NOT NULL,
  text_file_id TEXT,
  is_encrypted INT NOT NULL,
  expiry INT NOT NULL,
  PRIMARY KEY (clipboard_name),
  UNIQUE (text_file_id)
);",
            [],
        )
        .unwrap();
        conn.execute(
            "
CREATE TABLE IF NOT EXISTS clipboard_files
(
  file_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  clipboard_name TEXT NOT NULL,
  PRIMARY KEY (file_id, file_name, clipboard_name),
  UNIQUE (file_id),
  FOREIGN KEY (clipboard_name) REFERENCES clipboards(clipboard_name)
);",
            [],
        )
        .unwrap();
        Self {
            db: Arc::new(Mutex::new(conn)),
        }
    }

    pub async fn get_clipboards(&self) -> Result<Vec<GetClipboardsResponse>> {
        let conn = self.db.lock().await;

        let mut stmt = conn
            .prepare("SELECT clipboard_name, text_file_id, is_encrypted, expiry FROM clipboards")
            .map_err(|e| Error::UnhandledError(e.into()))?;

        let clipboard_rows = stmt
            .query_map([], |row| {
                Ok(ClipboardsEntry {
                    clipboard_name: row.get(0)?,
                    text_file_id: row.get(1)?,
                    is_encrypted: row.get(2)?,
                    expiry: row.get(3)?,
                })
            })
            .map_err(|e| Error::UnhandledError(e.into()))?;

        let mut clipboards: Vec<GetClipboardsResponse> = Vec::new();

        for clipboard_row in clipboard_rows.filter_map(|row| row.ok()) {
            let mut stmt = conn
                .prepare("SELECT file_id, file_name FROM clipboard_files WHERE clipboard_name = ?")
                .map_err(|e| Error::UnhandledError(e.into()))?;

            let files_rows = stmt
                .query_map([&clipboard_row.clipboard_name], |row| {
                    Ok(ClipboardFilesEntry {
                        file_id: row.get(0)?,
                        file_name: row.get(1)?,
                    })
                })
                .map_err(|e| Error::UnhandledError(e.into()))?;

            let mut clipboard = GetClipboardsResponse {
                name: clipboard_row.clipboard_name,
                text: clipboard_row.text_file_id,
                is_encrypted: clipboard_row.is_encrypted,
                files: None,
            };

            for file in files_rows.filter_map(|row| row.ok()) {
                if clipboard.files.is_none() {
                    clipboard.files = Some(HashMap::new());
                }
                if let Some(file_map) = &mut clipboard.files {
                    file_map.insert(file.file_name, file.file_id);
                }
            }

            clipboards.push(clipboard);
        }
        Ok(clipboards)
    }

    pub async fn add_clipboard(&self, clipboard: CreateClipboardPayload) -> Result<()> {
        let conn = self.db.lock().await;
        conn.execute(
            "INSERT INTO clipboards (clipboard_name, text_file_id, is_encrypted, expiry) VALUES (?1, ?2, ?3, ?4)",
            params![
                clipboard.name,
                clipboard.text,
                clipboard.is_encrypted,
                clipboard.expiry
            ],
        )
        .map_err(|e| {
            if let Some(error) = e.sqlite_error() {
                match error.code {
                    rusqlite::ErrorCode::ConstraintViolation => {
                        // For `clipboards` table the only unique constraint is
                        // on `name` hence we do not need to check which column
                        // caused constraint violation.
                        // Yes `text` field also has unique attribute but since
                        // it is generated via UUID crate, realistically there
                        // should not be any collision.
                        Error::NameAlreadyExistsInDB
                    }
                    _ => Error::UnhandledError(e.into()),
                }
            } else {
                Error::UnhandledError(e.into())
            }
        })?;
        if let Some(files) = clipboard.files {
            for (name, id) in files {
                conn.execute(
                    "INSERT INTO clipboard_files (file_id, file_name, clipboard_name) VALUES (?1, ?2, ?3)",
                    params![id, name, clipboard.name,],
                )
                .map_err(|e| {
                    // Only constraint is on `id` field which is realistically never going to collide
                    Error::UnhandledError(e.into())
                })?;
            }
        }
        Ok(())
    }
}
