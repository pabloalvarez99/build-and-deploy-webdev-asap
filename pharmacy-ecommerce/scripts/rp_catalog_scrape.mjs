// Web scrape enrich para rp_catalog.
// Fuentes: Salcobrand, Cruz Verde, Farmacias Ahumada (search público) + Google Images / DuckDuckGo img.
// Concurrency configurable. Resumable: usa enrich_status para saber qué falta.
// Ejecutar desde pharmacy-ecommerce/:
//   node scripts/rp_catalog_scrape.mjs                 # corre todo lo pending/heuristic
//   node scripts/rp_catalog_scrape.mjs --limit 100     # batch test
//   node scripts/rp_catalog_scrape.mjs --concurrency 6 # ajustar paralelismo

import { connectDb } from './rp_catalog_lib.mjs'

const args = new Map()
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i].replace(/^--/, ''), process.argv[i + 1])
const LIMIT = parseInt(args.get('limit') || '0', 10) || 0
const CONCURRENCY = parseInt(args.get('concurrency') || '6', 10)
const RETRY_FAILED = args.has('retry-failed')

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'

async function fetchText(url, { timeoutMs = 9000 } = {}) {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'es-CL,es;q=0.9' }, signal: ctl.signal, redirect: 'follow' })
    if (!res.ok) return null
    return await res.text()
  } catch { return null } finally { clearTimeout(t) }
}

// ─── Source: Salcobrand search ──────────────────────────────────────────────
async function searchSalcobrand(query) {
  const url = `https://salcobrand.cl/search?q=${encodeURIComponent(query)}`
  const html = await fetchText(url)
  if (!html) return null
  // primer producto: <a class="product-card-link" href="/products/..."> ... <img src="..." alt="...">
  const linkM = html.match(/<a[^>]+class="[^"]*product-card-link[^"]*"[^>]+href="([^"]+)"/)
  const imgM = html.match(/<img[^>]+(?:class="[^"]*product-card-image[^"]*"|alt="[^"]+")[^>]+src="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i)
  const labM = html.match(/<span[^>]+class="[^"]*product-card-brand[^"]*"[^>]*>([^<]+)</)
  if (!imgM && !linkM) return null
  return {
    image_url: imgM?.[1] || null,
    laboratory: labM?.[1]?.trim() || null,
    source: 'salcobrand',
    product_url: linkM ? `https://salcobrand.cl${linkM[1]}` : null,
  }
}

// ─── Source: Cruz Verde search ──────────────────────────────────────────────
async function searchCruzVerde(query) {
  const url = `https://www.cruzverde.cl/search/?q=${encodeURIComponent(query)}`
  const html = await fetchText(url)
  if (!html) return null
  // Cruz Verde usa JSON-LD; intentar
  const ld = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g) || []
  for (const block of ld) {
    const inner = block.replace(/<[^>]+>/g, '')
    try {
      const obj = JSON.parse(inner)
      const items = Array.isArray(obj) ? obj : (obj['@graph'] || [obj])
      for (const it of items) {
        if (it['@type'] === 'Product' && (it.image || it.brand)) {
          const image = Array.isArray(it.image) ? it.image[0] : it.image
          const brand = typeof it.brand === 'string' ? it.brand : it.brand?.name
          return { image_url: image || null, laboratory: brand || null, source: 'cruzverde', product_url: it.url || null }
        }
      }
    } catch {}
  }
  const imgM = html.match(/<img[^>]+src="([^"]+(?:productos|product)[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i)
  return imgM ? { image_url: imgM[1], laboratory: null, source: 'cruzverde', product_url: null } : null
}

// ─── Source: Farmacias Ahumada search ───────────────────────────────────────
async function searchAhumada(query) {
  const url = `https://www.farmaciasahumada.cl/on/demandware.store/Sites-ahumada-cl-Site/default/Search-Show?q=${encodeURIComponent(query)}`
  const html = await fetchText(url)
  if (!html) return null
  const imgM = html.match(/<img[^>]+class="[^"]*tile-image[^"]*"[^>]+src="([^"]+)"/) ||
               html.match(/<img[^>]+src="([^"]+(?:images\/products|dw\/image)[^"]+)"/i)
  const brandM = html.match(/<div[^>]+class="[^"]*product-tile-brand[^"]*"[^>]*>([^<]+)</)
  return (imgM || brandM) ? {
    image_url: imgM?.[1] || null,
    laboratory: brandM?.[1]?.trim() || null,
    source: 'ahumada',
    product_url: null,
  } : null
}

