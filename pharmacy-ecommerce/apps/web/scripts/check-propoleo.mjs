#!/usr/bin/env node
import { Connector, IpAddressTypes, AuthTypes } from '@google-cloud/cloud-sql-connector';
import { GoogleAuth } from 'google-auth-library';
import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env.prod-temp' });
const raw = process.env.GOOGLE_SERVICE_ACCOUNT.trim().replace(/\n/g,'\\n').replace(/\r/g,'');
const cr = JSON.parse(raw); cr.private_key = cr.private_key.replace(/\\n/g,'\n');
const auth = new GoogleAuth({ credentials: cr, scopes:['https://www.googleapis.com/auth/cloud-platform'] });
const conn = new Connector({ auth });
const opts = await conn.getOptions({ instanceConnectionName: process.env.CLOUD_SQL_INSTANCE.trim(), ipType: IpAddressTypes.PUBLIC, authType: AuthTypes.PASSWORD });
const pool = new pg.Pool({ ...opts, user: process.env.DB_USER.trim(), password: process.env.DB_PASSWORD.trim(), database: process.env.DB_NAME.trim(), max: 1 });
const c = await pool.connect();
const r = await c.query(`SELECT i.id, i.product_id, i.product_name_invoice, i.supplier_product_code, i.quantity, p.name AS matched FROM purchase_order_items i LEFT JOIN products p ON p.id=i.product_id WHERE i.product_name_invoice ILIKE '%PROPOLEO%VITC%'`);
console.table(r.rows);
c.release(); await pool.end(); conn.close();
