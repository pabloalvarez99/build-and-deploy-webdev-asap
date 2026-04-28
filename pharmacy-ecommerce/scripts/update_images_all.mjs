/**
 * update_images_all.mjs
 *
 * Busca imágenes en DuckDuckGo para TODOS los productos sin image_url.
 * Prioriza: activos primero → inactivos con precio → inactivos sin precio.
 * Usa active_ingredient y laboratory para queries más precisas (farmacia).
 * Resume-able: guarda progreso en update_images_all_progress.json.
 *
 * Ejecutar desde pharmacy-ecommerce/:
 *   node scripts/update_images_all.mjs
 *   node scripts/update_images_all.mjs --dry-run    (muestra conteo sin ejecutar)
 *   node scripts/update_images_all.mjs --active-only (solo activos, equivalente al script anterior)
 *   node scripts/update_images_all.mjs --stats       (muestra estado actual de imágenes)
 */

import { readFileSync, writeFileSync } from 'fs'
import { createRequire } from 'module'
import { join } from 'path'

// ─── Setup ────────────────────────────────────────────────────────────────────
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

const PROGRESS_FILE = join(import.meta.dirname || process.cwd(), 'update_images_all_progress.json')

const args = process.argv.slice(2)
const DRY_RUN     = args.includes('--dry-run')
const ACTIVE_ONLY = args.includes('--active-only')
const STATS_ONLY  = args.includes('--stats')

// ─── Parse GOOGLE_SERVICE_ACCOUNT ────────────────────────────────────────────
function parseEnvJson(val) {
  if (!val) throw new Error('GOOGLE_SERVICE_ACCOUNT not set')
  try { return JSON.parse(val) } catch {}
  try { return JSON.parse(JSON.parse('"' + val + '"')) } catch (e) {
    throw new Error('Cannot parse GOOGLE_SERVICE_ACCOUNT: ' + e.message)
  }
}

// ─── DB connection ────────────────────────────────────────────────────────────
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
  return new pg.Pool({
    ...clientOpts,
    user: env.DB_USER.trim(),
    password: env.DB_PASSWORD.trim(),
    database: env.DB_NAME.trim(),
    max: 3,
  })
}

// ─── Sleep ────────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ─── DuckDuckGo image search ──────────────────────────────────────────────────
// Builds pharmacy-specific query variations using all available product fields.
function buildQueries(name, lab, ingredient) {
  const cleanName = name.split('(')[0].trim().slice(0, 60)
  const cleanLab  = (lab || '').trim().slice(0, 30)
  const cleanIng  = (ingredient || '').split('/')[0].trim().slice(0, 40)

  const q = []

  // Most specific: product + lab
  if (cleanLab) q.push(`${cleanName} ${cleanLab} farmacia`)

  // Product + ingredient (useful when name is a brand, ingredient is generic)
  if (cleanIng) q.push(`${cleanName} ${cleanIng} medicamento`)

  // Just product + generic pharmacy terms
  q.push(`${cleanName} medicamento prospecto`)
  q.push(`${cleanName} comprimidos capsulas`)

  // Ingredient-only fallback (catches generic drugs where brand search fails)
  if (cleanIng && cleanIng.length > 4 && cleanIng !== cleanName) {
    q.push(`${cleanIng} medicamento farmacia`)
  }

  // Bare product name last resort
  q.push(cleanName)

  return [...new Set(q.filter(s => s.trim().length > 3))]
}

let consecutiveRateLimits = 0

