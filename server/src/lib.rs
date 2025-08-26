pub mod error;
pub mod filter;
pub mod models;
pub mod util;
pub mod web;

use anyhow::Result;
use axum::Router;
use tower_http::cors;
use tracing::{info, Level};

pub async fn run() -> Result<()> {
    tracing_subscriber::fmt()
        .with_line_number(true)
        .with_max_level(Level::DEBUG)
        .init();

    util::generate_key_pair().await.unwrap();

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await?;

    info!("Starting axum server on : {listener:?}");
    axum::serve(listener, app()).await?;

    Ok(())
}

pub fn app() -> Router {
    let route_apis = web::api::routes();
    Router::new().nest("/api", route_apis).layer(
        cors::CorsLayer::new()
            .allow_origin(cors::Any)
            .allow_methods(cors::Any)
            .allow_headers(cors::Any)
            .expose_headers(cors::Any),
    )
}
