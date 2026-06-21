pub mod api;

use axum::Router;

pub fn app() -> Router {
    let route_apis = api::routes();
    Router::new().nest("/api", route_apis)
}
