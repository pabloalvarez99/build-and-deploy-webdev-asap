-- Migration: add tracking_token to orders for public order tracking page
-- Apply: psql / Cloud SQL proxy: \i 20260508_add_tracking_token.sql
-- Or: npx prisma db push (with DATABASE_URL set to Cloud SQL)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_token VARCHAR(64);
CREATE UNIQUE INDEX IF NOT EXISTS orders_tracking_token_key ON orders (tracking_token);

-- Backfill: assign random tokens to existing orders (so old links via /mis-pedidos can also share)
UPDATE orders
SET tracking_token = encode(gen_random_bytes(24), 'hex')
WHERE tracking_token IS NULL;
