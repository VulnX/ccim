use crate::error::{Error, Result};
use axum::extract::FromRef;
use rusqlite::{params, Connection};
use serde::Deserialize;
use std::{path::PathBuf, sync::Arc};
use tokio::sync::Mutex;

#[derive(Debug)]
pub struct ClipboardEntry {
    pub name: String,
    pub text: Option<String>,
    pub is_encrypted: bool,
    pub expiry: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateClipboardEntryRequest {
    pub name: String,
    pub text: Option<String>,
    pub is_encrypted: bool,
}

#[derive(Debug, Clone, FromRef)]
pub struct DatabaseController {
    db: Arc<Mutex<Connection>>,
}

impl DatabaseController {
    pub fn new() -> Self {
        std::fs::create_dir_all(PathBuf::new().join("data").join("files")).unwrap();
        let conn = Connection::open(PathBuf::new().join("data").join("database.db3")).unwrap();
        conn.execute(
            "
        CREATE TABLE IF NOT EXISTS clipboards
(
  name TEXT NOT NULL,
  text TEXT,
  is_encrypted INT NOT NULL,
  expiry DATE NOT NULL,
  PRIMARY KEY (name),
  UNIQUE (text)
);",
            [],
        )
        .unwrap();
        conn.execute(
            "
CREATE TABLE IF NOT EXISTS clipboard_files
(
  file TEXT NOT NULL,
  name TEXT NOT NULL,
  PRIMARY KEY (file, name),
  FOREIGN KEY (name) REFERENCES clipboards(name)
);",
            [],
        )
        .unwrap();
        Self {
            db: Arc::new(Mutex::new(conn)),
        }
    }

    pub async fn get_clipboards(&self) -> Result<Vec<ClipboardEntry>> {
        let conn = self.db.lock().await;
        let mut stmt = conn
            .prepare("SELECT name, text, is_encrypted, expiry FROM clipboards")
            .map_err(|_| Error::FailedToQueryDB)?;
        let clipboards = stmt
            .query_map([], |row| {
                Ok(ClipboardEntry {
                    name: row.get(0)?,
                    text: row.get(1)?,
                    is_encrypted: row.get(2)?,
                    expiry: row.get(3)?,
                })
            })
            .unwrap()
            .filter_map(|clip| clip.ok())
            .collect();
        Ok(clipboards)
    }

    pub async fn add_clipboard(&self, clipboard: ClipboardEntry) -> Result<()> {
        let conn = self.db.lock().await;
        conn.execute(
            "INSERT INTO clipboards (name, text, is_encrypted, expiry) VALUES (?1, ?2, ?3, ?4)",
            params![
                clipboard.name,
                clipboard.text,
                clipboard.is_encrypted,
                clipboard.expiry
            ],
        )
        .map_err(|_| Error::FailedToInsertIntoDB)?;
        Ok(())
    }
}
