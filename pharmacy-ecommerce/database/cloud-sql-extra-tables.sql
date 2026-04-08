-- Extra tables added via Supabase dashboard (not in original schema).
-- Run this ONLY if pg_dump import did NOT include these tables.

-- Admin settings (key/value store for alert_email, low_stock_threshold)
CREATE TABLE IF NOT EXISTS admin_settings (
    key   VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL
);
INSERT INTO admin_settings (key, value) VALUES
    ('low_stock_threshold', '10'),
    ('alert_email', '')
ON CONFLICT (key) DO NOTHING;

-- Stock movements log (audit trail for stock adjustments)
CREATE TABLE IF NOT EXISTS stock_movements (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    delta      INTEGER NOT NULL,
    reason     VARCHAR(50) NOT NULL,
    admin_id   VARCHAR(255) NOT NULL,  -- Firebase UID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON stock_movements(created_at DESC);

-- discount_percent column on products (if not already present from pg_dump)
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percent INTEGER;
