use crate::models::{
    MercadoPagoPayment, MercadoPagoPaymentCreate, MercadoPagoPreference, MercadoPagoPreferenceResponse,
};

pub struct MercadoPagoClient {
    access_token: String,
    client: reqwest::Client,
}

impl MercadoPagoClient {
    pub fn new(access_token: String) -> Self {
        Self {
            access_token,
            client: reqwest::Client::new(),
        }
    }

    pub async fn create_preference(
        &self,
        preference: &MercadoPagoPreference,
    ) -> Result<MercadoPagoPreferenceResponse, String> {
        let response = self
            .client
            .post("https://api.mercadopago.com/checkout/preferences")
            .header("Authorization", format!("Bearer {}", self.access_token))
            .header("Content-Type", "application/json")
            .json(preference)
            .send()
            .await
            .map_err(|e| format!("Request error: {}", e))?;

        if !response.status().is_success() {
            let error_text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            return Err(format!("MercadoPago error: {}", error_text));
        }

        response
            .json::<MercadoPagoPreferenceResponse>()
            .await
            .map_err(|e| format!("Parse error: {}", e))
    }

    pub async fn get_payment(&self, payment_id: &str) -> Result<MercadoPagoPayment, String> {
        let response = self
            .client
            .get(format!(
                "https://api.mercadopago.com/v1/payments/{}",
                payment_id
            ))
            .header("Authorization", format!("Bearer {}", self.access_token))
            .send()
            .await
            .map_err(|e| format!("Request error: {}", e))?;

        if !response.status().is_success() {
            let error_text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            return Err(format!("MercadoPago error: {}", error_text));
        }

        response
            .json::<MercadoPagoPayment>()
            .await
            .map_err(|e| format!("Parse error: {}", e))
    }

    pub async fn create_payment(
        &self,
        payment: &MercadoPagoPaymentCreate,
    ) -> Result<MercadoPagoPayment, String> {
        let response = self
            .client
            .post("https://api.mercadopago.com/v1/payments")
            .header("Authorization", format!("Bearer {}", self.access_token))
            .header("Content-Type", "application/json")
            .header("X-Idempotency-Key", uuid::Uuid::new_v4().to_string())
            .json(payment)
            .send()
            .await
            .map_err(|e| format!("Request error: {}", e))?;

        if !response.status().is_success() {
            let error_text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            return Err(format!("MercadoPago error: {}", error_text));
        }

        response
            .json::<MercadoPagoPayment>()
            .await
            .map_err(|e| format!("Parse error: {}", e))
    }
}