async function searchImage(name, lab, ingredient, retries = 2) {
  const queries = buildQueries(name, lab, ingredient)

  for (const query of queries) {
    try {
      const encoded = encodeURIComponent(query)
      const tokenRes = await fetch(`https://duckduckgo.com/?q=${encoded}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36' },
      })
      const html = await tokenRes.text()
      const match = html.match(/vqd=['"]([^'"]+)['"]/)
      if (!match) continue

      const vqd = match[1]
      await sleep(700 + Math.random() * 400)

      const imgRes = await fetch(
        `https://duckduckgo.com/i.js?l=cl-es&o=json&q=${encoded}&vqd=${vqd}&f=,,,,,&p=1`,
        { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36' } }
      )

      if (!imgRes.ok) {
        if (imgRes.status === 429 || imgRes.status === 202) {
          consecutiveRateLimits++
          const waitMs = Math.min(30000 * consecutiveRateLimits, 120000)
          console.log(`\n  [RATE LIMIT] Esperando ${waitMs / 1000}s...`)
          await sleep(waitMs)
          if (retries > 0) return searchImage(name, lab, ingredient, retries - 1)
          return null
        }
        continue
      }

      consecutiveRateLimits = 0
      const data = await imgRes.json()

      if (data.results?.length) {
        for (const r of data.results.slice(0, 8)) {
          const img = r.image
          if (
            img &&
            img.startsWith('http') &&
            !img.includes('x-raw-image') &&
            !img.endsWith('.gif') &&
            !img.endsWith('.svg') &&
            img.length < 600
          ) {
            return img.startsWith('http://') ? 'https://' + img.slice(7) : img
          }
        }
      }
    } catch {
      await sleep(1000)
    }
  }

  return null
}

// ─── Progress helpers ─────────────────────────────────────────────────────────
function loadProgress() {
  try { return new Set(JSON.parse(readFileSync(PROGRESS_FILE, 'utf-8'))) } catch { return new Set() }
}
function saveProgress(ids) { writeFileSync(PROGRESS_FILE, JSON.stringify([...ids])) }

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═'.repeat(65))
  console.log('  ASIGNACIÓN MASIVA DE IMÁGENES — Todos los productos')
  console.log('═'.repeat(65))
  console.log()

  const pool = await connectDb()
  console.log('✓ Conectado a Cloud SQL\n')

  // Stats mode
  if (STATS_ONLY) {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE image_url IS NOT NULL AND image_url <> '') AS with_image,
        COUNT(*) FILTER (WHERE image_url IS NULL OR image_url = '')       AS without_image,
        COUNT(*) FILTER (WHERE active = true)                             AS active,
        COUNT(*) FILTER (WHERE active = true AND (image_url IS NULL OR image_url = '')) AS active_no_img,
        COUNT(*) AS total
      FROM products
    `)
    const s = rows[0]
    console.log(`  Total productos:          ${s.total}`)
    console.log(`  Con imagen:               ${s.with_image}`)
    console.log(`  Sin imagen:               ${s.without_image}`)
    console.log(`  Activos:                  ${s.active}`)
    console.log(`  Activos sin imagen:       ${s.active_no_img}`)
    const etaMin = Math.round(Number(s.without_image) * 3.5 / 60)
    console.log(`\n  ETA estimado (full):      ~${etaMin} min (~${(etaMin/60).toFixed(1)}h)`)
    await pool.end()
    return
  }

  // Query: all products without image, active first
  const whereActive = ACTIVE_ONLY ? 'AND active = true' : ''
  const { rows: products } = await pool.query(`
    SELECT id, name, laboratory, active_ingredient, active,
           CASE WHEN active = true THEN 0
                WHEN price IS NOT NULL AND price > 0 THEN 1
                ELSE 2
           END AS priority
    FROM products
    WHERE (image_url IS NULL OR image_url = '') ${whereActive}
    ORDER BY priority ASC, name ASC
  `)

  const activeCount    = products.filter(p => p.active).length
  const inactiveCount  = products.length - activeCount

  console.log(`Productos sin imagen: ${products.length} total`)
  console.log(`  Activos:   ${activeCount}`)
  console.log(`  Inactivos: ${inactiveCount}`)
  const etaMin = Math.round(products.length * 3.5 / 60)
  console.log(`  ETA:       ~${etaMin} min (~${(etaMin/60).toFixed(1)}h)\n`)

  if (products.length === 0) {
    console.log('¡Todos los productos tienen imagen!')
    await pool.end()
    return
  }

  if (DRY_RUN) {
    console.log('Modo --dry-run. Primeros 20 a procesar:')
    products.slice(0, 20).forEach((p, i) =>
      console.log(`  ${i+1}. [${p.active ? 'ACTIVO' : 'inact. '}] ${p.name}`)
    )
    if (products.length > 20) console.log(`  ... y ${products.length - 20} más`)
    await pool.end()
    return
  }

  const done    = loadProgress()
  const pending = products.filter(p => !done.has(p.id))
  if (done.size > 0) {
    console.log(`Retomando: ${done.size} ya procesados, ${pending.length} pendientes\n`)
  }

  let updated = 0, failed = 0, dbErrors = 0
  const start = Date.now()

  for (let i = 0; i < pending.length; i++) {
    const prod = pending[i]
    const elapsed = ((Date.now() - start) / 1000 / 60).toFixed(1)
    const eta     = i > 0 ? ((((Date.now() - start) / i) * (pending.length - i)) / 1000 / 60).toFixed(0) : '?'
    const tag     = prod.active ? '●' : '○'
    const label   = `${prod.name}`.slice(0, 42).padEnd(42)

    process.stdout.write(`[${String(i+1).padStart(5)}/${pending.length}] (${elapsed}m ETA:${eta}m) ${tag} ${label} `)

    const url = await searchImage(prod.name, prod.laboratory, prod.active_ingredient)

    if (url) {
      try {
        await pool.query('UPDATE products SET image_url = $1 WHERE id = $2', [url, prod.id])
        updated++
        console.log('✓')
      } catch {
        dbErrors++
        console.log('DB ERROR')
      }
    } else {
      failed++
      console.log('-')
    }

    done.add(prod.id)

    // Save progress every 10 products
    if ((i + 1) % 10 === 0) saveProgress(done)

    // Progress summary every 100 products
    if ((i + 1) % 100 === 0) {
      const pct = ((updated / (i + 1)) * 100).toFixed(0)
      console.log(`\n  ─── ${updated} asignadas (${pct}%), ${failed} sin resultado, ${dbErrors} DB errors ───\n`)
    }

    // Stagger requests: 1.5–3.5s between each to avoid rate limiting
    await sleep(1500 + Math.random() * 2000)
  }

  saveProgress(done)

  const totalMin = ((Date.now() - start) / 1000 / 60).toFixed(1)
  console.log('\n' + '═'.repeat(65))
  console.log('  RESULTADO FINAL')
  console.log('═'.repeat(65))
  console.log(`  Tiempo:              ${totalMin} minutos`)
  console.log(`  Imágenes asignadas:  ${updated}`)
  console.log(`  Sin resultado:       ${failed}`)
  console.log(`  Errores DB:          ${dbErrors}`)
  console.log(`  Cobertura:           ${pending.length > 0 ? ((updated / pending.length) * 100).toFixed(1) : 0}%`)
  console.log('═'.repeat(65))

  await pool.end()
}

main().catch(err => {
  console.error('\nError fatal:', err.message)
  process.exit(1)
})
