mod config;
mod handlers;
mod middleware;
mod models;

use argon2::{password_hash::SaltString, Argon2, PasswordHasher};
use axum::{
    middleware as axum_middleware,
    routing::{get, post},
    Router,
};
use rand::rngs::OsRng;
use sqlx::postgres::PgPoolOptions;
use std::{env, net::SocketAddr};
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

    if let Err(err) = seed_default_admin(&db).await {
        tracing::warn!("Admin seed skipped: {}", err);
    }

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
        .route("/api/auth/register", post(handlers::register))
        .route("/api/auth/login", post(handlers::login));

    // Protected routes
    let protected_routes = Router::new()
        .route("/api/auth/me", get(handlers::me))
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
        .merge(protected_routes)
        .merge(health_route)
        .layer(cors)
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], config.server_port));
    tracing::info!("Auth service listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn seed_default_admin(db: &sqlx::PgPool) -> Result<(), String> {
    let seed_enabled = env::var("SEED_ADMIN")
        .unwrap_or_else(|_| "true".to_string())
        .to_lowercase()
        == "true";

    if !seed_enabled {
        return Ok(());
    }

    let email = env::var("ADMIN_EMAIL").unwrap_or_else(|_| "admin@pharmacy.com".to_string());
    let password = env::var("ADMIN_PASSWORD").unwrap_or_else(|_| "admin123".to_string());
    let name = env::var("ADMIN_NAME").unwrap_or_else(|_| "Admin".to_string());

    let exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)"
    )
    .bind(&email)
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())?;

    if exists {
        return Ok(());
    }

    let salt = SaltString::generate(&mut OsRng);
    let password_hash = Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| e.to_string())?
        .to_string();

    sqlx::query(
        r#"
        INSERT INTO users (email, password_hash, name, role)
        VALUES ($1, $2, $3, 'admin')
        "#
    )
    .bind(&email)
    .bind(&password_hash)
    .bind(&name)
    .execute(db)
    .await
    .map_err(|e| e.to_string())?;

    tracing::info!("Default admin user created: {}", email);
    Ok(())
}
