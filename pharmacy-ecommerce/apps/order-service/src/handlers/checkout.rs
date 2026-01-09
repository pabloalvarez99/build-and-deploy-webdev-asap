use axum::{extract::State, http::StatusCode, Extension, Json};
use redis::AsyncCommands;
use rust_decimal::Decimal;
use uuid::Uuid;

use crate::{
    models::{
        Cart, CheckoutRequest, CheckoutResponse, Claims, GuestCheckoutRequest,
        MercadoPagoBackUrls, MercadoPagoItem, MercadoPagoPaymentCreate, MercadoPagoPreference,
        PayerInfo, ProcessPaymentRequest, ProcessPaymentResponse,
    },
    services::MercadoPagoClient,
    AppState,
};

pub async fn checkout(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CheckoutRequest>,
) -> Result<Json<CheckoutResponse>, (StatusCode, String)> {
    let cart_key = format!("cart:{}", claims.sub);

    let mut redis = state.redis.clone();

    // Get cart
    let cart_data: Option<String> = redis
        .get(&cart_key)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let cart: Cart = cart_data
        .and_then(|data| serde_json::from_str(&data).ok())
        .unwrap_or_default();

    if cart.items.is_empty() {
        return Err((StatusCode::BAD_REQUEST, "Cart is empty".to_string()));
    }

    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Calculate total and prepare items
    let mut total = Decimal::ZERO;
    let mut mp_items: Vec<MercadoPagoItem> = vec![];
    let mut order_items: Vec<(Uuid, String, i32, Decimal)> = vec![];

    for cart_item in &cart.items {
        let product = sqlx::query_as::<_, (Uuid, String, Decimal, i32)>(
            "SELECT id, name, price, stock FROM products WHERE id = $1 AND active = true"
        )
        .bind(cart_item.product_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, format!("Product {} not found", cart_item.product_id)))?;

        let (product_id, name, price, stock) = product;

        if stock < cart_item.quantity {
            return Err((
                StatusCode::BAD_REQUEST,
                format!("Insufficient stock for {}", name),
            ));
        }

        let subtotal = price * Decimal::from(cart_item.quantity);
        total += subtotal;

        // Convert Decimal to integer for MercadoPago (round up to nearest peso)
        let price_f64: f64 = price.to_string().parse().unwrap_or(0.0);
        let price_int = price_f64.ceil() as i64;

        mp_items.push(MercadoPagoItem {
            title: name.clone(),
            quantity: cart_item.quantity,
            unit_price: price_int,
            currency_id: "CLP".to_string(),
        });

        order_items.push((product_id, name, cart_item.quantity, price));
    }

    // Create order in database
    let order_id = sqlx::query_scalar::<_, Uuid>(
        r#"
        INSERT INTO orders (user_id, status, total, shipping_address, notes)
        VALUES ($1, 'pending', $2, $3, $4)
        RETURNING id
        "#
    )
    .bind(user_id)
    .bind(total)
    .bind(&payload.shipping_address)
    .bind(&payload.notes)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Create order items
    for (product_id, product_name, quantity, price) in order_items {
        sqlx::query(
            r#"
            INSERT INTO order_items (order_id, product_id, product_name, quantity, price_at_purchase)
            VALUES ($1, $2, $3, $4, $5)
            "#
        )
        .bind(order_id)
        .bind(product_id)
        .bind(&product_name)
        .bind(quantity)
        .bind(price)
        .execute(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    // Create MercadoPago preference
    let mp_client = MercadoPagoClient::new(state.config.mercadopago_access_token.clone());

    // Only use auto_return if frontend URL is not localhost
    let auto_return = if state.config.frontend_url.contains("localhost") {
        None
    } else {
        Some("approved".to_string())
    };

    let preference = MercadoPagoPreference {
        items: mp_items,
        back_urls: MercadoPagoBackUrls {
            success: format!("{}/checkout/success?order_id={}", state.config.frontend_url, order_id),
            failure: format!("{}/checkout/failure?order_id={}", state.config.frontend_url, order_id),
            pending: format!("{}/checkout/pending?order_id={}", state.config.frontend_url, order_id),
        },
        auto_return,
        external_reference: order_id.to_string(),
        notification_url: Some(format!("{}/api/webhook/mercadopago", state.config.webhook_url)),
    };

    let mp_response = mp_client
        .create_preference(&preference)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;

    // Update order with MercadoPago preference ID
    sqlx::query(
        "UPDATE orders SET mercadopago_preference_id = $1 WHERE id = $2"
    )
    .bind(&mp_response.id)
    .bind(order_id)
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Clear cart
    redis
        .del::<_, ()>(&cart_key)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(CheckoutResponse {
        order_id,
        init_point: mp_response.init_point,
        preference_id: mp_response.id,
    }))
}

