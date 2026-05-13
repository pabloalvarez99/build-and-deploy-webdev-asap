-- Revert false-positive fuzzy match: PROPOLEO+VITC SP.AD.30 ML fue mapeado a SL.VITC EFV.NAR.1000MG.20
-- supplier_product_code = '9990256' (Global), qty=9
-- Bug introducido por scripts/remap-unmapped-items.ts (score 0.50 inflado porque ambos tienen "VITC").

BEGIN;

-- 1) Revertir stock incrementado
UPDATE products
SET stock = stock - 9
WHERE id = '72251110-3933-434c-ae12-05cb428e53d7';

-- 2) Borrar stock_movement que generó receive
DELETE FROM stock_movements
WHERE product_id = '72251110-3933-434c-ae12-05cb428e53d7'
  AND admin_id = 'script:receive-draft-ocs'
  AND delta = 9
  AND reason = 'reposicion';

-- 3) Borrar mapping erróneo (próxima factura no debe heredar este error)
DELETE FROM supplier_product_mappings
WHERE supplier_code = '9990256'
  AND product_id = '72251110-3933-434c-ae12-05cb428e53d7';

-- 4) Desvincular el item de la OC (queda unmapped, operador resuelve manual)
UPDATE purchase_order_items
SET product_id = NULL
WHERE id = 'd6257567-8d7d-4474-a69d-f42ee85118fa';

COMMIT;
