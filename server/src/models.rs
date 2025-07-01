use crate::{
    error::{Error, Result},
    util,
};
use axum::extract::FromRef;
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, sync::Arc};
use tokio::sync::Mutex;

#[derive(Debug, Deserialize)]
pub struct ClipboardOptionsRequest {
    pub name: String,
    pub expire_after: u64,
    pub passwd_hash: Vec<u8>,
}

#[derive(Debug, Deserialize)]
pub struct ClipboardOptions {
    pub name: String,
    pub expire_after: u64,
    pub passwd_hash: PasswdHash,
}

#[derive(Debug, Deserialize)]
pub struct PasswdHash {
    pub hash: Vec<u8>,
    pub timestamp: u64,
}

#[derive(Debug)]
pub struct CreateClipboardPayload {
    pub clipboard_name: String,
    pub text_file_id: Option<String>,
    pub files: HashMap<String, String>,
    pub passwd_hash: PasswdHash,
    pub expiry: u64,
}

#[derive(Debug)]
pub struct DeleteClipboardResponse {
    pub text_file_id: Option<String>,
    pub file_ids: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct GetClipboardsResponse {
    pub name: String,
    pub text: Option<String>,
    pub files: Vec<String>,
    pub is_encrypted: bool,
}

#[derive(Debug, Serialize)]
pub struct FullClipboardData {
    pub name: String,
    pub text: Option<String>,
    pub files: HashMap<String, String>,
    pub is_encrypted: bool,
}

#[derive(Debug)]
struct ClipboardsEntry {
    clipboard_name: String,
    text_file_id: Option<String>,
    passwd_hash: Vec<u8>,
    _expiry: u64,
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

impl Default for DatabaseController {
    fn default() -> Self {
        Self::new()
    }
}

impl DatabaseController {
    pub fn new() -> Self {
        std::fs::create_dir_all(util::get_files_dir()).unwrap();
        let conn = Connection::open(util::get_data_dir().join("database.db3")).unwrap();
        conn.execute(
            "
CREATE TABLE IF NOT EXISTS clipboards
(
  clipboard_name TEXT NOT NULL,
  text_file_id TEXT,
  passwd_hash BLOB,
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
  FOREIGN KEY (clipboard_name) REFERENCES clipboards(clipboard_name)
);",
            [],
        )
        .unwrap();
        Self {
            db: Arc::new(Mutex::new(conn)),
        }
    }

    pub async fn add_clipboard(&self, clipboard: CreateClipboardPayload) -> Result<()> {
        let conn = self.db.lock().await;
        conn.execute(
            "INSERT INTO clipboards (clipboard_name, text_file_id, passwd_hash, expiry) VALUES (?1, ?2, ?3, ?4)",
            params![
                clipboard.clipboard_name,
                clipboard.text_file_id,
                clipboard.passwd_hash.hash,
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
                    _ => Error::Unhandled(e.into()),
                }
            } else {
                Error::Unhandled(e.into())
            }
        })?;
        for (name, id) in clipboard.files {
            conn.execute(
                    "INSERT INTO clipboard_files (file_id, file_name, clipboard_name) VALUES (?1, ?2, ?3)",
                    params![id, name, clipboard.clipboard_name,],
                )
                .map_err(|e| {
                    // Only constraint is on `id` field which is realistically
                    // never going to collide
                    Error::Unhandled(e.into())
                })?;
        }
        Ok(())
    }

    pub async fn get_clipboards(&self) -> Result<Vec<FullClipboardData>> {
        let conn = self.db.lock().await;

        let mut stmt = conn
            .prepare("SELECT clipboard_name, text_file_id, passwd_hash, expiry FROM clipboards")
            .map_err(|e| Error::Unhandled(e.into()))?;

        let clipboard_rows = stmt
            .query_map([], |row| {
                Ok(ClipboardsEntry {
                    clipboard_name: row.get(0)?,
                    text_file_id: row.get(1)?,
                    passwd_hash: row.get(2)?,
                    _expiry: row.get(3)?,
                })
            })
            .map_err(|e| Error::Unhandled(e.into()))?;

        let mut clipboards: Vec<FullClipboardData> = Vec::new();

        // TODO : filter those which have expired

        for clipboard_row in clipboard_rows.filter_map(|row| row.ok()) {
            let mut stmt = conn
                .prepare("SELECT file_id, file_name FROM clipboard_files WHERE clipboard_name = ?")
                .map_err(|e| Error::Unhandled(e.into()))?;

            let files_rows = stmt
                .query_map([&clipboard_row.clipboard_name], |row| {
                    Ok(ClipboardFilesEntry {
                        file_id: row.get(0)?,
                        file_name: row.get(1)?,
                    })
                })
                .map_err(|e| Error::Unhandled(e.into()))?;

            let mut clipboard = FullClipboardData {
                name: clipboard_row.clipboard_name,
                text: clipboard_row.text_file_id,
                is_encrypted: clipboard_row.passwd_hash.is_empty(),
                files: HashMap::new(),
            };

            for file in files_rows.filter_map(|row| row.ok()) {
                clipboard.files.insert(file.file_name, file.file_id);
            }

            clipboards.push(clipboard);
        }
        Ok(clipboards)
    }

