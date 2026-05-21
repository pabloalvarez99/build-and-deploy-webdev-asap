#!/usr/bin/env node
// Regression check: corre post-import o periodicamente. Exit code 1 si detecta
// regresiones. Detecta:
//   - Colisiones barcode==external_id de OTRO producto donde AMBOS estan activos
//     (caso critico: POS resuelve a producto incorrecto entre dos vendibles).
//   - Productos activos sin ningun barcode.
//   - barcode_catalog huerfanos (sin row en product_barcodes).
// NO falla por: EAN checksum invalido (puede matchear packaging fisico),
// supplier SKU corto (legitimo), multi-barcode (legitimo).
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

let fail = false;

const crit = await c.query(`
  SELECT pb.barcode, pb_p.name AS bc_name, p2.name AS ext_name
  FROM product_barcodes pb
  JOIN products pb_p ON pb_p.id = pb.product_id AND pb_p.active = true
  JOIN products p2 ON p2.external_id = pb.barcode AND p2.id <> pb.product_id AND p2.active = true
`);
if (crit.rows.length) {
  console.error(`[FAIL] ${crit.rows.length} colisiones criticas (ambos activos):`);
  console.table(crit.rows); fail = true;
} else console.log('[OK] Sin colisiones criticas ext_id/barcode');

const missing = await c.query(`
  SELECT COUNT(*)::int AS n FROM products p
  WHERE p.active = true AND NOT EXISTS (SELECT 1 FROM product_barcodes pb WHERE pb.product_id = p.id)
`);
if (missing.rows[0].n > 0) {
  console.error(`[FAIL] ${missing.rows[0].n} productos activos sin barcode`); fail = true;
} else console.log('[OK] Todos los activos tienen barcode');

const orphan = await c.query(`
  SELECT COUNT(*)::int AS n FROM barcode_catalog bc
  WHERE NOT EXISTS (SELECT 1 FROM product_barcodes pb WHERE pb.barcode = bc.barcode)
`);
if (orphan.rows[0].n > 0) {
  console.error(`[WARN] ${orphan.rows[0].n} barcode_catalog huerfanos (no-fatal)`);
} else console.log('[OK] barcode_catalog sin huerfanos');

const dup_sup = await c.query(`
  SELECT pb.barcode, pb_p.name AS bc_name, sup_p.name AS sup_name
  FROM product_barcodes pb
  JOIN products pb_p ON pb_p.id = pb.product_id AND pb_p.active = true
  JOIN supplier_product_mappings spm ON spm.supplier_code = pb.barcode AND spm.product_id <> pb.product_id
  JOIN products sup_p ON sup_p.id = spm.product_id AND sup_p.active = true
`);
if (dup_sup.rows.length) {
  console.error(`[FAIL] ${dup_sup.rows.length} barcodes colisionan con supplier_code de OTRO producto activo:`);
  console.table(dup_sup.rows); fail = true;
} else console.log('[OK] Sin colisiones supplier_code activos');

c.release(); await pool.end(); conn.close();
if (fail) process.exit(1);
console.log('\nBarcode integrity: PASS');
