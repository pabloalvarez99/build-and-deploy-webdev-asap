#!/usr/bin/env node
// Run SQL migration against prod Cloud SQL via cloud-sql-connector.
// Usage: node scripts/run-migration.mjs <path-to-sql>

import { Connector, IpAddressTypes, AuthTypes } from '@google-cloud/cloud-sql-connector';
import { GoogleAuth } from 'google-auth-library';
import pg from 'pg';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config({ path: '.env.prod-temp' });

const sqlFile = process.argv[2];
if (!sqlFile) { console.error('Usage: node run-migration.mjs <sql-file>'); process.exit(1); }

const sql = readFileSync(sqlFile, 'utf8');
console.log(`[migration] file=${sqlFile} (${sql.length} bytes)`);

// dotenv loads multi-line values as literal newlines; must escape before JSON.parse
const rawSA = process.env.GOOGLE_SERVICE_ACCOUNT.trim().replace(/\n/g, '\\n').replace(/\r/g, '');
const credentials = JSON.parse(rawSA);
credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
const auth = new GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
const connector = new Connector({ auth });
const opts = await connector.getOptions({
  instanceConnectionName: process.env.CLOUD_SQL_INSTANCE.trim(),
  ipType: IpAddressTypes.PUBLIC,
  authType: AuthTypes.PASSWORD,
});

const pool = new pg.Pool({
  ...opts,
  user: process.env.DB_USER.trim(),
  password: process.env.DB_PASSWORD.trim(),
  database: process.env.DB_NAME.trim(),
  max: 1,
});

const client = await pool.connect();
try {
  console.log('[migration] connected, executing...');
  await client.query('BEGIN');
  await client.query(sql);
  await client.query('COMMIT');
  console.log('[migration] OK ✅');
  const r = await client.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'push_subscriptions'");
  console.log('[migration] verify:', r.rows);
} catch (e) {
  await client.query('ROLLBACK');
  console.error('[migration] FAILED:', e.message);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
  connector.close();
}
