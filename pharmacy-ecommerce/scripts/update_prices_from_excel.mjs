/**
 * update_prices_from_excel.mjs
 *
 * Lee 2026-04-13_LISTA_DE_PRECIOS.xlsx y actualiza el precio de los productos
 * activos en Cloud SQL haciendo match por external_id = columna ID del Excel.
 *
 * Ejecutar desde pharmacy-ecommerce/:
 *   node scripts/update_prices_from_excel.mjs
 *   node scripts/update_prices_from_excel.mjs --dry-run
 */

import { readFileSync } from 'fs'
import { createRequire } from 'module'
import { join } from 'path'

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
const XLSX = require('xlsx')

const DRY_RUN = process.argv.includes('--dry-run')

// ─── Leer Excel ───────────────────────────────────────────────────────────────
const EXCEL_PATH = join(
  new URL('../..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'),
  '2026-04-13_LISTA_DE_PRECIOS.xlsx'
)

const wb = XLSX.readFile(EXCEL_PATH)
const sheet = wb.Sheets[wb.SheetNames[0]]
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })

// rows[0] = headers, rows[1..] = data
const headers = rows[0]
const idCol = headers.indexOf('ID')
const precioCol = headers.indexOf('PRECIO')
const nombreCol = headers.indexOf('PRODUCTO')

if (idCol === -1 || precioCol === -1) {
  console.error('No se encontraron columnas ID o PRECIO en el Excel')
  process.exit(1)
}

// Construir mapa external_id → precio
const priceMap = new Map()
for (let i = 1; i < rows.length; i++) {
  const row = rows[i]
  const id = row[idCol]
  const precio = row[precioCol]
  if (id != null && precio != null && !isNaN(Number(precio))) {
    priceMap.set(String(id), Math.round(Number(precio)))
  }
}

console.log(`Excel: ${priceMap.size} productos con precio (de ${rows.length - 1} filas)`)

// ─── DB ───────────────────────────────────────────────────────────────────────
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

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const { pool, connector } = await connectDb()
  const client = await pool.connect()

  try {
    // Traer todos los productos activos con external_id
    const { rows: products } = await client.query(
      `SELECT id, external_id, name, price FROM products WHERE active = true AND external_id IS NOT NULL`
    )
    console.log(`DB: ${products.length} productos activos con external_id`)

    let updated = 0
    let skipped = 0
    let notFound = 0
    let samePrice = 0

    for (const product of products) {
      const newPrice = priceMap.get(product.external_id)
      if (newPrice == null) {
        notFound++
        continue
      }
      const oldPrice = Math.round(Number(product.price))
      if (oldPrice === newPrice) {
        samePrice++
        continue
      }

      if (DRY_RUN) {
        console.log(`[DRY] ${product.external_id} | ${product.name.slice(0,40).padEnd(40)} | ${oldPrice} → ${newPrice}`)
      } else {
        await client.query(
          `UPDATE products SET price = $1 WHERE id = $2`,
          [newPrice, product.id]
        )
      }
      updated++
    }

    console.log(`\n─── Resultado ───`)
    console.log(`Actualizados:    ${updated}`)
    console.log(`Mismo precio:    ${samePrice}`)
    console.log(`Sin match Excel: ${notFound}`)
    if (DRY_RUN) console.log('\n[DRY RUN] No se aplicaron cambios.')

  } finally {
    client.release()
    await pool.end()
    connector.close()
  }
}

main().catch(err => { console.error(err); process.exit(1) })
