#!/usr/bin/env node
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

const missing = await c.query(`
  SELECT COUNT(*)::int AS n FROM products p
  WHERE p.active = true AND NOT EXISTS (SELECT 1 FROM product_barcodes pb WHERE pb.product_id = p.id)
`);
console.log(`Productos activos sin barcode: ${missing.rows[0].n} (esperado: 0)`);

const ean13Bad = await c.query(`
  SELECT pb.barcode, p.id, p.name FROM product_barcodes pb
  JOIN products p ON p.id = pb.product_id
  WHERE p.active = true AND LENGTH(pb.barcode) = 13 AND pb.barcode ~ '^\\d{13}$'
`);
const ean13Checksum = (s12) => {
  const d = s12.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += d[i] * (i % 2 === 0 ? 1 : 3);
  return ((10 - (sum % 10)) % 10).toString();
};
const active_bad = ean13Bad.rows.filter(r => ean13Checksum(r.barcode.slice(0, 12)) !== r.barcode[12])
  .map(r => ({ ...r, suggested: r.barcode.slice(0, 12) + ean13Checksum(r.barcode.slice(0, 12)) }));
console.log(`\nEAN-13 activos con checksum invalido: ${active_bad.length}`);
console.table(active_bad);

const totals = await c.query(`
  SELECT
    (SELECT COUNT(*) FROM product_barcodes) AS pb,
    (SELECT COUNT(*) FROM barcode_catalog) AS bc,
    (SELECT COUNT(DISTINCT product_id) FROM product_barcodes) AS prod_with_bc
`);
console.log('\nTotales post-fix:'); console.table(totals.rows);

mkdirSync('reportes', { recursive: true });
writeFileSync('reportes/ean13-checksum-active.csv',
  'barcode,product_id,name,suggested_fix\n' +
  active_bad.map(r => `${r.barcode},${r.id},"${r.name.replace(/"/g, '""')}",${r.suggested}`).join('\n')
);
console.log('\nCSV: reportes/ean13-checksum-active.csv (para revision humana)');

c.release(); await pool.end(); conn.close();
