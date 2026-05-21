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
  SELECT poi.product_name_invoice, poi.supplier_product_code, poi.quantity,
         po.created_at::date AS date, s.name AS supplier, p.name AS matched_product
  FROM purchase_order_items poi
  JOIN purchase_orders po ON po.id = poi.purchase_order_id
  JOIN suppliers s ON s.id = po.supplier_id
  LEFT JOIN products p ON p.id = poi.product_id
  WHERE poi.product_name_invoice ILIKE '%vaselina%'
  ORDER BY po.created_at DESC LIMIT 30
`);
console.log(`Compras VASELINA recientes: ${r.rows.length}`);
console.table(r.rows);

c.release(); await pool.end(); conn.close();
