use crate::{
    error::{Error, Result},
    filter, util,
};
use axum::extract::FromRef;
use rusqlite::{params, params_from_iter, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, iter::repeat_n, sync::Arc};
use tokio::sync::Mutex;

// ----------------------- Database Related Definitions -----------------------

#[derive(Debug)]
struct ClipboardsEntry {
    clipboard_name: String,
    text_file_id: String,
    passwd_hash: Option<Vec<u8>>,
}

#[derive(Debug)]
struct ClipboardFilesEntry {
    file_id: String,
    file_name: String,
}

// ----------------------- Request/Payload Definitions ------------------------

#[derive(Debug, Deserialize)]
pub struct CreateClipboardRequest {
    pub name: String,
    pub expire_after: u64,
    pub passwd_hash: Option<Vec<u8>>,
}

#[derive(Debug)]
pub struct CreateClipboardPayload {
    pub clipboard_name: String,
    pub text_file_id: String,
    pub file_map: HashMap<String, String>,
    pub passwd: Option<Passwd>,
    pub expiry: u64,
}

#[derive(Debug, Deserialize)]
pub struct UpdateClipboardInfoPayload {
    pub new_text: Option<String>,
    pub new_passwd: Option<Vec<u8>>,
    pub passwd: Option<Vec<u8>>,
}

// --------------------------- Response Definitions ---------------------------

#[derive(Debug)]
pub struct FullClipboardData {
    pub name: String,
    pub text_file_id: String,
    pub file_map: HashMap<String, String>,
    pub is_encrypted: bool,
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct GetClipboardsResponse {
    pub name: String,
    pub text: String,
    pub file_map: HashMap<String, String>,
    pub is_encrypted: bool,
}

#[derive(Debug)]
pub struct UpdateClipboardResponse {
    pub text_file_id: Option<String>,
}

#[derive(Debug)]
pub struct DeleteClipboardResponse {
    pub text_file_id: String,
    pub file_ids: Vec<String>,
}

// ----------------------------------- misc -----------------------------------

#[derive(Debug, Deserialize)]
pub struct ClipboardInfo {
    pub name: String,
    pub expire_after: u64,
    pub passwd: Option<Passwd>,
}

#[derive(Debug, Deserialize)]
pub struct Passwd {
    pub hash: Vec<u8>,
    pub timestamp: u64,
}

// ----------------------------------------------------------------------------

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
  text_file_id TEXT NOT NULL,
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

