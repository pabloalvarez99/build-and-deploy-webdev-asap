-- Step 2: add default_invoice_format
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS default_invoice_format VARCHAR(20);

-- Step 1: seed Mediven + Global (idempotent)
INSERT INTO suppliers (name, rut, contact_email, contact_phone, notes, default_invoice_format, active)
SELECT 'Mediven SpA', '76425071-0', 'mediven@mediven.cl', '+56 2 3202 6297',
       'Distribuidora — Factura Electrónica SII (con lotes)', 'mediven', true
WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE rut = '76425071-0' OR name ILIKE 'mediven%');

INSERT INTO suppliers (name, rut, notes, default_invoice_format, active)
SELECT 'Global', NULL,
       'Distribuidora — formato Comprobante de Pedido. PDF no imprime RUT del proveedor.',
       'global', true
WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name ILIKE 'global');

-- Backfill format en suppliers existentes con mismo nombre
UPDATE suppliers SET default_invoice_format = 'mediven'
  WHERE (rut = '76425071-0' OR name ILIKE 'mediven%') AND default_invoice_format IS NULL;
UPDATE suppliers SET default_invoice_format = 'global'
  WHERE name ILIKE 'global' AND default_invoice_format IS NULL;

-- Step 3: idempotency — unique invoice per supplier
CREATE UNIQUE INDEX IF NOT EXISTS purchase_orders_supplier_invoice_unique
  ON purchase_orders (supplier_id, invoice_number)
  WHERE invoice_number IS NOT NULL;
