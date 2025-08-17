use chrono::Utc;
use rand::rngs::OsRng;
use rsa::{
    pkcs1::{DecodeRsaPrivateKey, DecodeRsaPublicKey, EncodeRsaPrivateKey, EncodeRsaPublicKey},
    Oaep, RsaPrivateKey, RsaPublicKey,
};
use sha2::Sha256;
use std::path::PathBuf;
use tracing::info;

use crate::{
    error::{Error, Result},
    models,
};

pub fn get_data_dir() -> PathBuf {
    let path = PathBuf::new().join("data");
    ensure_dir_exists(&path);
    path
}

pub fn get_files_dir() -> PathBuf {
    let path = get_data_dir().join("files");
    ensure_dir_exists(&path);
    path
}

fn ensure_dir_exists(path: &PathBuf) {
    if !path.exists() {
        std::fs::create_dir_all(path).unwrap();
    }
}

pub async fn cleanup_files(text: String, files: Vec<String>) {
    delete_file(text).await;
    for id in files {
        delete_file(id).await;
    }
}

pub async fn delete_file(id: String) {
    tokio::fs::remove_file(get_files_dir().join(id))
        .await
        .unwrap();
}

pub async fn generate_key_pair() -> Result<()> {
    info!("Generating new key pair...");
    let private_key =
        RsaPrivateKey::new(&mut OsRng, 2048).map_err(|e| Error::Unhandled(e.into()))?;
    let public_key = RsaPublicKey::from(&private_key);

    let private_key = private_key
        .to_pkcs1_pem(rsa::pkcs1::LineEnding::LF)
        .map_err(|e| Error::Unhandled(e.into()))?;
    let public_key = public_key
        .to_pkcs1_pem(rsa::pkcs1::LineEnding::LF)
        .map_err(|e| Error::Unhandled(e.into()))?;
    tokio::fs::write(get_data_dir().join("private.pem"), private_key)
        .await
        .map_err(|e| Error::Unhandled(e.into()))?;
    tokio::fs::write(get_data_dir().join("public.pem"), public_key)
        .await
        .map_err(|e| Error::Unhandled(e.into()))?;
    info!("Saved to disk");
    Ok(())
}

async fn decrypt(data: Vec<u8>) -> Result<Vec<u8>> {
    let private_key_pem = tokio::fs::read_to_string(get_data_dir().join("private.pem"))
        .await
        .map_err(|e| Error::Unhandled(e.into()))?;
    let private_key =
        RsaPrivateKey::from_pkcs1_pem(&private_key_pem).map_err(|e| Error::Unhandled(e.into()))?;
    let padding = Oaep::new::<Sha256>();
    let decrypted_data = private_key
        .decrypt(padding, &data)
        .map_err(|e| Error::Unhandled(e.into()))?;
    Ok(decrypted_data)
}

#[allow(dead_code)] // False positive ... used in tests
pub async fn encrypt(data: Vec<u8>) -> Vec<u8> {
    let public_key_pem = tokio::fs::read_to_string(PathBuf::new().join("data").join("public.pem"))
        .await
        .unwrap();
    let public_key = RsaPublicKey::from_pkcs1_pem(&public_key_pem).unwrap();
    let padding = Oaep::new::<Sha256>();
    public_key.encrypt(&mut OsRng, padding, &data).unwrap()
}

/// Obtain `PasswdHash` from a bytes type object.
///
/// Performs the decryption part as well
///
/// Performs sanity checks, ensuring:
///     - Timestamp difference is no more than 5 minutes
pub async fn get_passwd(bytes: Vec<u8>) -> Result<models::Passwd> {
    let passwd_json = decrypt(bytes).await?;
    let passwd = serde_json::from_slice::<models::Passwd>(&passwd_json)
        .map_err(|_| Error::BadRequest(Some("Failed to parse json field `PasswdHash`")))?;
    if 5 * 60 < Utc::now().timestamp() as u64 - passwd.timestamp {
        return Err(Error::BadRequest(Some(
            "Timeout! timestamp difference cannot exceed 5 minutes",
        )));
    }
    Ok(passwd)
}
