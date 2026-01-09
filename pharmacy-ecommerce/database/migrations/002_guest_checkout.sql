-- Migration: 002_guest_checkout.sql
-- Add guest checkout support

-- Add columns for guest orders (no login required)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_email VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_session_id VARCHAR(255);

-- Create index for guest session lookups
CREATE INDEX IF NOT EXISTS idx_orders_guest_session ON orders(guest_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_guest_email ON orders(guest_email);
