use axum::{
    extract::{Path, State},
    http::StatusCode,
    Extension, Json,
};
use redis::AsyncCommands;
use rust_decimal::Decimal;
use uuid::Uuid;

use crate::{
    models::{
        AddToCartRequest, Cart, CartItem, CartItemWithProduct, CartResponse, Claims,
        UpdateCartRequest,
    },
    AppState,
};

const CART_TTL_SECONDS: i64 = 7 * 24 * 60 * 60; // 7 days

fn get_cart_key(user_id: &str) -> String {
    format!("cart:{}", user_id)
}

pub async fn get_cart(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<CartResponse>, (StatusCode, String)> {
    let cart_key = get_cart_key(&claims.sub);

    let mut redis = state.redis.clone();
    let cart_data: Option<String> = redis
        .get(&cart_key)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let cart: Cart = cart_data
        .and_then(|data| serde_json::from_str(&data).ok())
        .unwrap_or_default();

    // Get product details for each cart item
    let cart_response = build_cart_response(&state, cart).await?;

    Ok(Json(cart_response))
}

pub async fn add_to_cart(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<AddToCartRequest>,
) -> Result<Json<CartResponse>, (StatusCode, String)> {
    let cart_key = get_cart_key(&claims.sub);
    let quantity = payload.quantity.unwrap_or(1);

    if quantity <= 0 {
        return Err((StatusCode::BAD_REQUEST, "Quantity must be positive".to_string()));
    }

    // Check if product exists and has stock
    let product = sqlx::query_as::<_, (Uuid, String, i32)>(
        "SELECT id, name, stock FROM products WHERE id = $1 AND active = true"
    )
    .bind(payload.product_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "Product not found".to_string()))?;

    if product.2 < quantity {
        return Err((StatusCode::BAD_REQUEST, "Insufficient stock".to_string()));
    }

    let mut redis = state.redis.clone();

    // Get current cart
    let cart_data: Option<String> = redis
        .get(&cart_key)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let mut cart: Cart = cart_data
        .and_then(|data| serde_json::from_str(&data).ok())
        .unwrap_or_default();

    // Add or update item
    if let Some(item) = cart.items.iter_mut().find(|i| i.product_id == payload.product_id) {
        item.quantity += quantity;
    } else {
        cart.items.push(CartItem {
            product_id: payload.product_id,
            quantity,
        });
    }

    // Save cart
    let cart_json = serde_json::to_string(&cart)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    redis
        .set_ex::<_, _, ()>(&cart_key, &cart_json, CART_TTL_SECONDS as u64)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Return updated cart
    let cart_response = build_cart_response(&state, cart).await?;

    Ok(Json(cart_response))
}

pub async fn update_cart(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<UpdateCartRequest>,
) -> Result<Json<CartResponse>, (StatusCode, String)> {
    let cart_key = get_cart_key(&claims.sub);

    if payload.quantity < 0 {
        return Err((StatusCode::BAD_REQUEST, "Quantity must be non-negative".to_string()));
    }

    let mut redis = state.redis.clone();

    // Get current cart
    let cart_data: Option<String> = redis
        .get(&cart_key)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let mut cart: Cart = cart_data
        .and_then(|data| serde_json::from_str(&data).ok())
        .unwrap_or_default();

    // Update or remove item
    if payload.quantity == 0 {
        cart.items.retain(|i| i.product_id != payload.product_id);
    } else {
        if let Some(item) = cart.items.iter_mut().find(|i| i.product_id == payload.product_id) {
            // Check stock
            let stock: i32 = sqlx::query_scalar(
                "SELECT stock FROM products WHERE id = $1"
            )
            .bind(payload.product_id)
            .fetch_optional(&state.db)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
            .ok_or((StatusCode::NOT_FOUND, "Product not found".to_string()))?;

            if stock < payload.quantity {
                return Err((StatusCode::BAD_REQUEST, "Insufficient stock".to_string()));
            }

            item.quantity = payload.quantity;
        } else {
            return Err((StatusCode::NOT_FOUND, "Item not in cart".to_string()));
        }
    }

    // Save cart
    let cart_json = serde_json::to_string(&cart)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    redis
        .set_ex::<_, _, ()>(&cart_key, &cart_json, CART_TTL_SECONDS as u64)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Return updated cart
    let cart_response = build_cart_response(&state, cart).await?;

    Ok(Json(cart_response))
}

pub async fn remove_from_cart(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(product_id): Path<Uuid>,
) -> Result<Json<CartResponse>, (StatusCode, String)> {
    let cart_key = get_cart_key(&claims.sub);

    let mut redis = state.redis.clone();

    // Get current cart
    let cart_data: Option<String> = redis
        .get(&cart_key)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let mut cart: Cart = cart_data
        .and_then(|data| serde_json::from_str(&data).ok())
        .unwrap_or_default();

    // Remove item
    cart.items.retain(|i| i.product_id != product_id);

    // Save cart
    let cart_json = serde_json::to_string(&cart)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    redis
        .set_ex::<_, _, ()>(&cart_key, &cart_json, CART_TTL_SECONDS as u64)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Return updated cart
    let cart_response = build_cart_response(&state, cart).await?;

    Ok(Json(cart_response))
}

pub async fn clear_cart(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> Result<StatusCode, (StatusCode, String)> {
    let cart_key = get_cart_key(&claims.sub);

    let mut redis = state.redis.clone();
    redis
        .del::<_, ()>(&cart_key)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::NO_CONTENT)
}

async fn build_cart_response(
    state: &AppState,
    cart: Cart,
) -> Result<CartResponse, (StatusCode, String)> {
    let mut items: Vec<CartItemWithProduct> = vec![];
    let mut total = Decimal::ZERO;

    for cart_item in cart.items {
        let product = sqlx::query_as::<_, (String, String, Option<String>, Decimal)>(
            "SELECT name, slug, image_url, price FROM products WHERE id = $1"
        )
        .bind(cart_item.product_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        if let Some((name, slug, image, price)) = product {
            let subtotal = price * Decimal::from(cart_item.quantity);
            total += subtotal;

            items.push(CartItemWithProduct {
                product_id: cart_item.product_id,
                product_name: name,
                product_slug: slug,
                product_image: image,
                price,
                quantity: cart_item.quantity,
                subtotal,
            });
        }
    }

    let item_count = items.iter().map(|i| i.quantity).sum();

    Ok(CartResponse {
        items,
        total,
        item_count,
    })
}
