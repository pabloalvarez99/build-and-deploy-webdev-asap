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
const po = await c.query(`
  SELECT po.invoice_number, po.status, po.invoice_format, s.name AS supplier,
    (SELECT COUNT(*) FROM purchase_order_items WHERE purchase_order_id=po.id) AS items,
    (SELECT COUNT(*) FROM purchase_order_items WHERE purchase_order_id=po.id AND product_id IS NOT NULL) AS mapped
  FROM purchase_orders po JOIN suppliers s ON s.id=po.supplier_id
  WHERE po.invoice_number IN ('0000750277','0000740850','3625647')`);
console.table(po.rows);

const b = await c.query(`SELECT batch_code, expiry_date, quantity, notes FROM product_batches WHERE notes ILIKE 'Factura 3625647%' ORDER BY batch_code`);
console.log('\nlotes Mediven:'); console.table(b.rows);

const sm = await c.query(`SELECT reason, COUNT(*) AS n, SUM(delta) AS total_delta FROM stock_movements WHERE admin_id='script:receive-draft-ocs' GROUP BY reason`);
console.log('\nstock_movements creados:'); console.table(sm.rows);
c.release(); await pool.end(); conn.close();
