/**
 * import_backup_productos.mjs
 *
 * Importa BACKUP_PRODUCTOS.txt (34,118 productos del ERP Golan/EcoSur) a Cloud SQL.
 *
 * Lógica:
 * - Productos existentes (por external_id): actualiza name, y price si backup tiene precio
 * - Productos nuevos: inserta (active=true si tiene precio, active=false si no)
 * - barcode_catalog: inserta TODOS los barcodes (para lookup POS sin necesitar producto en DB)
 * - product_barcodes: inserta barcodes vinculados al product UUID
 *
 * Ejecutar desde pharmacy-ecommerce/:
 *   node scripts/import_backup_productos.mjs
 *   node scripts/import_backup_productos.mjs --dry-run
 */

import { readFileSync } from 'fs'
import { createRequire } from 'module'
import { join } from 'path'

// ─── Setup ─────────────────────────────────────────────────────────────────────
const webDir = new URL('../apps/web/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
const require = createRequire(join(webDir, 'package.json'))

const envRaw = readFileSync(join(webDir, '.env.local'), 'utf-8')
const env = Object.fromEntries(
  envRaw.split('\n')
    .filter(l => l.trim() && !l.startsWith('#') && l.includes('='))
    .map(l => {
      const i = l.indexOf('=')
      const key = l.slice(0, i).trim()
      let val = l.slice(i + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
        val = val.slice(1, -1)
      return [key, val]
    })
)

const { Connector, IpAddressTypes, AuthTypes } = require('@google-cloud/cloud-sql-connector')
const { GoogleAuth } = require('google-auth-library')
const pg = require('pg')

const DRY_RUN = process.argv.includes('--dry-run')

const BACKUP_PATH = join(
  new URL('../..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'),
  'BACKUP_PRODUCTOS.txt'
)

// ─── DB connection ─────────────────────────────────────────────────────────────
function parseEnvJson(val) {
  if (!val) throw new Error('GOOGLE_SERVICE_ACCOUNT not set')
  try { return JSON.parse(val) } catch {}
  try { return JSON.parse(JSON.parse('"' + val + '"')) } catch (e) {
    throw new Error('Cannot parse GOOGLE_SERVICE_ACCOUNT: ' + e.message)
  }
}

async function connectDb() {
  const credentials = parseEnvJson(env.GOOGLE_SERVICE_ACCOUNT)
  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  })
  const connector = new Connector({ auth })
  const clientOpts = await connector.getOptions({
    instanceConnectionName: env.CLOUD_SQL_INSTANCE.trim(),
    ipType: IpAddressTypes.PUBLIC,
    authType: AuthTypes.PASSWORD,
  })
  const pool = new pg.Pool({
    ...clientOpts,
    user: env.DB_USER.trim(),
    password: env.DB_PASSWORD.trim(),
    database: env.DB_NAME.trim(),
    max: 5,
  })
  return { pool, connector }
}

// ─── Parsing ───────────────────────────────────────────────────────────────────
function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // remove accents
    .replace(/[^a-z0-9]/g, '-')         // non-alphanumeric → dash
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 200)
}

function parsePrice(str) {
  if (!str || str.trim() === '-') return null
  const n = parseInt(str.replace(/[$,.]/g, ''), 10)
  return isNaN(n) ? null : n
}

function parseLine(line) {
  const trimmed = line.trimEnd()
  // Anchor on " ACTV " to split before/barcodes
  const actvMatch = trimmed.match(/^(.+?)\s+ACTV\s+(.+?)\s*$/)
  if (!actvMatch) return null

  const before = actvMatch[1]
  const barcodeRaw = actvMatch[2].trim()

  // Split on 2+ spaces → [id, ...name..., price]
  const parts = before.split(/\s{2,}/).map(s => s.trim()).filter(Boolean)
  if (parts.length < 3) return null

  const externalId = parts[0]
  const priceStr = parts[parts.length - 1]
  // Name is everything between id and price
  const name = parts.slice(1, -1).join(' ').trim()

  if (!/^\d+$/.test(externalId)) return null
  if (!name) return null

  const price = parsePrice(priceStr)
  const barcodes = barcodeRaw.split('|').map(b => b.trim()).filter(Boolean)

  return {
    externalId,
    name: name.substring(0, 255),
    price,          // null = no PVP in ERP
    barcodes,
  }
}

// ─── Batch helpers ─────────────────────────────────────────────────────────────
function* chunks(arr, size) {
  for (let i = 0; i < arr.length; i += size) yield arr.slice(i, i + size)
}

