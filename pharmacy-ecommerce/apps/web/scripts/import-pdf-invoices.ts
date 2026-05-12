#!/usr/bin/env tsx
// Importa PDFs de facturas como purchase_orders en estado 'draft'.
// Realiza:
//   1) pdf-parse → texto
//   2) parseInvoice → header + lines
//   3) Resolver supplier por RUT o default_invoice_format
//   4) Mapear cada línea por supplier_product_mappings (supplier_code → product_id)
//      o fallback por nombre (fuzzy ILIKE)
//   5) Idempotencia: si ya existe la OC (mismo supplier_id+invoice_number) → skip
//   6) Crear purchase_order + items con TODOS los datos (batch_code, expiry, neto/IVA, due_date, po_ref)
//
// Uso: npx tsx scripts/import-pdf-invoices.ts <pdf1> [pdf2...]

import { PDFParse } from 'pdf-parse';
import fs from 'fs';
import path from 'path';
import { Connector, IpAddressTypes, AuthTypes } from '@google-cloud/cloud-sql-connector';
import { GoogleAuth } from 'google-auth-library';
import pg from 'pg';
import { config as dotenv } from 'dotenv';
import { parseInvoice } from '../src/lib/invoice-parser';
import type { ParsedInvoice, InvoiceLine } from '../src/lib/invoice-parser';

dotenv({ path: '.env.prod-temp' });

async function getPool() {
  const rawSA = process.env.GOOGLE_SERVICE_ACCOUNT!.trim().replace(/\n/g, '\\n').replace(/\r/g, '');
  const cr = JSON.parse(rawSA);
  cr.private_key = cr.private_key.replace(/\\n/g, '\n');
  const auth = new GoogleAuth({ credentials: cr, scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
  const conn = new Connector({ auth });
  const opts = await conn.getOptions({
    instanceConnectionName: process.env.CLOUD_SQL_INSTANCE!.trim(),
    ipType: IpAddressTypes.PUBLIC,
    authType: AuthTypes.PASSWORD,
  });
  const pool = new pg.Pool({
    ...opts,
    user: process.env.DB_USER!.trim(),
    password: process.env.DB_PASSWORD!.trim(),
    database: process.env.DB_NAME!.trim(),
    max: 1,
  });
  return { pool, conn };
}

async function pdfToText(pdfPath: string): Promise<string> {
  const buf = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: buf });
  const r = await parser.getText();
  return r.text;
}

async function resolveSupplier(client: pg.PoolClient, parsed: ParsedInvoice): Promise<{ id: string; name: string } | null> {
  if (parsed.header.supplier_rut) {
    const digits = parsed.header.supplier_rut.replace(/[^\dkK]/gi, '').slice(0, -1);
    const r = await client.query(
      `SELECT id, name FROM suppliers WHERE active = true AND (rut = $1 OR REPLACE(REPLACE(rut,'.',''),'-','') LIKE $2) LIMIT 1`,
      [parsed.header.supplier_rut, `${digits}%`]
    );
    if (r.rows[0]) return r.rows[0];
  }
  if (parsed.format !== 'generic') {
    const r = await client.query(
      `SELECT id, name FROM suppliers WHERE active = true AND default_invoice_format = $1 LIMIT 1`,
      [parsed.format]
    );
    if (r.rows[0]) return r.rows[0];
  }
  return null;
}

async function mapLineToProduct(
  client: pg.PoolClient,
  supplierId: string,
  line: InvoiceLine
): Promise<string | null> {
  if (line.supplier_product_code) {
    const r = await client.query(
      `SELECT product_id FROM supplier_product_mappings WHERE supplier_id=$1 AND supplier_code=$2 LIMIT 1`,
      [supplierId, line.supplier_product_code]
    );
    if (r.rows[0]) return r.rows[0].product_id;
  }
  // Fuzzy fallback por nombre: tomar primer token significativo
  const tokens = line.product_name_invoice.split(/\s+/).filter((t) => t.length >= 3);
  if (tokens.length < 1) return null;
  const firstToken = tokens[0];
  const r = await client.query(
    `SELECT id FROM products WHERE active = true AND name ILIKE $1 ORDER BY length(name) ASC LIMIT 1`,
    [`%${firstToken}%`]
  );
  return r.rows[0]?.id ?? null;
}

async function importPdf(client: pg.PoolClient, pdfPath: string) {
  console.log(`\n━━━ ${path.basename(pdfPath)} ━━━`);
  const text = await pdfToText(pdfPath);
  const parsed = parseInvoice(text);
  console.log(`format=${parsed.format} folio=${parsed.header.invoice_number} lines=${parsed.lines.length} total=${parsed.header.total}`);

  const supplier = await resolveSupplier(client, parsed);
  if (!supplier) {
    console.error(`✗ no supplier match (rut=${parsed.header.supplier_rut} format=${parsed.format}) — skip`);
    return;
  }
  console.log(`supplier=${supplier.name} (${supplier.id})`);

  // Idempotencia
  if (parsed.header.invoice_number) {
    const exist = await client.query(
      `SELECT id FROM purchase_orders WHERE supplier_id=$1 AND invoice_number=$2`,
      [supplier.id, parsed.header.invoice_number]
    );
    if (exist.rows[0]) {
      console.log(`↻ ya existe OC ${exist.rows[0].id} — skip`);
      return;
    }
  }

  await client.query('BEGIN');
  try {
    const totalCost = parsed.lines.reduce((s, l) => s + l.subtotal, 0);
    const poRes = await client.query(
      `INSERT INTO purchase_orders
       (supplier_id, invoice_number, invoice_date, due_date, status, total_cost,
        subtotal_net, tax_amount, invoice_format, po_reference, ocr_raw, created_by)
       VALUES ($1,$2,$3,$4,'draft',$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [
        supplier.id,
        parsed.header.invoice_number,
        parsed.header.invoice_date,
        parsed.header.due_date,
        totalCost,
        parsed.header.subtotal_net,
        parsed.header.tax_amount,
        parsed.format,
        parsed.header.po_reference,
        text,
        'script:import-pdf-invoices',
      ]
    );
    const poId = poRes.rows[0].id;
    console.log(`✓ OC creada ${poId}`);

    let mapped = 0;
    for (const line of parsed.lines) {
      const productId = await mapLineToProduct(client, supplier.id, line);
      if (productId) mapped++;
      await client.query(
        `INSERT INTO purchase_order_items
         (purchase_order_id, product_id, supplier_product_code, product_name_invoice,
          quantity, unit_cost, subtotal, batch_code, expiry_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          poId,
          productId,
          line.supplier_product_code,
          line.product_name_invoice,
          line.quantity,
          line.unit_cost,
          line.subtotal,
          line.batch_code,
          line.expiry_date,
        ]
      );
    }
    await client.query('COMMIT');
    console.log(`✓ ${parsed.lines.length} items insertados (${mapped} con product_id mapeado)`);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  }
}

async function main() {
  const files = process.argv.slice(2);
  if (!files.length) { console.error('usage: import-pdf-invoices.ts <pdf>...'); process.exit(1); }

  const { pool, conn } = await getPool();
  const client = await pool.connect();
  try {
    for (const f of files) await importPdf(client, f);
  } finally {
    client.release();
    await pool.end();
    conn.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
