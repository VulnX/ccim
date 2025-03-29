use anyhow::Result;
use axum::Router;
mod error;
mod models;
mod web;

#[tokio::main]
async fn main() -> Result<()> {
    let route_apis = web::api::routes();
    let app = Router::new().nest("/api", route_apis);
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await?;
    axum::serve(listener, app).await?;

    Ok(())
}
