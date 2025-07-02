use std::sync::Arc;

use chrono::Utc;
use rusqlite::Connection;
use tokio::sync::Mutex;

use crate::error::{Error, Result};

struct ClipboardExpiry {
    clipboard_name: String,
    expiry: u64,
}

pub async fn clear_expired_clipboards(db: Arc<Mutex<Connection>>) -> Result<()> {
    let conn = db.lock().await;
    let current_time = Utc::now().timestamp() as u64;
    let mut stmt = conn
        .prepare("SELECT clipboard_name, expiry FROM clipboards")
        .map_err(|e| Error::Unhandled(e.into()))?;
    let clipboards = stmt
        .query_map([], |row| {
            Ok(ClipboardExpiry {
                clipboard_name: row.get(0)?,
                expiry: row.get(1)?,
            })
        })
        .map_err(|e| Error::Unhandled(e.into()))?;
    let mut to_delete = Vec::new();
    for clipboard in clipboards.filter_map(|row| row.ok()) {
        if clipboard.expiry < current_time {
            to_delete.push(clipboard.clipboard_name);
        }
    }
    for clipboard_name in to_delete {
        conn.execute(
            "DELETE FROM clipboard_files WHERE clipboard_name = ?",
            [&clipboard_name],
        )
        .map_err(|e| Error::Unhandled(e.into()))?;
        conn.execute(
            "DELETE FROM clipboards WHERE clipboard_name = ?",
            [&clipboard_name],
        )
        .map_err(|e| Error::Unhandled(e.into()))?;
    }
    Ok(())
}
