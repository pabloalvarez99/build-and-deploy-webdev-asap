use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Product {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub price: Decimal,
    pub stock: i32,
    pub category_id: Option<Uuid>,
    pub image_url: Option<String>,
    pub active: bool,
    pub external_id: Option<String>,
    pub laboratory: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct ProductWithCategory {
    #[serde(flatten)]
    pub product: Product,
    pub category_name: Option<String>,
    pub category_slug: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateProductRequest {
    #[validate(length(min = 2, message = "Name must be at least 2 characters"))]
    pub name: String,
    #[validate(length(min = 2, message = "Slug must be at least 2 characters"))]
    pub slug: String,
    pub description: Option<String>,
    pub price: Decimal,
    #[validate(range(min = 0, message = "Stock must be non-negative"))]
    pub stock: i32,
    pub category_id: Option<Uuid>,
    pub image_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProductRequest {
    pub name: Option<String>,
    pub slug: Option<String>,
    pub description: Option<String>,
    pub price: Option<Decimal>,
    pub stock: Option<i32>,
    pub category_id: Option<Uuid>,
    pub image_url: Option<String>,
    pub active: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct ProductQuery {
    pub category: Option<String>,
    pub laboratory: Option<String>,
    pub search: Option<String>,
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub active_only: Option<bool>,
    pub sort_by: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct PaginatedProducts {
    pub products: Vec<ProductWithCategory>,
    pub total: i64,
    pub page: u32,
    pub limit: u32,
    pub total_pages: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub email: String,
    pub role: String,
    pub exp: i64,
    pub iat: i64,
}
