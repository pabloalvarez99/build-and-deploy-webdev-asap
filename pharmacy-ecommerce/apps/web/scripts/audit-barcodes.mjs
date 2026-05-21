#!/usr/bin/env node
// Audita estado de codigos de barra: cobertura, duplicados, checksums EAN-13,
// y mismatches entre barcode_catalog (external_id->barcode) y product_barcodes (product->barcode).
import { Connector, IpAddressTypes, AuthTypes } from '@google-cloud/cloud-sql-connector';
import { GoogleAuth } from 'google-auth-library';
import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env.prod-temp' });

const raw = process.env.GOOGLE_SERVICE_ACCOUNT.trim().replace(/\n/g, '\\n').replace(/\r/g, '');
const cr = JSON.parse(raw); cr.private_key = cr.private_key.replace(/\\n/g, '\n');
const auth = new GoogleAuth({ credentials: cr, scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
const conn = new Connector({ auth });
const opts = await conn.getOptions({ instanceConnectionName: process.env.CLOUD_SQL_INSTANCE.trim(), ipType: IpAddressTypes.PUBLIC, authType: AuthTypes.PASSWORD });
const pool = new pg.Pool({ ...opts, user: process.env.DB_USER.trim(), password: process.env.DB_PASSWORD.trim(), database: process.env.DB_NAME.trim(), max: 1 });
const c = await pool.connect();

const ean13Valid = (s) => {
  if (!/^\d{13}$/.test(s)) return false;
  const d = s.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += d[i] * (i % 2 === 0 ? 1 : 3);
  return (10 - (sum % 10)) % 10 === d[12];
};
const ean8Valid = (s) => {
  if (!/^\d{8}$/.test(s)) return false;
  const d = s.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 7; i++) sum += d[i] * (i % 2 === 0 ? 3 : 1);
  return (10 - (sum % 10)) % 10 === d[7];
};

const totals = await c.query(`
  SELECT
    (SELECT COUNT(*) FROM products WHERE active = true) AS active_products,
    (SELECT COUNT(*) FROM products) AS all_products,
    (SELECT COUNT(*) FROM product_barcodes) AS pb_rows,
    (SELECT COUNT(DISTINCT product_id) FROM product_barcodes) AS products_with_barcode,
    (SELECT COUNT(*) FROM barcode_catalog) AS catalog_rows,
    (SELECT COUNT(DISTINCT external_id) FROM barcode_catalog) AS catalog_distinct_ext
`);
console.log('\n== TOTALES ==');
console.table(totals.rows);

const noBc = await c.query(`
  SELECT COUNT(*)::int AS n
  FROM products p
  WHERE p.active = true AND NOT EXISTS (SELECT 1 FROM product_barcodes pb WHERE pb.product_id = p.id)
`);
console.log(`\n== PRODUCTOS ACTIVOS SIN BARCODE: ${noBc.rows[0].n} ==`);

const sample = await c.query(`
  SELECT p.id, p.name, p.external_id
  FROM products p
  WHERE p.active = true AND NOT EXISTS (SELECT 1 FROM product_barcodes pb WHERE pb.product_id = p.id)
  ORDER BY p.name
  LIMIT 20
`);
console.table(sample.rows);

const allBc = await c.query(`SELECT barcode FROM product_barcodes`);
const bad = [];
for (const { barcode } of allBc.rows) {
  const b = barcode.trim();
  if (/^\d{13}$/.test(b) && !ean13Valid(b)) bad.push({ barcode: b, type: 'EAN13-bad-checksum' });
  else if (/^\d{8}$/.test(b) && !ean8Valid(b)) bad.push({ barcode: b, type: 'EAN8-bad-checksum' });
  else if (!/^\d{8}$|^\d{12,14}$/.test(b)) bad.push({ barcode: b, type: 'non-standard-format' });
}
console.log(`\n== BARCODES INVALIDOS: ${bad.length} de ${allBc.rows.length} ==`);
console.table(bad.slice(0, 30));

const mismatch = await c.query(`
  SELECT p.id, p.name, p.external_id,
         array_agg(DISTINCT pb.barcode) AS in_product_barcodes,
         array_agg(DISTINCT bc.barcode) AS in_catalog
  FROM products p
  JOIN barcode_catalog bc ON bc.external_id = p.external_id
  JOIN product_barcodes pb ON pb.product_id = p.id
  WHERE p.active = true
  GROUP BY p.id, p.name, p.external_id
  HAVING NOT (array_agg(DISTINCT bc.barcode) <@ array_agg(DISTINCT pb.barcode))
  LIMIT 30
`);
console.log(`\n== MISMATCH catalog vs product_barcodes (muestra ${mismatch.rows.length}) ==`);
console.table(mismatch.rows);

const orphans = await c.query(`
  SELECT bc.external_id, bc.barcode
  FROM barcode_catalog bc
  WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.external_id = bc.external_id)
  LIMIT 20
`);
console.log(`\n== BARCODE_CATALOG SIN PRODUCTO (external_id huerfano) muestra: ==`);
console.table(orphans.rows);

c.release(); await pool.end(); conn.close();
