/**
 * fix_broken_images.mjs
 *
 * Fase 1 — Chequeo paralelo de URLs (20 concurrent, ~5 min para 1462 productos)
 * Fase 2 — Búsqueda de reemplazo en DuckDuckGo + update en Cloud SQL
 *
 * Ejecutar desde pharmacy-ecommerce/:
 *   node scripts/fix_broken_images.mjs
 *   node scripts/fix_broken_images.mjs --check-only   (solo fase 1, guarda broken_images_log.json)
 *   node scripts/fix_broken_images.mjs --fix-only     (solo fase 2, asume broken_images_log.json ya existe)
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

// Cloud SQL
const { Connector, IpAddressTypes, AuthTypes } = require('@google-cloud/cloud-sql-connector')
const { GoogleAuth } = require('google-auth-library')
const pg = require('pg')

const PROGRESS_FILE = join(import.meta.dirname || process.cwd(), 'fix_images_progress.json')
const BROKEN_LOG    = join(import.meta.dirname || process.cwd(), 'broken_images_log.json')

const args = process.argv.slice(2)
const CHECK_ONLY = args.includes('--check-only')
const FIX_ONLY   = args.includes('--fix-only')

// ─── Helpers: parse JSON env vars stored with escape sequences in .env.local ──
function parseEnvJson(val) {
  if (!val) throw new Error('GOOGLE_SERVICE_ACCOUNT not set')
  // Direct parse (works in Vercel / production where value is stored as real JSON)
  try { return JSON.parse(val) } catch {}
  // .env.local stores it as a JSON-string-escaped value ("{\n  \"type\":...}")
  // Wrapping in quotes and double-parsing decodes \n → newline, \" → " etc.
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
    max: 5,
  })
  return pool
}

// ─── URL checker ──────────────────────────────────────────────────────────────
async function checkUrl(url, timeoutMs = 6000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const httpsUrl = url.startsWith('http://') ? 'https://' + url.slice(7) : url
    const res = await fetch(httpsUrl, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://tu-farmacia.cl/',   // simulate real browser request from our domain
        'Accept': 'image/*,*/*',
      },
      redirect: 'follow',
    })
    clearTimeout(timer)
    // 403 = hotlink blocked (broken for our domain)
    // 404 = gone
    // 5xx = server error
    return { alive: res.status < 400, status: res.status }
  } catch (e) {
    clearTimeout(timer)
    return { alive: false, status: null }  // timeout / conn error
  }
}

// ─── Parallel URL check ───────────────────────────────────────────────────────
async function checkAllUrls(products, concurrency = 20) {
  const broken = []
  const ok = []
  let done = 0
  const total = products.length
  const start = Date.now()

  // Chunk into batches
  for (let i = 0; i < total; i += concurrency) {
    const batch = products.slice(i, i + concurrency)
    const results = await Promise.all(batch.map(p => checkUrl(p.image_url)))
    for (let j = 0; j < batch.length; j++) {
      const prod = batch[j]
      const { alive, status } = results[j]
      done++
      const elapsed = ((Date.now() - start) / 1000 / 60).toFixed(1)
      const eta = done > 0 ? ((((Date.now() - start) / done) * (total - done)) / 1000 / 60).toFixed(1) : '?'
      const nameShort = (prod.name || '').slice(0, 40).padEnd(40)
      const statusStr = status ? `${status}` : 'ERR'
      process.stdout.write(`\r[${done}/${total}] (${elapsed}m ETA:${eta}m) ${nameShort} ${alive ? 'OK ' : `ROTO(${statusStr})`}   `)
      if (alive) {
        ok.push(prod)
      } else {
        broken.push({ id: prod.id, name: prod.name, laboratory: prod.laboratory, broken_url: prod.image_url, status })
      }
    }
    // Small delay between batches to avoid hammering multiple hosts at once
    await sleep(200)
  }
  console.log()
  return { broken, ok }
}

