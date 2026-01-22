-- Migration 006: Store Pickup Reservations
-- Adds support for "Reserve and Pay in Store" feature

-- ============================================
-- PART 1: Add 'reserved' status to orders
-- ============================================

-- Update the status constraint to include 'reserved'
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'reserved', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'));

-- ============================================
-- PART 2: Add reservation-specific fields
-- ============================================

-- Reservation expiration (reservations expire if not picked up)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS reservation_expires_at TIMESTAMP WITH TIME ZONE;

-- Pickup confirmation code (for store staff to verify)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_code VARCHAR(10);

-- Customer phone (useful for store pickup notifications)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);

-- Guest name fields (for store pickup identification)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_name VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_surname VARCHAR(255);

-- ============================================
-- PART 3: Create indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_orders_reservation_expires ON orders(reservation_expires_at)
  WHERE status = 'reserved';
CREATE INDEX IF NOT EXISTS idx_orders_pickup_code ON orders(pickup_code);

-- ============================================
-- PART 4: Add 'store' to payment_provider options
-- ============================================

-- The payment_provider column already accepts any varchar,
-- but let's document the expected values:
-- 'mercadopago' - Online payment via MercadoPago
-- 'stripe' - Online payment via Stripe (future)
-- 'store' - Pay in store on pickup

COMMENT ON COLUMN orders.payment_provider IS 'Payment method: mercadopago, stripe, store (pay on pickup)';
COMMENT ON COLUMN orders.reservation_expires_at IS 'When a store reservation expires (typically 48 hours)';
COMMENT ON COLUMN orders.pickup_code IS '6-digit code for store staff to verify customer identity';
