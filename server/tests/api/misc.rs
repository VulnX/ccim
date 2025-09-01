use crate::common::init_test;
use rsa::{pkcs8::DecodePublicKey, RsaPublicKey};
use serial_test::serial;

#[tokio::test]
#[serial]
async fn test_status() {
    let server = init_test().await;
    server.get("/api/status").await.assert_status_ok();
}

#[tokio::test]
#[serial]
async fn test_public_key() {
    let server = init_test().await;
    let public_key_pem = server.get("/api/publickey").await.text();
    let public_key = RsaPublicKey::from_public_key_pem(&public_key_pem);
    assert!(public_key.is_ok());
}
