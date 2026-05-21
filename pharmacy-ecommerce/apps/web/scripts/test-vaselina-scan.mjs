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

const codes = ['7800044000447', '7805357001440', '7806130003576', '52D4BIDAX0N2AS', '10032411'];
for (const code of codes) {
  const direct = await c.query(`SELECT p.name, p.active FROM product_barcodes pb JOIN products p ON p.id = pb.product_id WHERE pb.barcode = $1`, [code]);
  const ext = await c.query(`SELECT name, active FROM products WHERE external_id = $1`, [code]);
  console.log(`\nScan: ${code}`);
  console.log(`  product_barcodes →`, direct.rows.length ? direct.rows : 'NO MATCH');
  console.log(`  external_id     →`, ext.rows.length ? ext.rows : 'NO MATCH');
}

// Tambien: buscar cualquier producto con nombre VASELINA SOLIDA REUTTER por si el escaneo
// real de la caja deberia ir a un producto que no existe (catalog gap)
const reutter_sol = await c.query(`
  SELECT name, active, external_id FROM products WHERE name ILIKE '%vaselina%solida%reutter%'
`);
console.log(`\nVASELINA SOLIDA REUTTER en DB: ${reutter_sol.rows.length}`);
console.table(reutter_sol.rows);

c.release(); await pool.end(); conn.close();
