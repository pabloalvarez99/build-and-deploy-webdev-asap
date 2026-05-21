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
  DELETE FROM barcode_catalog bc
  WHERE NOT EXISTS (SELECT 1 FROM product_barcodes pb WHERE pb.barcode = bc.barcode)
  RETURNING barcode, external_id
`);
console.log(`Deleted ${r.rowCount} orphan catalog rows:`);
console.table(r.rows);
c.release(); await pool.end(); conn.close();
