pub mod api;

use axum::{
    response::{Html, IntoResponse},
    routing::get,
    Router,
};

pub fn app() -> Router {
    let route_apis = api::routes();
    Router::new()
        .nest("/api", route_apis)
        .fallback(get(serve_frontend))
}

async fn serve_frontend() -> impl IntoResponse {
    Html(include_str!("../../../webui/dist/index.html"))
}
