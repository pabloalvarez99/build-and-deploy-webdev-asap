mod config;
mod handlers;
mod middleware;
mod models;

use axum::{
    middleware as axum_middleware,
    routing::{delete, get, post, put},
    Router,
};
use sqlx::postgres::PgPoolOptions;
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use config::Config;

#[derive(Clone)]
pub struct AppState {
    pub db: sqlx::PgPool,
    pub config: Config,
}

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load configuration
    let config = Config::from_env();

    // Create database pool
    let db = PgPoolOptions::new()
        .max_connections(10)
        .connect(&config.database_url)
        .await
        .expect("Failed to create database pool");

    tracing::info!("Connected to database");

    let state = AppState {
        db,
        config: config.clone(),
    };

    // CORS configuration
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Public routes
    let public_routes = Router::new()
        .route("/api/products", get(handlers::list_products))
        .route("/api/products/id/:id", get(handlers::get_product_by_id))
        .route("/api/products/:slug", get(handlers::get_product))
        .route("/api/categories", get(handlers::list_categories))
        .route("/api/categories/:slug", get(handlers::get_category))
        // Filter endpoints
        .route("/api/filters/laboratories", get(handlers::get_laboratories))
        .route("/api/filters/therapeutic-actions", get(handlers::get_therapeutic_actions))
        .route("/api/filters/active-ingredients", get(handlers::get_active_ingredients));

    // Admin routes (protected)
    let admin_routes = Router::new()
        .route("/api/admin/products", post(handlers::create_product))
        .route("/api/admin/products/:id", put(handlers::update_product))
        .route("/api/admin/products/:id", delete(handlers::delete_product))
        .route("/api/admin/categories", post(handlers::create_category))
        .route("/api/admin/categories/:id", put(handlers::update_category))
        .route("/api/admin/categories/:id", delete(handlers::delete_category))
        .layer(axum_middleware::from_fn(middleware::admin_only))
        .layer(axum_middleware::from_fn_with_state(
            state.clone(),
            middleware::jwt_auth,
        ));

    // Health check
    let health_route = Router::new()
        .route("/health", get(|| async { "OK" }));

    // Combine all routes
    let app = Router::new()
        .merge(public_routes)
        .merge(admin_routes)
        .merge(health_route)
        .layer(cors)
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], config.server_port));
    tracing::info!("Product service listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
