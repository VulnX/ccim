use std::sync::Arc;

use chrono::Utc;
use rusqlite::Connection;
use tokio::sync::Mutex;

use crate::{
    error::{Error, Result},
    util,
};

struct ClipboardExpiry {
    clipboard_name: String,
    expiry: u64,
}

pub async fn clear_expired_clipboards(db: Arc<Mutex<Connection>>) -> Result<()> {
    let cleanup_jobs = {
        let conn = db.lock().await;

        // Fetch all clipboards along with their expiry
        let current_time = Utc::now().timestamp() as u64;
        let mut stmt = conn
            .prepare("SELECT clipboard_name, expiry FROM clipboards")
            .map_err(Error::Database)?;
        let clipboards = stmt
            .query_map([], |row| {
                Ok(ClipboardExpiry {
                    clipboard_name: row.get(0)?,
                    expiry: row.get(1)?,
                })
            })
            .map_err(Error::Database)?;

        // Filter them based on which ones have expired at this moment
        let mut to_delete = Vec::new();
        for clipboard in clipboards.filter_map(|row| row.ok()) {
            if clipboard.expiry <= current_time {
                to_delete.push(clipboard.clipboard_name);
            }
        }

        // Fetch `text_file_id` and `file_id` for each file from each clipboard
        // And store it temporarily in a vector. Also delete those records from
        // the database itself
        let mut cleanup_jobs = Vec::new();
        for clipboard_name in to_delete {
            let mut stmt = conn
                .prepare("SELECT text_file_id FROM clipboards WHERE clipboard_name = ?")
                .map_err(Error::Database)?;
            let text_file_id = stmt
                .query_row([&clipboard_name], |row| row.get::<_, String>(0))
                .map_err(Error::Database)?;
            let mut stmt = conn
                .prepare("SELECT file_id from clipboard_files WHERE clipboard_name = ?")
                .map_err(Error::Database)?;
            let file_ids = stmt
                .query_map([&clipboard_name], |row| row.get::<_, String>(0))
                .map_err(Error::Database)?;
            let file_ids: Vec<String> = file_ids.filter_map(|file_id| file_id.ok()).collect();
            conn.execute(
                "DELETE FROM clipboard_files WHERE clipboard_name = ?",
                [&clipboard_name],
            )
            .map_err(Error::Database)?;
            conn.execute(
                "DELETE FROM clipboards WHERE clipboard_name = ?",
                [&clipboard_name],
            )
            .map_err(Error::Database)?;
            cleanup_jobs.push((text_file_id, file_ids));
        }

        cleanup_jobs // Return the stored `cleanup_jobs`
    }; // Scope ends, this will lead to `conn` being dropped
       // This allows async code to be executed below

    // Delete all files from the filesystem as well
    for (text_file_id, file_ids) in cleanup_jobs {
        util::cleanup_files(text_file_id, file_ids).await;
    }
    Ok(())
}
