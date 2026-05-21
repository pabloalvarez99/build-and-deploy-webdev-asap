-- Log de codigos escaneados en POS que no resolvieron a ningun producto.
-- Permite al admin revisar y crear/asignar productos faltantes (catalog gaps).
CREATE TABLE IF NOT EXISTS unknown_barcode_scans (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode            VARCHAR(100) NOT NULL UNIQUE,
  first_scanned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_scanned_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scan_count         INT NOT NULL DEFAULT 1,
  last_user_id       UUID NULL,
  resolved_at        TIMESTAMPTZ NULL,
  resolved_product_id UUID NULL REFERENCES products(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_ubs_unresolved ON unknown_barcode_scans (last_scanned_at DESC)
  WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ubs_count ON unknown_barcode_scans (scan_count DESC)
  WHERE resolved_at IS NULL;
