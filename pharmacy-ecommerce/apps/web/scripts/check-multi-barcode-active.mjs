#!/usr/bin/env node
// Verifica productos ACTIVOS con multiples barcodes. Pack+blister es legitimo (2-3).
// >5 es sospechoso: probable stub que absorbio EANs ajenos.
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
  SELECT p.name, COUNT(*)::int AS n, array_agg(pb.barcode ORDER BY pb.barcode) AS barcodes
  FROM products p JOIN product_barcodes pb ON pb.product_id = p.id
  WHERE p.active = true
  GROUP BY p.id, p.name HAVING COUNT(*) > 3
  ORDER BY n DESC LIMIT 30
`);
console.log(`Productos activos con >3 barcodes: ${r.rows.length}`);
console.table(r.rows.map(x => ({ name: x.name, n: x.n, first3: x.barcodes.slice(0, 3).join(', ') + (x.n > 3 ? '...' : '') })));

const dist = await c.query(`
  SELECT bc_count, COUNT(*)::int AS n_products
  FROM (SELECT product_id, COUNT(*) AS bc_count FROM product_barcodes pb
        JOIN products p ON p.id = pb.product_id WHERE p.active = true
        GROUP BY product_id) sub
  GROUP BY bc_count ORDER BY bc_count
`);
console.log('\nDistribucion barcodes-por-producto-activo:');
console.table(dist.rows);

c.release(); await pool.end(); conn.close();