    /// Add a new clipboard to the database
    ///
    /// ## Arguments
    /// * `clipboard` - A `CreateClipboardPayload` type request containg new clipboard data
    ///
    /// ## Returns
    /// * A `Result` containing nothing on success, or an `Error` on failure.
    pub async fn add_clipboard(&self, clipboard: CreateClipboardPayload) -> Result<()> {
        let conn = self.db.lock().await;
        let passwd_hash = clipboard.passwd.map(|passwd| passwd.hash);
        conn.execute(
            "INSERT INTO clipboards (clipboard_name, text_file_id, passwd_hash, expiry) VALUES (?1, ?2, ?3, ?4)",
            params![
                clipboard.clipboard_name,
                clipboard.text_file_id,
                passwd_hash,
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
                    _ => Error::Database(e),
                }
            } else {
                Error::Database(e)
            }
        })?;
        for (name, id) in clipboard.file_map {
            conn.execute(
                    "INSERT INTO clipboard_files (file_id, file_name, clipboard_name) VALUES (?1, ?2, ?3)",
                    params![id, name, clipboard.clipboard_name,],
                )
                .map_err(|e| {
                    // Only constraint is on `id` field which is realistically
                    // never going to collide
                    Error::Database(e)
                })?;
        }
        Ok(())
    }

    /// Get all existing clipboards details.
    ///
    /// ## Arguments
    /// * None
    ///
    /// ## Returns
    /// * A `Result` containing a `Vec` of `FullClipboardData` on success, or an `Error` on failure.
    ///
    /// ## Notes
    /// * Invoking this function automatically calls the `clear_expired_clipboards`
    ///   filter which removes expired clipboards details from the database as
    ///   well as from the filesystem
    pub async fn get_clipboards(&self) -> Result<Vec<FullClipboardData>> {
        filter::clear_expired_clipboards(self.db.clone()).await?;

        let conn = self.db.lock().await;

        let mut stmt = conn
            .prepare("SELECT clipboard_name, text_file_id, passwd_hash FROM clipboards")
            .map_err(Error::Database)?;

        let clipboard_rows = stmt
            .query_map([], |row| {
                Ok(ClipboardsEntry {
                    clipboard_name: row.get(0)?,
                    text_file_id: row.get(1)?,
                    passwd_hash: row.get(2)?,
                })
            })
            .map_err(Error::Database)?;

        let mut clipboards: Vec<FullClipboardData> = Vec::new();

        for clipboard_row in clipboard_rows.filter_map(|row| row.ok()) {
            let mut stmt = conn
                .prepare("SELECT file_id, file_name FROM clipboard_files WHERE clipboard_name = ?")
                .map_err(Error::Database)?;

            let files_rows = stmt
                .query_map([&clipboard_row.clipboard_name], |row| {
                    Ok(ClipboardFilesEntry {
                        file_id: row.get(0)?,
                        file_name: row.get(1)?,
                    })
                })
                .map_err(Error::Database)?;

            let mut clipboard = FullClipboardData {
                name: clipboard_row.clipboard_name,
                text_file_id: clipboard_row.text_file_id,
                is_encrypted: clipboard_row.passwd_hash.is_some(),
                file_map: HashMap::new(),
            };

            for file in files_rows.filter_map(|row| row.ok()) {
                clipboard.file_map.insert(file.file_name, file.file_id);
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
        given_passwd: Option<Passwd>,
    ) -> Result<DeleteClipboardResponse> {
        self.ensure_clipboard_exists(&clipboard_name).await?;

        // Lock the database connection for this operation
        let conn = self.db.lock().await;

        // If clipboard is encrypted, verify the provided password
        let mut stmt = conn
            .prepare("SELECT passwd_hash from clipboards WHERE clipboard_name = ?")
            .map_err(Error::Database)?;
        let stored_passwd = stmt
            .query_row([&clipboard_name], |row| row.get::<_, Option<Vec<u8>>>(0))
            .map_err(Error::Database)?;
        if let Some(stored_hash) = stored_passwd {
            let given_passwd = given_passwd.ok_or(Error::BadRequest(Some(
                "Password is needed to delete encrypted clipboard",
            )))?;
            if given_passwd.hash != stored_hash {
                return Err(Error::Unauthorized(Some("Invalid password!")));
            }
        }

        // Fetch the text_file_id for the specified clipboard.
        let mut stmt = conn
            .prepare("SELECT text_file_id FROM clipboards WHERE clipboard_name = ?")
            .map_err(Error::Database)?;
        let text_file_id = stmt
            .query_row([&clipboard_name], |row| row.get(0))
            .map_err(Error::Database)?;

        // Fetch all file_ids associated with the clipboard.
        let mut stmt = conn
            .prepare("SELECT file_id FROM clipboard_files WHERE clipboard_name = ?")
            .map_err(Error::Database)?;
        let file_ids: Vec<String> = stmt
            .query_map([&clipboard_name], |row| {
                let file_id: String = row.get(0)?;
                Ok(file_id)
            })
            .map_err(Error::Database)?
            .filter_map(|row| row.ok()) // Filter out any errors during row processing.
            .collect();

        // Delete all clipboard file entries associated with the clipboard name.
        conn.execute(
            "DELETE FROM clipboard_files WHERE clipboard_name = ?",
            [&clipboard_name],
        )
        .map_err(Error::Database)?;

        // Delete the clipboard entry itself from the clipboards table.
        conn.execute(
            "DELETE FROM clipboards WHERE clipboard_name = ?",
            [&clipboard_name],
        )
        .map_err(Error::Database)?;

        // Return a successful response containing the text_file_id and associated file_ids.
        Ok(DeleteClipboardResponse {
            text_file_id,
            file_ids,
        })
    }

    /// Updates details and files regarding a specific clipboard.
    ///
    /// ## Arguments
    /// * `clipboard_name` - The name of the clipboard to be updated.
    /// * `info_payload` - An `UpdateClipboardInfoRequest` type request specifying which fields to update.
    /// * `delete_payload` - A `Vec<String>` type request specifying which fields to remove.
    /// * `added_file_map` - A `HashMap<String, String>` type request specifying (filename, fileid) for newly added files.
    ///
    /// ## Returns
    /// * A `Result` containing the `UpdateClipboardResponse` on success, or an `Error` on failure.
    ///
    /// ## Notes
    /// * This only affects the database, not the actual content in filesystem.
    /// * For example while specifying a `new_text` this function only returns
    ///   the `text_file_id` for the filesystem path of the stored text content.
    ///   The caller must ensure to update it in the filesystem themself.
    pub async fn update_clipboard(
        &self,
        clipboard_name: &String,
        info_payload: &Option<UpdateClipboardInfoPayload>,
        delete_payload: &Vec<String>,
        added_file_map: &HashMap<String, String>,
    ) -> Result<UpdateClipboardResponse> {
        self.ensure_clipboard_exists(clipboard_name).await?;
        let mut res = UpdateClipboardResponse { text_file_id: None };

        // If clipboard is encrypted, verify the provided password
        let stored_passwd = {
            let conn = self.db.lock().await;
            let mut stmt = conn
                .prepare("SELECT passwd_hash FROM clipboards WHERE clipboard_name = ?")
                .map_err(Error::Database)?;

            let stored_passwd = stmt
                .query_row([&clipboard_name], |row| row.get::<_, Option<Vec<u8>>>(0))
                .map_err(Error::Database)?;
            stored_passwd
        };
        if let Some(stored_hash) = stored_passwd {
            let Some(info) = info_payload else {
                return Err(Error::BadRequest(Some(
                    "Part `info` is needed to update encrypted clipboard",
                )));
            };
            let given_passwd_bytes = info.passwd.clone().ok_or(Error::BadRequest(Some(
                "Password is needed to update encrypted clipboard",
            )))?;
            let given_passwd = util::get_passwd(given_passwd_bytes).await?;
            if given_passwd.hash != stored_hash {
                return Err(Error::Unauthorized(Some("Invalid password!")));
            }
        }

        let conn = self.db.lock().await;

        // If non empty list, delete files
        if !delete_payload.is_empty() {
            let query = repeat_n("?", delete_payload.len())
                .collect::<Vec<_>>()
                .join(", ");
            let query = format!(
                "DELETE FROM clipboard_files WHERE file_id in ({query}) AND clipboard_name = ?"
            );
            let mut stmt = conn.prepare(&query).map_err(Error::Database)?;
            let mut delete_payload = delete_payload.clone();
            delete_payload.push(clipboard_name.into());
            stmt.execute(params_from_iter::<Vec<String>>(delete_payload))
                .map_err(Error::Database)?;
        }

        // Append new file details
        for (file_name, file_id) in added_file_map {
            let mut stmt = conn
                    .prepare("INSERT INTO clipboard_files (file_id, file_name, clipboard_name) VALUES (?1, ?2, ?3)")
                    .map_err(Error::Database)?;
            stmt.execute([file_id, file_name, clipboard_name])
                .map_err(Error::Database)?;
        }

        drop(conn); // Drop mutex guard here to allow further nested calls to
                    // acquire it
                    // Update info at last. This is deliberately done at the
                    // end because updating `info` might lead to changing
                    // `name` which will break other INSERT/DELETE queries
                    // PS : Updating `name` is NOT supported as of now. This only exists as
                    // a sort of reminder for the future, preventing potentials bugs
        if let Some(info) = info_payload {
            res.text_file_id = self.update_clipboard_info(clipboard_name, info).await?;
        }
        Ok(res)
    }

    /// Updates selective fields for the associated clipboard.
    ///
    /// ## Updatable details fields
    /// * `new_text` - Text field of the clipboard
    /// * `new_passwd` - Password field of the clipboard
    ///
    /// ## Arguments
    /// * `clipboard_name` - The name of the clipboard to be updated.
    /// * `info` - An `UpdateClipboardInfoRequest` type request specifying which fields to update.
    ///
    /// ## Returns
    /// * A `Result` containing the `Option<String>` of text file id on success, or an `Error` on failure.
    async fn update_clipboard_info(
        &self,
        clipboard_name: &String,
        info: &UpdateClipboardInfoPayload,
    ) -> Result<Option<String>> {
        let mut res = None;

        let conn = self.db.lock().await;

        // Return `text_file_id` to caller to update text content in filesystem
        if info.new_text.is_some() {
            let mut stmt = conn
                .prepare("SELECT text_file_id FROM clipboards WHERE clipboard_name = ?")
                .map_err(Error::Database)?;
            let text_file_id = stmt
                .query_row([&clipboard_name], |row| row.get::<_, String>(0))
                .map_err(Error::Database)?;
            res = Some(text_file_id);
        }

        // Update password
        // TODO : How will one remove the password from an encrypted clipboard
        if let Some(new_passwd_bytes) = info.new_passwd.clone() {
            let new_passwd = util::get_passwd(new_passwd_bytes).await?;
            let mut stmt = conn
                .prepare("UPDATE clipboards SET passwd_hash = ? WHERE clipboard_name = ?")
                .map_err(Error::Database)?;
            stmt.execute(params![new_passwd.hash, &clipboard_name])
                .map_err(Error::Database)?;
        }

        // TODO : How about updating the name as well. Not possible in current
        // implementation because `clipboard_name` field is used as a foreign
        // key for `clipboard_files` table
        Ok(res)
    }

    async fn ensure_clipboard_exists(&self, clipboard_name: &String) -> Result<()> {
        let conn = self.db.lock().await;
        let mut stmt = conn
            .prepare("SELECT 1 FROM clipboards WHERE clipboard_name = ?")
            .map_err(Error::Database)?;
        let exists = stmt
            .query_row([&clipboard_name], |_| Ok(()))
            .optional()
            .map_err(Error::Database)?;
        if exists.is_none() {
            return Err(Error::ClipboardDoesNotExist);
        }
        Ok(())
    }
}
