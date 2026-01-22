use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Order {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub status: String,
    pub total: Decimal,
    pub payment_provider: Option<String>,
    pub mercadopago_preference_id: Option<String>,
    pub mercadopago_payment_id: Option<String>,
    pub stripe_checkout_session_id: Option<String>,
    pub stripe_payment_intent_id: Option<String>,
    pub shipping_address: Option<String>,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    // Guest checkout fields
    pub guest_email: Option<String>,
    pub guest_session_id: Option<String>,
    pub guest_name: Option<String>,
    pub guest_surname: Option<String>,
    // Store pickup fields
    pub pickup_code: Option<String>,
    pub reservation_expires_at: Option<DateTime<Utc>>,
    pub customer_phone: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct OrderItem {
    pub id: Uuid,
    pub order_id: Uuid,
    pub product_id: Option<Uuid>,
    pub product_name: String,
    pub quantity: i32,
    pub price_at_purchase: Decimal,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct OrderWithItems {
    #[serde(flatten)]
    pub order: Order,
    pub items: Vec<OrderItem>,
}

#[derive(Debug, Deserialize)]
pub struct CheckoutRequest {
    pub shipping_address: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct GuestCheckoutItem {
    pub product_id: Uuid,
    pub quantity: i32,
}

#[derive(Debug, Deserialize)]
pub struct GuestCheckoutRequest {
    pub items: Vec<GuestCheckoutItem>,
    pub name: String,
    pub surname: String,
    pub email: String,
    pub shipping_address: Option<String>,
    pub notes: Option<String>,
    pub session_id: String,
    #[serde(default)]
    pub payment_method: Option<String>, // ignored, always MercadoPago
}

#[derive(Debug, Serialize)]
pub struct CheckoutResponse {
    pub order_id: Uuid,
    pub init_point: String,
    pub preference_id: String,
}

#[derive(Debug, Serialize)]
pub struct PaginatedOrders {
    pub orders: Vec<Order>,
    pub total: i64,
    pub page: u32,
    pub limit: u32,
    pub total_pages: u32,
}

#[derive(Debug, Deserialize)]
pub struct OrderQuery {
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub status: Option<String>,
}

// MercadoPago types
#[derive(Debug, Serialize)]
pub struct MercadoPagoPreference {
    pub items: Vec<MercadoPagoItem>,
    pub back_urls: MercadoPagoBackUrls,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub auto_return: Option<String>,
    pub external_reference: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notification_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub payer: Option<MercadoPagoPayer>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub statement_descriptor: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct MercadoPagoPayer {
    pub email: String,
    #[serde(rename = "first_name", skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(rename = "last_name", skip_serializing_if = "Option::is_none")]
    pub surname: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct MercadoPagoItem {
    pub id: String,
    pub title: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category_id: Option<String>,
    pub quantity: i32,
    pub unit_price: i64,
    pub currency_id: String,
}

#[derive(Debug, Serialize)]
pub struct MercadoPagoBackUrls {
    pub success: String,
    pub failure: String,
    pub pending: String,
}

#[derive(Debug, Deserialize)]
pub struct MercadoPagoPreferenceResponse {
    pub id: String,
    pub init_point: String,
    pub sandbox_init_point: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct MercadoPagoWebhook {
    pub action: Option<String>,
    #[serde(rename = "type")]
    pub event_type: Option<String>,
    pub data: Option<MercadoPagoWebhookData>,
}

#[derive(Debug, Deserialize)]
pub struct MercadoPagoWebhookData {
    pub id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct MercadoPagoPayment {
    pub id: i64,
    pub status: String,
    pub status_detail: Option<String>,
    pub external_reference: Option<String>,
}

// Process Payment (Checkout API) types
#[derive(Debug, Deserialize)]
pub struct ProcessPaymentRequest {
    pub token: String,
    pub payment_method_id: String,
    pub installments: Option<i32>,
    pub issuer_id: Option<String>,
    pub payer: PayerInfo,
    pub shipping_address: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct PayerInfo {
    pub email: String,
    pub identification: Option<PayerIdentification>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct PayerIdentification {
    #[serde(rename = "type")]
    pub id_type: Option<String>,
    pub number: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ProcessPaymentResponse {
    pub payment_id: i64,
    pub status: String,
    pub status_detail: Option<String>,
    pub order_id: Uuid,
}

#[derive(Debug, Serialize)]
pub struct MercadoPagoPaymentCreate {
    pub transaction_amount: f64,
    pub token: String,
    pub description: String,
    pub installments: i32,
    pub payment_method_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub issuer_id: Option<String>,
    pub payer: PayerInfo,
    pub external_reference: String,
}

// Store Pickup (Reservar y Pagar en Tienda) types
#[derive(Debug, Deserialize)]
pub struct StorePickupRequest {
    pub items: Vec<GuestCheckoutItem>,
    pub name: String,
    pub surname: String,
    pub email: String,
    pub phone: String,
    pub notes: Option<String>,
    pub session_id: String,
}

#[derive(Debug, Serialize)]
pub struct StorePickupResponse {
    pub order_id: Uuid,
    pub pickup_code: String,
    pub expires_at: DateTime<Utc>,
    pub total: Decimal,
}
