#!/usr/bin/env node
// Dump unique active_ingredient values + product count to stdout.
import { Connector, IpAddressTypes, AuthTypes } from '@google-cloud/cloud-sql-connector';
import { GoogleAuth } from 'google-auth-library';
import pg from 'pg';
import { config } from 'dotenv';

config({ path: '.env.local' });

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
  const r = await client.query(`
    SELECT active_ingredient, COUNT(*) AS n
    FROM products
    WHERE active = true
      AND active_ingredient IS NOT NULL
      AND TRIM(active_ingredient) <> ''
    GROUP BY active_ingredient
    ORDER BY n DESC, active_ingredient
  `);
  console.log(JSON.stringify(r.rows, null, 2));
  console.error(`[total] ${r.rows.length} unique active_ingredients`);
} finally {
  client.release();
  await pool.end();
  connector.close();
}
