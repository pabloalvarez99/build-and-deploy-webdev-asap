#!/usr/bin/env node
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

const r = await c.query(`
  SELECT
    pb.barcode,
    pb_p.id AS bc_id, pb_p.name AS bc_name, pb_p.active AS bc_active,
    p2.id AS ext_id, p2.name AS ext_name, p2.active AS ext_active
  FROM product_barcodes pb
  JOIN products pb_p ON pb_p.id = pb.product_id
  JOIN products p2 ON p2.external_id = pb.barcode AND p2.id <> pb.product_id
  ORDER BY p2.active DESC, pb_p.active DESC
`);

const both_active = r.rows.filter(x => x.bc_active && x.ext_active);
const only_ext = r.rows.filter(x => !x.bc_active && x.ext_active);
const only_bc = r.rows.filter(x => x.bc_active && !x.ext_active);
const none = r.rows.filter(x => !x.bc_active && !x.ext_active);

console.log(`Total colisiones: ${r.rows.length}`);
console.log(`Ambos activos       : ${both_active.length}  <- review manual`);
console.log(`Solo ext activo     : ${only_ext.length}  <- safe delete pb row`);
console.log(`Solo bc activo      : ${only_bc.length}   <- review`);
console.log(`Ninguno activo      : ${none.length}    <- safe delete`);

console.log('\n[BOTH ACTIVE]'); console.table(both_active);
console.log('\n[ONLY BC ACTIVE]'); console.table(only_bc);
console.log('\n[ONLY EXT ACTIVE - safe to remove pb row, will restore ext fallback]');
console.table(only_ext.slice(0, 30));

c.release(); await pool.end(); conn.close();
