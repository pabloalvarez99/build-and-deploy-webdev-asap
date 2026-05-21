#!/usr/bin/env node
// Phase A: asigna EAN-13 interno (prefix 2, GS1 in-store) a productos activos sin barcode.
// Formato: 2 + 99 + zero-pad(seq,10) + checksum. Insert en product_barcodes + barcode_catalog.
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

const ean13Checksum = (s12) => {
  const d = s12.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += d[i] * (i % 2 === 0 ? 1 : 3);
  return ((10 - (sum % 10)) % 10).toString();
};

const missing = await c.query(`
  SELECT p.id, p.name, p.external_id
  FROM products p
  WHERE p.active = true AND NOT EXISTS (SELECT 1 FROM product_barcodes pb WHERE pb.product_id = p.id)
  ORDER BY p.name
`);
console.log(`Productos sin barcode: ${missing.rows.length}`);

const usedQ = await c.query(`SELECT MAX(CAST(SUBSTRING(barcode FROM 4 FOR 10) AS BIGINT)) AS max_seq
                              FROM product_barcodes WHERE barcode LIKE '299%' AND LENGTH(barcode)=13`);
let seq = (usedQ.rows[0]?.max_seq ? Number(usedQ.rows[0].max_seq) : 0) + 1;
console.log(`Sequence start: ${seq}`);

await c.query('BEGIN');
const assigned = [];
try {
  for (const p of missing.rows) {
    const body = '299' + String(seq).padStart(10, '0');
    const barcode = body + ean13Checksum(body);
    seq++;
    await c.query(`INSERT INTO product_barcodes (product_id, barcode) VALUES ($1, $2)`, [p.id, barcode]);
    if (p.external_id) {
      await c.query(`INSERT INTO barcode_catalog (external_id, barcode) VALUES ($1, $2) ON CONFLICT (barcode) DO NOTHING`, [p.external_id, barcode]);
    }
    assigned.push({ name: p.name, external_id: p.external_id, barcode });
  }
  await c.query('COMMIT');
  console.log('\nAssigned:');
  console.table(assigned);
} catch (e) {
  await c.query('ROLLBACK');
  console.error('ROLLBACK:', e.message);
  process.exitCode = 1;
}

const verify = await c.query(`
  SELECT COUNT(*)::int AS still_missing
  FROM products p
  WHERE p.active = true AND NOT EXISTS (SELECT 1 FROM product_barcodes pb WHERE pb.product_id = p.id)
`);
console.log(`\nStill missing: ${verify.rows[0].still_missing}`);

c.release(); await pool.end(); conn.close();
