mod config;
mod handlers;
mod middleware;
mod models;
mod services;

use axum::{
    middleware as axum_middleware,
    routing::{delete, get, post, put},
    Router,
};
use redis::aio::ConnectionManager;
use sqlx::postgres::PgPoolOptions;
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use config::Config;

#[derive(Clone)]
pub struct AppState {
    pub db: sqlx::PgPool,
    pub redis: ConnectionManager,
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

    // Create Redis connection
    let redis_client = redis::Client::open(config.redis_url.clone())
        .expect("Failed to create Redis client");
    let redis = ConnectionManager::new(redis_client)
        .await
        .expect("Failed to create Redis connection manager");

    tracing::info!("Connected to Redis");

    let state = AppState {
        db,
        redis,
        config: config.clone(),
    };

    // CORS configuration
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Cart routes (protected)
    let cart_routes = Router::new()
        .route("/api/cart", get(handlers::get_cart))
        .route("/api/cart/add", post(handlers::add_to_cart))
        .route("/api/cart/update", put(handlers::update_cart))
        .route("/api/cart/remove/:product_id", delete(handlers::remove_from_cart))
        .route("/api/cart/clear", delete(handlers::clear_cart))
        .layer(axum_middleware::from_fn_with_state(
            state.clone(),
            middleware::jwt_auth,
        ));

    // Checkout routes (protected)
    let checkout_routes = Router::new()
        .route("/api/checkout", post(handlers::checkout))
        .route("/api/process-payment", post(handlers::process_payment))
        .layer(axum_middleware::from_fn_with_state(
            state.clone(),
            middleware::jwt_auth,
        ));

    // Order routes (protected)
    let order_routes = Router::new()
        .route("/api/orders", get(handlers::list_orders))
        .route("/api/orders/:id", get(handlers::get_order))
        .layer(axum_middleware::from_fn_with_state(
            state.clone(),
            middleware::jwt_auth,
        ));

    // Admin order routes
    let admin_order_routes = Router::new()
        .route("/api/orders/:id/status", put(handlers::update_order_status))
        .layer(axum_middleware::from_fn(middleware::admin_only))
        .layer(axum_middleware::from_fn_with_state(
            state.clone(),
            middleware::jwt_auth,
        ));

    // Public routes (no auth)
    let public_routes = Router::new()
        .route("/api/guest-checkout", post(handlers::guest_checkout))
        .route("/api/store-pickup", post(handlers::store_pickup_checkout))
        .route("/api/webhook/mercadopago", post(handlers::mercadopago_webhook));

    // Health check
    let health_route = Router::new()
        .route("/health", get(|| async { "OK" }));

    // Combine all routes
    let app = Router::new()
        .merge(cart_routes)
        .merge(checkout_routes)
        .merge(order_routes)
        .merge(admin_order_routes)
        .merge(public_routes)
        .merge(health_route)
        .layer(cors)
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], config.server_port));
    tracing::info!("Order service listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