// ─── Image fallback: DuckDuckGo (no key) ────────────────────────────────────
async function ddgImage(query) {
  // DuckDuckGo HTML endpoint requires token; usar vqd handshake.
  const initUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iar=images&iax=images&ia=images`
  const init = await fetchText(initUrl)
  if (!init) return null
  const vqdM = init.match(/vqd=['"]?(\d+-\d+(?:-\d+)?)['"]?/)
  if (!vqdM) return null
  const apiUrl = `https://duckduckgo.com/i.js?l=cl-es&o=json&q=${encodeURIComponent(query)}&vqd=${vqdM[1]}&f=,,,,,`
  const json = await fetchText(apiUrl)
  if (!json) return null
  try {
    const data = JSON.parse(json)
    return data.results?.[0]?.image || null
  } catch { return null }
}

// ─── Enrich single row ──────────────────────────────────────────────────────
async function enrichRow(row) {
  const queries = []
  if (row.barcodes?.length) queries.push(row.barcodes[0])
  queries.push(row.description.slice(0, 60))
  let info = null
  for (const q of queries) {
    info = await searchSalcobrand(q) || await searchCruzVerde(q) || await searchAhumada(q)
    if (info?.image_url) break
  }
  if (!info?.image_url) {
    const img = await ddgImage(`${row.description} farmacia chile`)
    if (img) info = { ...(info || {}), image_url: img, source: (info?.source || 'ddg') }
  }
  if (!info) return null
  return {
    image_url: info.image_url || null,
    laboratory: info.laboratory || null,
    info_json: { source: info.source, product_url: info.product_url || null, queried_at: new Date().toISOString() },
  }
}

// ─── Worker pool ────────────────────────────────────────────────────────────
async function runPool(rows, pool) {
  let idx = 0, done = 0, ok = 0, fail = 0
  const total = rows.length
  const t0 = Date.now()
  async function worker(workerId) {
    while (true) {
      const i = idx++
      if (i >= total) return
      const row = rows[i]
      try {
        const enriched = await enrichRow(row)
        if (enriched && (enriched.image_url || enriched.laboratory)) {
          await pool.query(
            `UPDATE rp_catalog SET
               image_url = COALESCE($2, image_url),
               laboratory = COALESCE($3, laboratory),
               info_json = COALESCE(info_json, '{}'::jsonb) || $4::jsonb,
               enrich_status = 'scraped',
               enrich_attempts = enrich_attempts + 1,
               last_enriched_at = now(),
               updated_at = now()
             WHERE ecosur_id = $1`,
            [row.ecosur_id, enriched.image_url, enriched.laboratory, JSON.stringify(enriched.info_json)],
          )
          ok++
        } else {
          await pool.query(
            `UPDATE rp_catalog SET
               enrich_status = CASE WHEN enrich_attempts >= 2 THEN 'failed' ELSE 'heuristic' END,
               enrich_attempts = enrich_attempts + 1,
               last_enriched_at = now()
             WHERE ecosur_id = $1`,
            [row.ecosur_id],
          )
          fail++
        }
      } catch (e) {
        fail++
        try {
          await pool.query(
            `UPDATE rp_catalog SET enrich_attempts = enrich_attempts + 1, last_enriched_at = now() WHERE ecosur_id = $1`,
            [row.ecosur_id],
          )
        } catch {}
      }
      done++
      if (done % 50 === 0 || done === total) {
        const elapsed = (Date.now() - t0) / 1000
        const rate = done / elapsed
        const eta = ((total - done) / Math.max(rate, 0.01)).toFixed(0)
        console.log(`[scrape] ${done}/${total} ok=${ok} fail=${fail} rate=${rate.toFixed(1)}/s eta=${eta}s`)
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => worker(i)))
  return { ok, fail }
}

async function main() {
  const pool = await connectDb({ max: Math.max(CONCURRENCY + 2, 6) })
  const where = RETRY_FAILED
    ? `enrich_status IN ('pending', 'heuristic', 'failed') AND status = 'ACTV'`
    : `enrich_status IN ('pending', 'heuristic') AND status = 'ACTV' AND (image_url IS NULL OR image_url = '')`
  const sql = `SELECT ecosur_id, description, barcodes FROM rp_catalog WHERE ${where} ORDER BY enrich_attempts ASC, ecosur_id ASC ${LIMIT ? `LIMIT ${LIMIT}` : ''}`
  console.log(`[scrape] querying...`)
  const { rows } = await pool.query(sql)
  console.log(`[scrape] ${rows.length} rows pending; concurrency=${CONCURRENCY}`)
  if (!rows.length) { await pool.end(); return }
  const { ok, fail } = await runPool(rows, pool)
  console.log(`[scrape] DONE — ok=${ok} fail=${fail}`)
  await pool.end()
}

main().catch(e => { console.error(e); process.exit(1) })
