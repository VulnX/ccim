pub mod error;
pub mod filter;
pub mod models;
pub mod util;
pub mod web;

use std::{env, net::SocketAddr};

use anyhow::Result;
use tracing::{info, Level};

pub async fn run() -> Result<()> {
    tracing_subscriber::fmt()
        .with_line_number(true)
        .with_max_level(Level::DEBUG)
        .init();

    util::generate_key_pair().await.unwrap();

    let port = env::var("PORT")
        .ok()
        .and_then(|p| p.parse::<u16>().ok())
        .unwrap_or(8080);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = tokio::net::TcpListener::bind(addr).await?;

    info!("Starting axum server on : {listener:?}");
    axum::serve(listener, web::app()).await?;

    Ok(())
}
