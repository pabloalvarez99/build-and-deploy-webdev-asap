-- Migration: 003_stripe_integration.sql
-- Add Stripe payment fields to orders table

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(50) DEFAULT 'mercadopago' CHECK (payment_provider IN ('mercadopago', 'stripe')),
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);

-- Create index for Stripe fields
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment ON orders(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_provider ON orders(payment_provider);

-- Update existing orders to have default payment_provider
UPDATE orders SET payment_provider = 'mercadopago' WHERE payment_provider IS NULL;
