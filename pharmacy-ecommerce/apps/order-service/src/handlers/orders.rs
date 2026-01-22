use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Extension, Json,
};
use uuid::Uuid;

use crate::{
    models::{Claims, Order, OrderItem, OrderQuery, OrderWithItems, PaginatedOrders},
    AppState,
};

pub async fn list_orders(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(query): Query<OrderQuery>,
) -> Result<Json<PaginatedOrders>, (StatusCode, String)> {
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let page = query.page.unwrap_or(1).max(1);
    let limit = query.limit.unwrap_or(10).min(100);
    let offset = (page - 1) * limit;

    // Build query based on role
    let (orders, total): (Vec<Order>, i64) = if claims.role == "admin" {
        // Admin can see all orders
        let total: i64 = if let Some(ref status) = query.status {
            sqlx::query_scalar("SELECT COUNT(*) FROM orders WHERE status = $1")
                .bind(status)
                .fetch_one(&state.db)
                .await
        } else {
            sqlx::query_scalar("SELECT COUNT(*) FROM orders")
                .fetch_one(&state.db)
                .await
        }
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        let orders = if let Some(ref status) = query.status {
            sqlx::query_as::<_, Order>(
                "SELECT * FROM orders WHERE status = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3"
            )
            .bind(status)
            .bind(limit as i64)
            .bind(offset as i64)
            .fetch_all(&state.db)
            .await
        } else {
            sqlx::query_as::<_, Order>(
                "SELECT * FROM orders ORDER BY created_at DESC LIMIT $1 OFFSET $2"
            )
            .bind(limit as i64)
            .bind(offset as i64)
            .fetch_all(&state.db)
            .await
        }
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        (orders, total)
    } else {
        // Regular user can only see their orders
        let total: i64 = if let Some(ref status) = query.status {
            sqlx::query_scalar(
                "SELECT COUNT(*) FROM orders WHERE user_id = $1 AND status = $2"
            )
            .bind(user_id)
            .bind(status)
            .fetch_one(&state.db)
            .await
        } else {
            sqlx::query_scalar("SELECT COUNT(*) FROM orders WHERE user_id = $1")
                .bind(user_id)
                .fetch_one(&state.db)
                .await
        }
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        let orders = if let Some(ref status) = query.status {
            sqlx::query_as::<_, Order>(
                "SELECT * FROM orders WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4"
            )
            .bind(user_id)
            .bind(status)
            .bind(limit as i64)
            .bind(offset as i64)
            .fetch_all(&state.db)
            .await
        } else {
            sqlx::query_as::<_, Order>(
                "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3"
            )
            .bind(user_id)
            .bind(limit as i64)
            .bind(offset as i64)
            .fetch_all(&state.db)
            .await
        }
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        (orders, total)
    };

    let total_pages = ((total as f64) / (limit as f64)).ceil() as u32;

    Ok(Json(PaginatedOrders {
        orders,
        total,
        page,
        limit,
        total_pages,
    }))
}

pub async fn get_order(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(order_id): Path<Uuid>,
) -> Result<Json<OrderWithItems>, (StatusCode, String)> {
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Get order
    let order = sqlx::query_as::<_, Order>("SELECT * FROM orders WHERE id = $1")
        .bind(order_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Order not found".to_string()))?;

    // Check permission (admin can see all, user can see their own)
    if claims.role != "admin" && order.user_id != Some(user_id) {
        return Err((StatusCode::FORBIDDEN, "Access denied".to_string()));
    }

    // Get order items
    let items = sqlx::query_as::<_, OrderItem>(
        "SELECT * FROM order_items WHERE order_id = $1"
    )
    .bind(order_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(OrderWithItems { order, items }))
}

pub async fn update_order_status(
    State(state): State<AppState>,
    Path(order_id): Path<Uuid>,
    Json(payload): Json<UpdateStatusRequest>,
) -> Result<Json<Order>, (StatusCode, String)> {
    let valid_statuses = ["pending", "reserved", "paid", "processing", "shipped", "delivered", "cancelled"];

    if !valid_statuses.contains(&payload.status.as_str()) {
        return Err((StatusCode::BAD_REQUEST, "Invalid status".to_string()));
    }

    let order = sqlx::query_as::<_, Order>(
        "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *"
    )
    .bind(&payload.status)
    .bind(order_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "Order not found".to_string()))?;

    // If order is paid, reduce stock
    if payload.status == "paid" {
        let items = sqlx::query_as::<_, (Option<Uuid>, i32)>(
            "SELECT product_id, quantity FROM order_items WHERE order_id = $1"
        )
        .bind(order_id)
        .fetch_all(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        for (product_id, quantity) in items {
            if let Some(pid) = product_id {
                sqlx::query("UPDATE products SET stock = stock - $1 WHERE id = $2")
                    .bind(quantity)
                    .bind(pid)
                    .execute(&state.db)
                    .await
                    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
            }
        }
    }

    Ok(Json(order))
}

#[derive(serde::Deserialize)]
pub struct UpdateStatusRequest {
    pub status: String,
}
