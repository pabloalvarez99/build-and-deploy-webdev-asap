use std::env;

#[derive(Clone)]
pub struct Config {
    pub database_url: String,
    pub redis_url: String,
    pub jwt_secret: String,
    pub server_port: u16,
    pub mercadopago_access_token: String,
    pub frontend_url: String,
    pub webhook_url: String,
}

impl Config {
    pub fn from_env() -> Self {
        dotenvy::dotenv().ok();

        Self {
            database_url: env::var("DATABASE_URL")
                .expect("DATABASE_URL must be set"),
            redis_url: env::var("REDIS_URL")
                .unwrap_or_else(|_| "redis://localhost:6379".to_string()),
            jwt_secret: env::var("JWT_SECRET")
                .expect("JWT_SECRET must be set"),
            server_port: env::var("PORT")
                .unwrap_or_else(|_| "3003".to_string())
                .parse()
                .expect("PORT must be a valid number"),
            mercadopago_access_token: env::var("MERCADOPAGO_ACCESS_TOKEN")
                .expect("MERCADOPAGO_ACCESS_TOKEN must be set"),
            frontend_url: env::var("FRONTEND_URL")
                .unwrap_or_else(|_| "http://localhost:3000".to_string()),
            webhook_url: env::var("WEBHOOK_URL")
                .unwrap_or_else(|_| "http://localhost:3003".to_string()),
        }
    }
}