    /// Deletes a clipboard entry and associated clipboard files from the database.
    ///
    /// ## Arguments
    /// * `clipboard_name` - The name of the clipboard to be deleted.
    ///
    /// ## Returns
    /// * A `Result` containing the `DeleteClipboardResponse` on success, or an `Error` on failure.
    pub async fn delete_clipboard(
        &self,
        clipboard_name: String,
    ) -> Result<DeleteClipboardResponse> {
        self.ensure_clipboard_exists(&clipboard_name).await?;

        // Lock the database connection for this operation
        let conn = self.db.lock().await;

        // Fetch the text_file_id for the specified clipboard.
        let mut stmt = conn
            .prepare("SELECT text_file_id FROM clipboards WHERE clipboard_name = ?")
            .map_err(|e| Error::Unhandled(e.into()))?;
        let mut clipboards_row = stmt
            .query_map([&clipboard_name], |row| {
                let text_file_id: String = row.get(0)?;
                Ok(text_file_id)
            })
            .map_err(|e| Error::Unhandled(e.into()))?;
        let text_file_id = clipboards_row.next().and_then(|row| row.ok());

        // Fetch all file_ids associated with the clipboard.
        let mut stmt = conn
            .prepare("SELECT file_id FROM clipboard_files WHERE clipboard_name = ?")
            .map_err(|e| Error::Unhandled(e.into()))?;
        let file_ids: Vec<String> = stmt
            .query_map([&clipboard_name], |row| {
                let file_id: String = row.get(0)?;
                Ok(file_id)
            })
            .map_err(|e| Error::Unhandled(e.into()))?
            .filter_map(|row| row.ok()) // Filter out any errors during row processing.
            .collect();

        // Delete all clipboard file entries associated with the clipboard name.
        conn.execute(
            "DELETE FROM clipboard_files WHERE clipboard_name = ?",
            [&clipboard_name],
        )
        .map_err(|e| Error::Unhandled(e.into()))?;

        // Delete the clipboard entry itself from the clipboards table.
        conn.execute(
            "DELETE FROM clipboards WHERE clipboard_name = ?",
            [&clipboard_name],
        )
        .map_err(|e| Error::Unhandled(e.into()))?;

        // Return a successful response containing the text_file_id and associated file_ids.
        Ok(DeleteClipboardResponse {
            text_file_id,
            file_ids,
        })
    }

    async fn ensure_clipboard_exists(&self, clipboard_name: &String) -> Result<()> {
        let conn = self.db.lock().await;
        let mut stmt = conn
            .prepare("SELECT 1 FROM clipboards WHERE clipboard_name = ?")
            .map_err(|e| Error::Unhandled(e.into()))?;
        let exists = stmt
            .query_row([&clipboard_name], |_| Ok(()))
            .optional()
            .map_err(|e| Error::Unhandled(e.into()))?;
        if exists.is_none() {
            return Err(Error::ClipboardDoesNotExist);
        }
        Ok(())
    }

    pub async fn get_file_id(&self, clipboard_name: &String) -> Result<Option<String>> {
        self.ensure_clipboard_exists(clipboard_name).await?;
        let conn = self.db.lock().await;
        let mut stmt = conn
            .prepare("SELECT text_file_id FROM clipboards WHERE clipboard_name = ?")
            .map_err(|e| Error::Unhandled(e.into()))?;
        let id = stmt
            .query_row([clipboard_name], |row| {
                let id: Option<String> = row.get(0)?;
                Ok(id)
            })
            .map_err(|e| Error::Unhandled(e.into()))?;
        Ok(id)
    }
}