function progress(label, done, total) {
  const pct = ((done / total) * 100).toFixed(1)
  process.stdout.write(`\r  ${label}: ${done.toLocaleString()}/${total.toLocaleString()} (${pct}%)  `)
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== Import Backup Productos ===')
  console.log(`Backup: ${BACKUP_PATH}`)
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log()

  // 1. Parse file
  console.log('1. Parsing backup file...')
  const content = readFileSync(BACKUP_PATH, 'utf-8')
  const lines = content.split('\n')

  const allParsed = []
  for (const line of lines) {
    const p = parseLine(line)
    if (p) allParsed.push(p)
  }

  // Deduplicate by external_id (ERP IDs should be unique, but be safe)
  const byExternalId = new Map()
  for (const p of allParsed) byExternalId.set(p.externalId, p)
  const products = [...byExternalId.values()]

  const withPrice = products.filter(p => p.price !== null)
  const withoutPrice = products.filter(p => p.price === null)
  const totalBarcodes = products.reduce((sum, p) => sum + p.barcodes.length, 0)

  console.log(`   Parsed lines:    ${allParsed.length.toLocaleString()}`)
  console.log(`   Unique products: ${products.length.toLocaleString()}`)
  console.log(`   With price:      ${withPrice.length.toLocaleString()}`)
  console.log(`   Without price:   ${withoutPrice.length.toLocaleString()}`)
  console.log(`   Total barcodes:  ${totalBarcodes.toLocaleString()}`)
  console.log()

  if (DRY_RUN) {
    console.log('DRY RUN - no changes written. Remove --dry-run to execute.')
    // Show sample
    console.log('\nSample (first 5):')
    for (const p of products.slice(0, 5)) {
      console.log(`  [${p.externalId}] ${p.name} | price=${p.price ?? 'N/A'} | barcodes=${p.barcodes.join(',')}`)
    }
    return
  }

  // 2. Connect
  console.log('2. Connecting to Cloud SQL...')
  const { pool, connector } = await connectDb()
  console.log('   Connected.\n')

  // 3. Get existing products by external_id
  console.log('3. Fetching existing products...')
  const existingRes = await pool.query(
    `SELECT id::text, external_id, price FROM products WHERE external_id IS NOT NULL`
  )
  const existingMap = new Map(existingRes.rows.map(r => [r.external_id, { id: r.id, price: r.price }]))
  console.log(`   Existing: ${existingMap.size.toLocaleString()}\n`)

  const toUpdate = products.filter(p => existingMap.has(p.externalId))
  const toInsert = products.filter(p => !existingMap.has(p.externalId))

  console.log(`   To update: ${toUpdate.length.toLocaleString()}`)
  console.log(`   To insert: ${toInsert.length.toLocaleString()}\n`)

  // 4. Update existing products
  if (toUpdate.length > 0) {
    console.log('4. Updating existing products (name + price if available)...')
    let updatedCount = 0
    for (const batch of chunks(toUpdate, 200)) {
      // Use VALUES list for batch update
      const vals = []
      const params = []
      let idx = 1
      for (const p of batch) {
        vals.push(`($${idx}::varchar, $${idx+1}::varchar, $${idx+2}::decimal)`)
        params.push(p.externalId, p.name, p.price ?? 0)
        idx += 3
      }
      await pool.query(
        `UPDATE products SET
           name = v.name,
           price = CASE WHEN v.price > 0 THEN v.price ELSE products.price END,
           updated_at = now()
         FROM (VALUES ${vals.join(',')}) AS v(external_id, name, price)
         WHERE products.external_id = v.external_id`,
        params
      )
      updatedCount += batch.length
      progress('Updated', updatedCount, toUpdate.length)
    }
    console.log(`\n   Done.\n`)
  }

  // 5. Insert new products (batch)
  if (toInsert.length > 0) {
    console.log('5. Inserting new products...')
    let insertedCount = 0
    let skippedSlug = 0

    for (const batch of chunks(toInsert, 100)) {
      const vals = []
      const params = []
      let idx = 1
      for (const p of batch) {
        const slug = (slugify(p.name) || 'producto') + '-' + p.externalId
        const price = p.price ?? 0
        const active = price > 0
        vals.push(`(gen_random_uuid(), $${idx}, $${idx+1}, $${idx+2}::decimal, $${idx+3}, $${idx+4}::boolean, 0, now(), now())`)
        params.push(p.name, slug, price, p.externalId, active)
        idx += 5
      }
      try {
        const result = await pool.query(
          `INSERT INTO products (id, name, slug, price, external_id, active, stock, created_at, updated_at)
           VALUES ${vals.join(',')}
           ON CONFLICT (slug) DO UPDATE
             SET external_id = CASE WHEN products.external_id IS NULL THEN EXCLUDED.external_id ELSE products.external_id END`,
          params
        )
      } catch (err) {
        // If batch fails, try one by one to skip bad rows
        for (const p of batch) {
          const slug = (slugify(p.name) || 'producto') + '-' + p.externalId
          const price = p.price ?? 0
          try {
            await pool.query(
              `INSERT INTO products (id, name, slug, price, external_id, active, stock, created_at, updated_at)
               VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 0, now(), now())
               ON CONFLICT (slug) DO UPDATE
                 SET external_id = CASE WHEN products.external_id IS NULL THEN EXCLUDED.external_id ELSE products.external_id END`,
              [p.name, slug, price, p.externalId, price > 0]
            )
          } catch {
            skippedSlug++
          }
        }
      }
      insertedCount += batch.length
      progress('Inserted', insertedCount, toInsert.length)
    }
    console.log(`\n   Done. Skipped (slug conflict): ${skippedSlug}\n`)
  }

  // 6. Load product UUID map (existing + newly inserted)
  console.log('6. Loading product UUID map...')
  const allProductsRes = await pool.query(
    `SELECT id::text, external_id FROM products WHERE external_id IS NOT NULL`
  )
  const productIdMap = new Map(allProductsRes.rows.map(r => [r.external_id, r.id]))
  console.log(`   Total products with external_id: ${productIdMap.size.toLocaleString()}\n`)

  // 7. Collect all barcode entries
  const barcodeCatalogEntries = []  // { externalId, barcode } — no FK needed
  const productBarcodeEntries = []  // { productId, barcode } — FK to products

  for (const p of products) {
    for (const barcode of p.barcodes) {
      barcodeCatalogEntries.push({ externalId: p.externalId, barcode })
      const productId = productIdMap.get(p.externalId)
      if (productId) {
        productBarcodeEntries.push({ productId, barcode })
      }
    }
  }

  console.log(`   barcode_catalog entries: ${barcodeCatalogEntries.length.toLocaleString()}`)
  console.log(`   product_barcodes entries: ${productBarcodeEntries.length.toLocaleString()}\n`)

  // 8. Insert barcode_catalog (all ERP barcodes, for POS lookup)
  console.log('7. Populating barcode_catalog...')
  let bcCount = 0
  for (const batch of chunks(barcodeCatalogEntries, 500)) {
    const vals = []
    const params = []
    let idx = 1
    for (const e of batch) {
      vals.push(`($${idx}, $${idx+1})`)
      params.push(e.externalId, e.barcode)
      idx += 2
    }
    await pool.query(
      `INSERT INTO barcode_catalog (external_id, barcode) VALUES ${vals.join(',')}
       ON CONFLICT (barcode) DO NOTHING`,
      params
    )
    bcCount += batch.length
    progress('barcode_catalog', bcCount, barcodeCatalogEntries.length)
  }
  console.log(`\n   Done.\n`)

  // 9. Insert product_barcodes (linked barcodes)
  console.log('8. Populating product_barcodes...')
  let pbCount = 0
  for (const batch of chunks(productBarcodeEntries, 500)) {
    const vals = []
    const params = []
    let idx = 1
    for (const e of batch) {
      vals.push(`(gen_random_uuid(), $${idx}, $${idx+1}, now())`)
      params.push(e.productId, e.barcode)
      idx += 2
    }
    await pool.query(
      `INSERT INTO product_barcodes (id, product_id, barcode, created_at) VALUES ${vals.join(',')}
       ON CONFLICT (barcode) DO NOTHING`,
      params
    )
    pbCount += batch.length
    progress('product_barcodes', pbCount, productBarcodeEntries.length)
  }
  console.log(`\n   Done.\n`)

  // 10. Summary
  const finalCount = await pool.query('SELECT COUNT(*) FROM products')
  const finalBcCatalog = await pool.query('SELECT COUNT(*) FROM barcode_catalog')
  const finalPb = await pool.query('SELECT COUNT(*) FROM product_barcodes')

  console.log('=== RESUMEN FINAL ===')
  console.log(`  products total:      ${Number(finalCount.rows[0].count).toLocaleString()}`)
  console.log(`  barcode_catalog:     ${Number(finalBcCatalog.rows[0].count).toLocaleString()}`)
  console.log(`  product_barcodes:    ${Number(finalPb.rows[0].count).toLocaleString()}`)
  console.log()
  console.log('Productos activos (con precio):')
  const activeCount = await pool.query('SELECT COUNT(*) FROM products WHERE active=true AND price > 0')
  const inactiveCount = await pool.query('SELECT COUNT(*) FROM products WHERE active=false OR price = 0')
  console.log(`  Activos:   ${Number(activeCount.rows[0].count).toLocaleString()}`)
  console.log(`  Inactivos: ${Number(inactiveCount.rows[0].count).toLocaleString()}`)

  await pool.end()
  connector.close()
  console.log('\nImport completado.')
}

main().catch(err => {
  console.error('\nERROR:', err.message)
  process.exit(1)
})
