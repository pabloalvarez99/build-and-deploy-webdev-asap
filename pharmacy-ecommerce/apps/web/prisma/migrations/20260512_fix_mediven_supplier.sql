-- Fix existing supplier row: it was named with buyer info (Q&A SPA). Reassign to real Mediven.
UPDATE suppliers
SET name = 'Mediven SpA',
    rut = '76425071-0',
    contact_email = COALESCE(contact_email, 'mediven@mediven.cl'),
    contact_phone = COALESCE(contact_phone, '+56 2 3202 6297'),
    notes = COALESCE(NULLIF(notes,''), 'Distribuidora — Factura Electrónica SII (con lotes)'),
    default_invoice_format = 'mediven'
WHERE id = 'fef16d6e-f4b8-44cc-ba33-4272ab650a93';