/// Process payment directly using card token from frontend (Checkout API)
pub async fn process_payment(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<ProcessPaymentRequest>,
) -> Result<Json<ProcessPaymentResponse>, (StatusCode, String)> {
    let cart_key = format!("cart:{}", claims.sub);
    let mut redis = state.redis.clone();

    // Get cart
    let cart_data: Option<String> = redis
        .get(&cart_key)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let cart: Cart = cart_data
        .and_then(|data| serde_json::from_str(&data).ok())
        .unwrap_or_default();

    if cart.items.is_empty() {
        return Err((StatusCode::BAD_REQUEST, "Cart is empty".to_string()));
    }

    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Calculate total and prepare items
    let mut total = Decimal::ZERO;
    let mut order_items: Vec<(Uuid, String, i32, Decimal)> = vec![];
    let mut description_parts: Vec<String> = vec![];

    for cart_item in &cart.items {
        let product = sqlx::query_as::<_, (Uuid, String, Decimal, i32)>(
            "SELECT id, name, price, stock FROM products WHERE id = $1 AND active = true",
        )
        .bind(cart_item.product_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((
            StatusCode::NOT_FOUND,
            format!("Product {} not found", cart_item.product_id),
        ))?;

        let (product_id, name, price, stock) = product;

        if stock < cart_item.quantity {
            return Err((
                StatusCode::BAD_REQUEST,
                format!("Insufficient stock for {}", name),
            ));
        }

        let subtotal = price * Decimal::from(cart_item.quantity);
        total += subtotal;

        description_parts.push(format!("{} x{}", name, cart_item.quantity));
        order_items.push((product_id, name, cart_item.quantity, price));
    }

    // Create order in database
    let order_id = sqlx::query_scalar::<_, Uuid>(
        r#"
        INSERT INTO orders (user_id, status, total, shipping_address, notes)
        VALUES ($1, 'pending', $2, $3, $4)
        RETURNING id
        "#,
    )
    .bind(user_id)
    .bind(total)
    .bind(&payload.shipping_address)
    .bind(&payload.notes)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Create order items
    for (product_id, product_name, quantity, price) in &order_items {
        sqlx::query(
            r#"
            INSERT INTO order_items (order_id, product_id, product_name, quantity, price_at_purchase)
            VALUES ($1, $2, $3, $4, $5)
            "#,
        )
        .bind(order_id)
        .bind(product_id)
        .bind(product_name)
        .bind(quantity)
        .bind(price)
        .execute(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    // Create payment with MercadoPago
    let mp_client = MercadoPagoClient::new(state.config.mercadopago_access_token.clone());

    let total_f64: f64 = total.to_string().parse().unwrap_or(0.0);

    let mp_payment = MercadoPagoPaymentCreate {
        transaction_amount: total_f64,
        token: payload.token,
        description: description_parts.join(", "),
        installments: payload.installments.unwrap_or(1),
        payment_method_id: payload.payment_method_id,
        issuer_id: payload.issuer_id,
        payer: PayerInfo {
            email: payload.payer.email,
            identification: payload.payer.identification,
        },
        external_reference: order_id.to_string(),
    };

    let payment_result = mp_client.create_payment(&mp_payment).await.map_err(|e| {
        tracing::error!("MercadoPago payment error: {}", e);
        (StatusCode::BAD_REQUEST, e)
    })?;

    // Update order with payment info
    let new_status = match payment_result.status.as_str() {
        "approved" => "paid",
        "pending" | "in_process" => "pending",
        _ => "failed",
    };

    sqlx::query(
        "UPDATE orders SET mercadopago_payment_id = $1, status = $2 WHERE id = $3",
    )
    .bind(payment_result.id.to_string())
    .bind(new_status)
    .bind(order_id)
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Update stock if payment approved
    if payment_result.status == "approved" {
        for (product_id, _, quantity, _) in &order_items {
            sqlx::query("UPDATE products SET stock = stock - $1 WHERE id = $2")
                .bind(quantity)
                .bind(product_id)
                .execute(&state.db)
                .await
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        }

        // Clear cart
        redis
            .del::<_, ()>(&cart_key)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    Ok(Json(ProcessPaymentResponse {
        payment_id: payment_result.id,
        status: payment_result.status,
        status_detail: payment_result.status_detail,
        order_id,
    }))
}

/// Guest checkout - no authentication required
pub async fn guest_checkout(
    State(state): State<AppState>,
    Json(payload): Json<GuestCheckoutRequest>,
) -> Result<Json<CheckoutResponse>, (StatusCode, String)> {
    if payload.items.is_empty() {
        return Err((StatusCode::BAD_REQUEST, "Cart is empty".to_string()));
    }

    // Calculate total and prepare items
    let mut total = Decimal::ZERO;
    let mut mp_items: Vec<MercadoPagoItem> = vec![];
    let mut order_items: Vec<(Uuid, String, i32, Decimal)> = vec![];

    for item in &payload.items {
        let product = sqlx::query_as::<_, (Uuid, String, Decimal, i32)>(
            "SELECT id, name, price, stock FROM products WHERE id = $1 AND active = true",
        )
        .bind(item.product_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((
            StatusCode::NOT_FOUND,
            format!("Product {} not found", item.product_id),
        ))?;

        let (product_id, name, price, stock) = product;

        if stock < item.quantity {
            return Err((
                StatusCode::BAD_REQUEST,
                format!("Insufficient stock for {}", name),
            ));
        }

        let subtotal = price * Decimal::from(item.quantity);
        total += subtotal;

        let price_f64: f64 = price.to_string().parse().unwrap_or(0.0);
        let price_int = price_f64.ceil() as i64;

        mp_items.push(MercadoPagoItem {
            title: name.clone(),
            quantity: item.quantity,
            unit_price: price_int,
            currency_id: "CLP".to_string(),
        });

        order_items.push((product_id, name, item.quantity, price));
    }

    // Create order in database (user_id = NULL for guest)
    let order_id = sqlx::query_scalar::<_, Uuid>(
        r#"
        INSERT INTO orders (user_id, status, total, shipping_address, notes, guest_email, guest_session_id)
        VALUES (NULL, 'pending', $1, $2, $3, $4, $5)
        RETURNING id
        "#,
    )
    .bind(total)
    .bind(&payload.shipping_address)
    .bind(&payload.notes)
    .bind(&payload.email)
    .bind(&payload.session_id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Create order items
    for (product_id, product_name, quantity, price) in order_items {
        sqlx::query(
            r#"
            INSERT INTO order_items (order_id, product_id, product_name, quantity, price_at_purchase)
            VALUES ($1, $2, $3, $4, $5)
            "#,
        )
        .bind(order_id)
        .bind(product_id)
        .bind(&product_name)
        .bind(quantity)
        .bind(price)
        .execute(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    // Create MercadoPago preference
    let mp_client = MercadoPagoClient::new(state.config.mercadopago_access_token.clone());

    let auto_return = if state.config.frontend_url.contains("localhost") {
        None
    } else {
        Some("approved".to_string())
    };

    let preference = MercadoPagoPreference {
        items: mp_items,
        back_urls: MercadoPagoBackUrls {
            success: format!(
                "{}/checkout/success?order_id={}",
                state.config.frontend_url, order_id
            ),
            failure: format!(
                "{}/checkout/failure?order_id={}",
                state.config.frontend_url, order_id
            ),
            pending: format!(
                "{}/checkout/pending?order_id={}",
                state.config.frontend_url, order_id
            ),
        },
        auto_return,
        external_reference: order_id.to_string(),
        notification_url: Some(format!(
            "{}/api/webhook/mercadopago",
            state.config.webhook_url
        )),
    };

    let mp_response = mp_client
        .create_preference(&preference)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;

    // Update order with MercadoPago preference ID
    sqlx::query("UPDATE orders SET mercadopago_preference_id = $1 WHERE id = $2")
        .bind(&mp_response.id)
        .bind(order_id)
        .execute(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(CheckoutResponse {
        order_id,
        init_point: mp_response.init_point,
        preference_id: mp_response.id,
    }))
}
