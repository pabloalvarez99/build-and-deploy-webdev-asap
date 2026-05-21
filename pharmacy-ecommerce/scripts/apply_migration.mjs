// Apply a SQL migration file against Cloud SQL.
// Usage: node scripts/apply_migration.mjs apps/web/prisma/migrations/<file>.sql

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { connectDb } from './rp_catalog_lib.mjs'

const file = process.argv[2]
if (!file) { console.error('Usage: apply_migration.mjs <path>'); process.exit(1) }
const sql = readFileSync(resolve(process.cwd(), file), 'utf-8')

const pool = await connectDb({ max: 2 })
const client = await pool.connect()
try {
  console.log(`[migrate] applying ${file}`)
  await client.query(sql)
  console.log('[migrate] OK')
} catch (e) {
  console.error('[migrate] FAIL:', e.message)
  process.exitCode = 1
} finally {
  client.release()
  await pool.end()
}
