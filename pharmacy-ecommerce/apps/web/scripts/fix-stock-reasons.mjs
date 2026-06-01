#!/usr/bin/env node
// Aplica migration_fix_stock_movements_reasons.sql a prod (Cloud SQL).
// Conexión idéntica a check-constraint.mjs (probada).
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

const REASONS = [
  'reposicion', 'correccion', 'merma', 'inventario', 'venta', 'import_excel', 'ventas_historicas',
  'sale_pos', 'adjustment', 'damage', 'transfer', 'count_correction',
  'return', 'devolucion', 'agotado_excel', 'sale', 'purchase', 'cancelled',
];
const arr = REASONS.map((r) => `'${r}'`).join(',');

try {
  console.log('Antes:', (await c.query(`SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname='stock_movements_reason_check'`)).rows[0]?.pg_get_constraintdef ?? '(sin constraint)');
  await c.query('BEGIN');
  await c.query('ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS stock_movements_reason_check');
  await c.query(`ALTER TABLE stock_movements ADD CONSTRAINT stock_movements_reason_check CHECK (reason = ANY (ARRAY[${arr}]))`);
  await c.query('COMMIT');
  console.log('Después:', (await c.query(`SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname='stock_movements_reason_check'`)).rows[0].pg_get_constraintdef);
  console.log('OK — constraint ampliado a', REASONS.length, 'reasons.');
} catch (e) {
  await c.query('ROLLBACK').catch(() => {});
  console.error('FALLO, rollback:', e.message);
  process.exitCode = 1;
} finally {
  c.release(); await pool.end(); conn.close();
}
