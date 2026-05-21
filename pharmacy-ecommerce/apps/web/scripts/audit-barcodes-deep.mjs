#!/usr/bin/env node
// Auditoría profunda: detecta clases ocultas de mismatch.
// 1. barcodes que coinciden con external_id de OTRO producto (POS resolveria mal).
// 2. barcodes que coinciden con supplier_product_mappings.supplier_code de OTRO producto.
// 3. EAN-13 checksum invalido (lista completa).
// 4. barcodes con whitespace / leading-zero / case variation.
// 5. productos con multiples barcodes (legitimos: pack + unidad, o caja + blister).
// Salida: reportes/barcode-issues-YYYY-MM-DD.json
import { Connector, IpAddressTypes, AuthTypes } from '@google-cloud/cloud-sql-connector';
import { GoogleAuth } from 'google-auth-library';
import pg from 'pg';
import { config } from 'dotenv';
import { writeFileSync, mkdirSync } from 'fs';
config({ path: '.env.prod-temp' });

const raw = process.env.GOOGLE_SERVICE_ACCOUNT.trim().replace(/\n/g, '\\n').replace(/\r/g, '');
const cr = JSON.parse(raw); cr.private_key = cr.private_key.replace(/\\n/g, '\n');
const auth = new GoogleAuth({ credentials: cr, scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
const conn = new Connector({ auth });
const opts = await conn.getOptions({ instanceConnectionName: process.env.CLOUD_SQL_INSTANCE.trim(), ipType: IpAddressTypes.PUBLIC, authType: AuthTypes.PASSWORD });
const pool = new pg.Pool({ ...opts, user: process.env.DB_USER.trim(), password: process.env.DB_PASSWORD.trim(), database: process.env.DB_NAME.trim(), max: 1 });
const c = await pool.connect();

const ean13Checksum = (s12) => {
  const d = s12.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += d[i] * (i % 2 === 0 ? 1 : 3);
  return ((10 - (sum % 10)) % 10).toString();
};
const ean13Valid = (s) => /^\d{13}$/.test(s) && ean13Checksum(s.slice(0, 12)) === s[12];
const ean8Checksum = (s7) => {
  const d = s7.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 7; i++) sum += d[i] * (i % 2 === 0 ? 3 : 1);
  return ((10 - (sum % 10)) % 10).toString();
};
const ean8Valid = (s) => /^\d{8}$/.test(s) && ean8Checksum(s.slice(0, 7)) === s[7];

const report = {};

// ---- 1. barcode collisions with external_id of OTHER product ----
const collideExt = await c.query(`
  SELECT pb.barcode, pb.product_id AS bc_product_id, pb_p.name AS bc_product_name,
         p2.id AS ext_product_id, p2.name AS ext_product_name, p2.external_id
  FROM product_barcodes pb
  JOIN products pb_p ON pb_p.id = pb.product_id
  JOIN products p2 ON p2.external_id = pb.barcode AND p2.id <> pb.product_id
`);
report.collision_with_external_id = collideExt.rows;
console.log(`\n[1] Barcodes que son external_id de OTRO producto: ${collideExt.rows.length}`);
if (collideExt.rows.length) console.table(collideExt.rows.slice(0, 10));

// ---- 2. barcode == supplier_code de mapping a OTRO producto ----
const collideSup = await c.query(`
  SELECT pb.barcode, pb.product_id AS bc_product, pb_p.name AS bc_name,
         spm.product_id AS sup_product, sup_p.name AS sup_name, s.name AS supplier
  FROM product_barcodes pb
  JOIN products pb_p ON pb_p.id = pb.product_id
  JOIN supplier_product_mappings spm ON spm.supplier_code = pb.barcode AND spm.product_id <> pb.product_id
  JOIN products sup_p ON sup_p.id = spm.product_id
  JOIN suppliers s ON s.id = spm.supplier_id
  LIMIT 200
`);
report.collision_with_supplier_mapping = collideSup.rows;
console.log(`\n[2] Barcodes que son supplier_code de OTRO producto: ${collideSup.rows.length}`);
if (collideSup.rows.length) console.table(collideSup.rows.slice(0, 10));

// ---- 3. EAN-13 checksum invalido completo ----
const ean13BadQ = await c.query(`
  SELECT pb.barcode, pb.product_id, p.name, p.active
  FROM product_barcodes pb
  JOIN products p ON p.id = pb.product_id
  WHERE LENGTH(pb.barcode) = 13 AND pb.barcode ~ '^\\d{13}$'
`);
const ean13Bad = ean13BadQ.rows.filter(r => !ean13Valid(r.barcode))
  .map(r => ({ ...r, suggested_checksum_fix: r.barcode.slice(0, 12) + ean13Checksum(r.barcode.slice(0, 12)) }));
report.ean13_bad_checksum = ean13Bad;
console.log(`\n[3] EAN-13 con checksum invalido: ${ean13Bad.length} (activos: ${ean13Bad.filter(r => r.active).length})`);
console.table(ean13Bad.slice(0, 15));

// ---- 4. EAN-8 checksum invalido ----
const ean8BadQ = await c.query(`
  SELECT pb.barcode, pb.product_id, p.name, p.active
  FROM product_barcodes pb JOIN products p ON p.id = pb.product_id
  WHERE LENGTH(pb.barcode) = 8 AND pb.barcode ~ '^\\d{8}$'
`);
const ean8Bad = ean8BadQ.rows.filter(r => !ean8Valid(r.barcode));
report.ean8_bad_checksum = ean8Bad;
console.log(`\n[4] EAN-8 invalido: ${ean8Bad.length}`);

// ---- 5. Productos con >1 barcode ----
const multi = await c.query(`
  SELECT p.id, p.name, p.active, array_agg(pb.barcode ORDER BY pb.barcode) AS barcodes, COUNT(*) AS n
  FROM products p JOIN product_barcodes pb ON pb.product_id = p.id
  GROUP BY p.id, p.name, p.active HAVING COUNT(*) > 1
  ORDER BY COUNT(*) DESC LIMIT 50
`);
report.multi_barcode_products = multi.rows;
console.log(`\n[5] Productos con >1 barcode (top 50): ${multi.rows.length}`);
console.table(multi.rows.slice(0, 10));

// ---- 6. whitespace / non-trim ----
const dirty = await c.query(`
  SELECT barcode, product_id FROM product_barcodes
  WHERE barcode <> TRIM(barcode) OR barcode ~ '\\s'
`);
report.dirty_whitespace = dirty.rows;
console.log(`\n[6] Barcodes con whitespace: ${dirty.rows.length}`);

// ---- 7. distribucion de formatos ----
const dist = await c.query(`
  SELECT LENGTH(barcode) AS len, COUNT(*)::int AS n
  FROM product_barcodes GROUP BY LENGTH(barcode) ORDER BY n DESC
`);
report.length_distribution = dist.rows;
console.log(`\n[7] Distribucion por longitud:`);
console.table(dist.rows);

// ---- save ----
mkdirSync('reportes', { recursive: true });
const date = new Date().toISOString().slice(0, 10);
const file = `reportes/barcode-issues-${date}.json`;
writeFileSync(file, JSON.stringify(report, null, 2));
console.log(`\nReporte guardado: ${file}`);
console.log(`\n== RESUMEN ==`);
console.log(`Collisions w/ external_id : ${report.collision_with_external_id.length}`);
console.log(`Collisions w/ supplier_code: ${report.collision_with_supplier_mapping.length}`);
console.log(`EAN-13 checksum bad        : ${report.ean13_bad_checksum.length} (${ean13Bad.filter(r=>r.active).length} activos)`);
console.log(`EAN-8 checksum bad         : ${report.ean8_bad_checksum.length}`);
console.log(`Multi-barcode products     : ${report.multi_barcode_products.length}`);
console.log(`Dirty whitespace           : ${report.dirty_whitespace.length}`);

c.release(); await pool.end(); conn.close();
