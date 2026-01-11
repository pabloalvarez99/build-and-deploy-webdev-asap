use crate::models::{
    StripeCheckoutSession, StripeCheckoutSessionCreate, StripeCheckoutSessionResponse,
    StripeWebhookEvent,
};

pub struct StripeClient {
    secret_key: String,
    client: reqwest::Client,
}

impl StripeClient {
    pub fn new(secret_key: String) -> Self {
        Self {
            secret_key,
            client: reqwest::Client::new(),
        }
    }

    pub async fn create_checkout_session(
        &self,
        session: &StripeCheckoutSessionCreate,
    ) -> Result<StripeCheckoutSessionResponse, String> {
        // Build form-urlencoded body manually for Stripe API
        let mut form_params = vec![
            ("mode", "payment".to_string()),
            ("payment_method_types[0]", "card".to_string()),
            ("success_url", session.success_url.clone()),
            ("cancel_url", session.cancel_url.clone()),
            ("client_reference_id", session.client_reference_id.clone()),
        ];

        if let Some(ref email) = session.customer_email {
            form_params.push(("customer_email", email.clone()));
        }

        // Add line items (Stripe uses indexed form fields for arrays)
        for (idx, item) in session.line_items.iter().enumerate() {
            form_params.push((
                format!("line_items[{}][price_data][currency]", idx),
                item.currency.to_lowercase(),
            ));
            form_params.push((
                format!("line_items[{}][price_data][product_data][name]", idx),
                item.name.clone(),
            ));
            form_params.push((
                format!("line_items[{}][price_data][unit_amount]", idx),
                item.amount.to_string(),
            ));
            form_params.push((
                format!("line_items[{}][quantity]", idx),
                item.quantity.to_string(),
            ));
        }

        let response = self
            .client
            .post("https://api.stripe.com/v1/checkout/sessions")
            .header("Authorization", format!("Bearer {}", self.secret_key))
            .form(&form_params)
            .send()
            .await
            .map_err(|e| format!("Request error: {}", e))?;

        if !response.status().is_success() {
            let error_text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            return Err(format!("Stripe error: {}", error_text));
        }

        response
            .json::<StripeCheckoutSessionResponse>()
            .await
            .map_err(|e| format!("Parse error: {}", e))
    }

    pub async fn get_checkout_session(
        &self,
        session_id: &str,
    ) -> Result<StripeCheckoutSession, String> {
        let response = self
            .client
            .get(format!(
                "https://api.stripe.com/v1/checkout/sessions/{}",
                session_id
            ))
            .header("Authorization", format!("Bearer {}", self.secret_key))
            .send()
            .await
            .map_err(|e| format!("Request error: {}", e))?;

        if !response.status().is_success() {
            let error_text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            return Err(format!("Stripe error: {}", error_text));
        }

        response
            .json::<StripeCheckoutSession>()
            .await
            .map_err(|e| format!("Parse error: {}", e))
    }

    pub async fn construct_webhook_event(
        &self,
        payload: &[u8],
        signature: &str,
        webhook_secret: &str,
    ) -> Result<StripeWebhookEvent, String> {
        // For webhook signature verification, we'll use stripe-rs or implement manually
        // For now, we'll parse the JSON directly (in production, verify signature!)
        serde_json::from_slice::<StripeWebhookEvent>(payload)
            .map_err(|e| format!("Parse error: {}", e))
    }
}
