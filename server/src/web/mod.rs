pub mod api;

use axum::{
    response::{Html, IntoResponse},
    routing::get,
    Router,
};
use tower_http::cors;

pub fn app() -> Router {
    let route_apis = api::routes();
    Router::new()
        .route("/", get(serve_frontend))
        .nest("/api", route_apis)
        .layer(
            cors::CorsLayer::new()
                .allow_origin(cors::Any)
                .allow_methods(cors::Any)
                .allow_headers(cors::Any)
                .expose_headers(cors::Any),
        )
}

async fn serve_frontend() -> impl IntoResponse {
    Html(include_str!("../../../webui/dist/index.html"))
}
