use axum::{extract::State, http::StatusCode, Json, body::Bytes};
use uuid::Uuid;

use crate::{
    models::MercadoPagoWebhook,
    services::{MercadoPagoClient, StripeClient},
    AppState,
};

pub async fn mercadopago_webhook(
    State(state): State<AppState>,
    Json(payload): Json<MercadoPagoWebhook>,
) -> Result<StatusCode, (StatusCode, String)> {
    tracing::info!("Received MercadoPago webhook: {:?}", payload);

    // Only process payment events
    if payload.event_type.as_deref() != Some("payment") {
        return Ok(StatusCode::OK);
    }

    let payment_id = match payload.data.and_then(|d| d.id) {
        Some(id) => id,
        None => return Ok(StatusCode::OK),
    };

    // IDEMPOTENCY CHECK: Verify if this payment was already processed
    let already_processed = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM orders WHERE mercadopago_payment_id = $1)"
    )
    .bind(&payment_id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if already_processed {
        tracing::info!("Payment {} already processed, skipping", payment_id);
        return Ok(StatusCode::OK);
    }

    // Get payment details from MercadoPago
    let mp_client = MercadoPagoClient::new(state.config.mercadopago_access_token.clone());

    let payment = mp_client
        .get_payment(&payment_id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to get payment: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, e)
        })?;

    tracing::info!("Payment status: {} for reference: {:?}", payment.status, payment.external_reference);

    // Get order ID from external reference
    let order_id = match payment.external_reference {
        Some(ref_id) => Uuid::parse_str(&ref_id).map_err(|e| {
            tracing::error!("Invalid order ID: {}", e);
            (StatusCode::BAD_REQUEST, e.to_string())
        })?,
        None => {
            tracing::warn!("No external reference in payment");
            return Ok(StatusCode::OK);
        }
    };

    // Get current order status to prevent duplicate stock reduction
    let current_status: Option<String> = sqlx::query_scalar(
        "SELECT status FROM orders WHERE id = $1"
    )
    .bind(order_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let current_status = match current_status {
        Some(s) => s,
        None => {
            tracing::error!("Order {} not found", order_id);
            return Ok(StatusCode::OK);
        }
    };

    // Map MercadoPago status to our status
    let new_status = match payment.status.as_str() {
        "approved" => "paid",
        "pending" | "in_process" => "pending",
        "rejected" | "cancelled" => "cancelled",
        "refunded" => "cancelled",
        "charged_back" => "cancelled",
        _ => {
            tracing::warn!("Unknown payment status: {}", payment.status);
            return Ok(StatusCode::OK);
        }
    };

    // Update order status and payment ID
    sqlx::query(
        "UPDATE orders SET status = $1, mercadopago_payment_id = $2 WHERE id = $3"
    )
    .bind(new_status)
    .bind(payment.id.to_string())
    .bind(order_id)
    .execute(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("Failed to update order: {}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
    })?;

    // Only reduce stock if: new status is "paid" AND previous status was "pending"
    // This prevents double stock reduction
    if new_status == "paid" && current_status == "pending" {
        let items = sqlx::query_as::<_, (Option<Uuid>, i32)>(
            "SELECT product_id, quantity FROM order_items WHERE order_id = $1"
        )
        .bind(order_id)
        .fetch_all(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        for (product_id, quantity) in items {
            if let Some(pid) = product_id {
                sqlx::query("UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1")
                    .bind(quantity)
                    .bind(pid)
                    .execute(&state.db)
                    .await
                    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
            }
        }

        tracing::info!("Order {} marked as paid and stock reduced", order_id);
    } else if new_status == "paid" {
        tracing::info!("Order {} already paid, skipping stock reduction", order_id);
    }

    Ok(StatusCode::OK)
}

pub async fn stripe_webhook(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
    body: Bytes,
) -> Result<StatusCode, (StatusCode, String)> {
    tracing::info!("Received Stripe webhook");

    // Parse webhook event
    let event: serde_json::Value = serde_json::from_slice(&body)
        .map_err(|e| (StatusCode::BAD_REQUEST, format!("Invalid JSON: {}", e)))?;

    tracing::info!("Stripe webhook event type: {:?}", event.get("type"));

    // Only process checkout.session.completed events
    let event_type = event
        .get("type")
        .and_then(|t| t.as_str())
        .unwrap_or("");

    if event_type != "checkout.session.completed" {
        return Ok(StatusCode::OK);
    }

    // Extract session object
    let session = event
        .get("data")
        .and_then(|d| d.get("object"))
        .ok_or((StatusCode::BAD_REQUEST, "Missing session object".to_string()))?;

    let session_id = session
        .get("id")
        .and_then(|id| id.as_str())
        .ok_or((StatusCode::BAD_REQUEST, "Missing session id".to_string()))?;

    let client_reference_id = session
        .get("client_reference_id")
        .and_then(|id| id.as_str());

    let order_id = match client_reference_id {
        Some(ref_id) => Uuid::parse_str(ref_id).map_err(|e| {
            tracing::error!("Invalid order ID: {}", e);
            (StatusCode::BAD_REQUEST, e.to_string())
        })?,
        None => {
            tracing::warn!("No client_reference_id in Stripe session");
            return Ok(StatusCode::OK);
        }
    };

    // IDEMPOTENCY CHECK
    let already_processed = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM orders WHERE stripe_checkout_session_id = $1 AND status = 'paid')"
    )
    .bind(session_id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if already_processed {
        tracing::info!("Order {} already paid, skipping", order_id);
        return Ok(StatusCode::OK);
    }

    // Get payment status
    let payment_status = session
        .get("payment_status")
        .and_then(|s| s.as_str())
        .unwrap_or("unpaid");

    tracing::info!("Payment status: {} for order: {}", payment_status, order_id);

    // Get current order status
    let current_status: Option<String> = sqlx::query_scalar(
        "SELECT status FROM orders WHERE id = $1"
    )
    .bind(order_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let current_status = match current_status {
        Some(s) => s,
        None => {
            tracing::error!("Order {} not found", order_id);
            return Ok(StatusCode::OK);
        }
    };

    // Map Stripe payment status to our status
    let new_status = match payment_status {
        "paid" => "paid",
        "unpaid" | "no_payment_required" => "pending",
        _ => {
            tracing::warn!("Unknown payment status: {}", payment_status);
            return Ok(StatusCode::OK);
        }
    };

    // Get payment intent ID if available
    let payment_intent_id = session
        .get("payment_intent")
        .and_then(|pi| pi.as_str())
        .map(|s| s.to_string());

    // Update order status
    if let Some(pi_id) = &payment_intent_id {
        sqlx::query(
            "UPDATE orders SET status = $1, stripe_payment_intent_id = $2 WHERE id = $3"
        )
        .bind(new_status)
        .bind(pi_id)
        .bind(order_id)
        .execute(&state.db)
        .await
        .map_err(|e| {
            tracing::error!("Failed to update order: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
        })?;
    } else {
        sqlx::query("UPDATE orders SET status = $1 WHERE id = $2")
        .bind(new_status)
        .bind(order_id)
        .execute(&state.db)
        .await
        .map_err(|e| {
            tracing::error!("Failed to update order: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
        })?;
    }

    // Only reduce stock if: new status is "paid" AND previous status was "pending"
    if new_status == "paid" && current_status == "pending" {
        let items = sqlx::query_as::<_, (Option<Uuid>, i32)>(
            "SELECT product_id, quantity FROM order_items WHERE order_id = $1"
        )
        .bind(order_id)
        .fetch_all(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        for (product_id, quantity) in items {
            if let Some(pid) = product_id {
                sqlx::query("UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1")
                    .bind(quantity)
                    .bind(pid)
                    .execute(&state.db)
                    .await
                    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
            }
        }

        tracing::info!("Order {} marked as paid and stock reduced", order_id);
    } else if new_status == "paid" {
        tracing::info!("Order {} already paid, skipping stock reduction", order_id);
    }

    Ok(StatusCode::OK)
}
