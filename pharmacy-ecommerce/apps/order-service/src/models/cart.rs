use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CartItem {
    pub product_id: Uuid,
    pub quantity: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Cart {
    pub items: Vec<CartItem>,
}

impl Default for Cart {
    fn default() -> Self {
        Self { items: vec![] }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct CartItemWithProduct {
    pub product_id: Uuid,
    pub product_name: String,
    pub product_slug: String,
    pub product_image: Option<String>,
    pub price: Decimal,
    pub quantity: i32,
    pub subtotal: Decimal,
}

#[derive(Debug, Clone, Serialize)]
pub struct CartResponse {
    pub items: Vec<CartItemWithProduct>,
    pub total: Decimal,
    pub item_count: i32,
}

#[derive(Debug, Deserialize)]
pub struct AddToCartRequest {
    pub product_id: Uuid,
    pub quantity: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCartRequest {
    pub product_id: Uuid,
    pub quantity: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub email: String,
    pub role: String,
    pub exp: i64,
    pub iat: i64,
}
