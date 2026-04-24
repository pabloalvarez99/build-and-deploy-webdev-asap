/**
 * update_images_cloudsql.mjs
 *
 * Busca imágenes en DuckDuckGo para productos SIN image_url (null o vacío).
 * Conecta directamente a Cloud SQL via @google-cloud/cloud-sql-connector.
 *
 * Ejecutar desde pharmacy-ecommerce/:
 *   node scripts/update_images_cloudsql.mjs
 *   node scripts/update_images_cloudsql.mjs --dry-run   (solo muestra cuántos sin imagen)
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { createRequire } from 'module'
import { join } from 'path'

// ─── Setup ────────────────────────────────────────────────────────────────────
const webDir = new URL('../apps/web/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
const require = createRequire(join(webDir, 'package.json'))

// Load .env.local
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

const PROGRESS_FILE = join(import.meta.dirname || process.cwd(), 'update_images_progress.json')
const DRY_RUN = process.argv.includes('--dry-run')

// ─── Parse JSON env vars stored with escape sequences in .env.local ──────────
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
  const pool = new pg.Pool({
    ...clientOpts,
    user: env.DB_USER.trim(),
    password: env.DB_PASSWORD.trim(),
    database: env.DB_NAME.trim(),
    max: 3,
  })
  return pool
}

// ─── DuckDuckGo image search ──────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function searchImage(name, lab = '', retries = 2) {
  const cleanName = name.split('(')[0].trim()
  const queries = [
    `${cleanName} ${lab} farmacia`.trim(),
    `${cleanName} medicamento`,
    `${cleanName} comprimido pastilla`,
    cleanName.slice(0, 40),
  ]
  const unique = [...new Set(queries.filter(q => q.trim()))]

  for (const query of unique) {
    try {
      const encoded = encodeURIComponent(query)
      const tokenRes = await fetch(`https://duckduckgo.com/?q=${encoded}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      })
      const html = await tokenRes.text()
      const match = html.match(/vqd=['"]([^'"]+)['"]/)
      if (!match) continue

      const vqd = match[1]
      await sleep(800)

      const imgRes = await fetch(
        `https://duckduckgo.com/i.js?l=cl-es&o=json&q=${encoded}&vqd=${vqd}&f=,,,,,&p=1`,
        { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }
      )
      if (!imgRes.ok) {
        if (imgRes.status === 429 || imgRes.status === 202) {
          if (retries > 0) {
            console.log('\n  [RATE LIMIT] Esperando 30s...')
            await sleep(30000)
            return searchImage(name, lab, retries - 1)
          }
          return null
        }
        continue
      }

      const data = await imgRes.json()
      if (data.results?.length) {
        for (const r of data.results.slice(0, 5)) {
          const img = r.image
          if (img && img.startsWith('http') && !img.includes('x-raw-image') && img.length < 500 && !img.endsWith('.gif')) {
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
  console.log('═'.repeat(60))
  console.log('  ASIGNACIÓN DE IMÁGENES — Productos sin image_url')
  console.log('═'.repeat(60))
  console.log()

  const pool = await connectDb()
  console.log('✓ Conectado a Cloud SQL\n')

  const { rows: products } = await pool.query(`
    SELECT id, name, laboratory
    FROM products
    WHERE (image_url IS NULL OR image_url = '') AND active = true
    ORDER BY name
  `)

  console.log(`Productos sin imagen: ${products.length}\n`)

  if (products.length === 0) {
    console.log('¡Todos los productos activos tienen imagen!')
    await pool.end()
    return
  }

  if (DRY_RUN) {
    console.log('Modo --dry-run: listando primeros 20...')
    products.slice(0, 20).forEach((p, i) => console.log(`  ${i+1}. ${p.name}`))
    if (products.length > 20) console.log(`  ... y ${products.length - 20} más`)
    await pool.end()
    return
  }

  const done = loadProgress()
  const pending = products.filter(p => !done.has(p.id))
  if (done.size > 0) console.log(`Retomando: ${done.size} ya procesados, ${pending.length} pendientes\n`)

  let updated = 0, failed = 0, errors = 0
  const start = Date.now()

  for (let i = 0; i < pending.length; i++) {
    const prod = pending[i]
    const elapsed = ((Date.now() - start) / 1000 / 60).toFixed(1)
    const eta = i > 0 ? ((((Date.now() - start) / i) * (pending.length - i)) / 1000 / 60).toFixed(1) : '?'
    const nameShort = prod.name.slice(0, 40).padEnd(40)
    process.stdout.write(`[${i + 1}/${pending.length}] (${elapsed}m ETA:${eta}m) ${nameShort} `)

    const newUrl = await searchImage(prod.name, prod.laboratory || '')

    if (newUrl) {
      try {
        await pool.query('UPDATE products SET image_url = $1 WHERE id = $2', [newUrl, prod.id])
        updated++
        console.log('OK ✓')
      } catch {
        errors++
        console.log('DB ERROR')
      }
    } else {
      failed++
      console.log('-')
    }

    done.add(prod.id)
    if ((i + 1) % 10 === 0) saveProgress(done)

    await sleep(1500 + Math.random() * 2000)

    if ((i + 1) % 50 === 0) {
      const pct = ((updated / (i + 1)) * 100).toFixed(0)
      console.log(`\n  --- Progreso: ${updated} asignadas (${pct}%), ${failed} sin resultado, ${errors} errores ---\n`)
    }
  }

  saveProgress(done)
  const totalTime = ((Date.now() - start) / 1000 / 60).toFixed(1)

  console.log('\n' + '═'.repeat(60))
  console.log('  RESULTADO FINAL')
  console.log('═'.repeat(60))
  console.log(`  Tiempo:              ${totalTime} minutos`)
  console.log(`  Imágenes asignadas:  ${updated}`)
  console.log(`  Sin resultado:       ${failed}`)
  console.log(`  Errores DB:          ${errors}`)
  console.log(`  Cobertura:           ${((updated / pending.length) * 100).toFixed(1)}%`)
  console.log('═'.repeat(60))

  await pool.end()
}

main().catch(err => {
  console.error('Error fatal:', err)
  process.exit(1)
})