// ─── DuckDuckGo image search ──────────────────────────────────────────────────
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
      // Step 1: get VQD token
      const tokenRes = await fetch(`https://duckduckgo.com/?q=${encoded}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      })
      const html = await tokenRes.text()
      const match = html.match(/vqd=['"]([^'"]+)['"]/)
      if (!match) continue

      const vqd = match[1]
      await sleep(800)

      // Step 2: image results
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
    } catch (e) {
      await sleep(1000)
    }
  }
  return null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function loadProgress() {
  try { return new Set(JSON.parse(readFileSync(PROGRESS_FILE, 'utf-8'))) } catch { return new Set() }
}
function saveProgress(ids) { writeFileSync(PROGRESS_FILE, JSON.stringify([...ids])) }
function loadBrokenLog() {
  try { return JSON.parse(readFileSync(BROKEN_LOG, 'utf-8')) } catch { return [] }
}
function saveBrokenLog(entries) { writeFileSync(BROKEN_LOG, JSON.stringify(entries, null, 2)) }

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═'.repeat(60))
  console.log('  DETECCIÓN Y ARREGLO DE IMÁGENES ROTAS — Cloud SQL')
  console.log('═'.repeat(60))
  console.log()

  const pool = await connectDb()
  console.log('✓ Conectado a Cloud SQL\n')

  let brokenList

  // ── FASE 1: Chequeo de URLs ──────────────────────────────────────────────
  if (!FIX_ONLY) {
    console.log('FASE 1: Chequeando URLs existentes...')
    const { rows: products } = await pool.query(`
      SELECT id, name, laboratory, image_url
      FROM products
      WHERE image_url IS NOT NULL AND image_url <> ''
      ORDER BY name
    `)
    console.log(`  ${products.length} productos con image_url\n`)

    const { broken, ok } = await checkAllUrls(products, 20)
    console.log(`\n  ✓ Válidas: ${ok.length} | Rotas: ${broken.length}\n`)

    saveBrokenLog(broken)
    console.log(`  → Log guardado: broken_images_log.json\n`)

    brokenList = broken
    if (CHECK_ONLY) {
      console.log('Modo --check-only: terminando aquí.')
      await pool.end()
      return
    }
  } else {
    brokenList = loadBrokenLog()
    console.log(`Modo --fix-only: ${brokenList.length} URLs rotas desde broken_images_log.json\n`)
  }

  // ── FASE 2: Búsqueda y reparación ───────────────────────────────────────
  if (brokenList.length === 0) {
    console.log('Sin imágenes rotas. ¡Todo OK!')
    await pool.end()
    return
  }

  console.log(`FASE 2: Buscando reemplazos para ${brokenList.length} imágenes rotas...`)
  console.log('  (DuckDuckGo, ~2-4s por producto)\n')

  const done = loadProgress()
  const pending = brokenList.filter(p => !done.has(p.id))
  if (done.size > 0) console.log(`  Retomando: ${done.size} ya procesados, ${pending.length} pendientes\n`)

  let fixed = 0, nulled = 0, errors = 0
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
        fixed++
        prod.new_url = newUrl
        prod.action = 'fixed'
        console.log('ARREGLADO ✓')
      } catch (e) {
        errors++
        prod.action = 'db_error'
        console.log('DB ERROR')
      }
    } else {
      try {
        await pool.query('UPDATE products SET image_url = NULL WHERE id = $1', [prod.id])
        nulled++
        prod.action = 'nulled'
        console.log('SIN REEMPLAZO → null')
      } catch (e) {
        errors++
        prod.action = 'db_error'
        console.log('DB ERROR')
      }
    }

    done.add(prod.id)
    if ((i + 1) % 10 === 0) {
      saveProgress(done)
      saveBrokenLog(brokenList)
    }

    await sleep(1500 + Math.random() * 2000)

    if ((i + 1) % 50 === 0) {
      console.log(`\n  --- Progreso: ${fixed} arreglados, ${nulled} nulled, ${errors} errores ---\n`)
    }
  }

  saveProgress(done)
  saveBrokenLog(brokenList)

  const totalTime = ((Date.now() - start) / 1000 / 60).toFixed(1)
  console.log('\n' + '═'.repeat(60))
  console.log('  RESULTADO FINAL')
  console.log('═'.repeat(60))
  console.log(`  Tiempo:                ${totalTime} minutos`)
  console.log(`  Arregladas:            ${fixed}`)
  console.log(`  Sin reemplazo (null):  ${nulled}`)
  console.log(`  Errores DB:            ${errors}`)
  if (nulled > 0) console.log(`\n  → Ejecuta update_images_cloudsql.mjs para los ${nulled} productos sin imagen`)
  console.log('═'.repeat(60))

  await pool.end()
}

main().catch(err => {
  console.error('Error fatal:', err)
  process.exit(1)
})
