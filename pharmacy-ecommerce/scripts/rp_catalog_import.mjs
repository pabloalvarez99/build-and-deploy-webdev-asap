// Parse BACKUP_PRODUCTOS.txt (fixed-width dump del POS dbecosur) y carga rp_catalog.
// Re-ejecutable: ON CONFLICT (ecosur_id) DO UPDATE en columnas base.
// Run from pharmacy-ecommerce/: node scripts/rp_catalog_import.mjs

import { readFileSync } from 'fs'
import { join, resolve } from 'path'
import { connectDb, inferForm, inferType, inferDose, inferPresentation, inferLaboratory } from './rp_catalog_lib.mjs'

const SRC = resolve(process.cwd(), '..', 'BACKUP_PRODUCTOS.txt')

function parsePriceClp(raw) {
  if (!raw || raw === '-') return null
  const digits = raw.replace(/[^0-9]/g, '')
  return digits ? parseInt(digits, 10) : null
}

function parseLine(line) {
  // Fixed widths (header positions): ID 1-9, DESC 10-77, PVP 78-90, EST 91-97, BARCODES 98-
  if (line.length < 91) return null
  const id = line.slice(0, 9).trim()
  const desc = line.slice(9, 77).trim().replace(/\s+/g, ' ')
  const price = line.slice(77, 90).trim()
  const status = line.slice(90, 97).trim()
  const barcodes = line.slice(97).trim()
  if (!id || !desc) return null
  return {
    ecosur_id: id,
    description: desc,
    suggested_price: parsePriceClp(price),
    status: status || 'ACTV',
    barcodes: barcodes ? barcodes.split('|').map(b => b.trim()).filter(Boolean) : [],
  }
}

async function main() {
  console.log(`[import] reading ${SRC}`)
  const raw = readFileSync(SRC, 'utf-8')
  const lines = raw.split(/\r?\n/)
  const rows = []
  let skipped = 0
  for (const line of lines) {
    if (!line.trim()) continue
    if (line.startsWith('RESPALDO') || line.startsWith('Servidor') || line.startsWith('==') ||
        line.startsWith('ID ') || line.startsWith('--')) continue
    const parsed = parseLine(line)
    if (!parsed) { skipped++; continue }
    rows.push(parsed)
  }
  console.log(`[import] parsed ${rows.length} rows (${skipped} skipped)`)

  // Heurística inline: forma, tipo, dose, presentation, laboratorio
  for (const r of rows) {
    r.form = inferForm(r.description)
    r.product_type = inferType(r.description)
    r.dose = inferDose(r.description)
    r.presentation = inferPresentation(r.description)
    r.laboratory = inferLaboratory(r.description)
    r.enrich_status = 'heuristic'
  }

  const pool = await connectDb({ max: 4 })
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const BATCH = 500
    let done = 0
    for (let i = 0; i < rows.length; i += BATCH) {
      const slice = rows.slice(i, i + BATCH)
      // multi-row INSERT
      const vals = []
      const params = []
      let p = 1
      for (const r of slice) {
        vals.push(`($${p++}, $${p++}, $${p++}, $${p++}, $${p++}::text[], $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++})`)
        params.push(
          r.ecosur_id, r.description, r.suggested_price, r.status, r.barcodes,
          r.laboratory, r.product_type, r.presentation, r.dose, r.form, r.enrich_status,
        )
      }
      await client.query(
        `INSERT INTO rp_catalog
          (ecosur_id, description, suggested_price, status, barcodes,
           laboratory, product_type, presentation, dose, form, enrich_status)
         VALUES ${vals.join(',')}
         ON CONFLICT (ecosur_id) DO UPDATE SET
           description = EXCLUDED.description,
           suggested_price = EXCLUDED.suggested_price,
           status = EXCLUDED.status,
           barcodes = EXCLUDED.barcodes,
           laboratory = COALESCE(rp_catalog.laboratory, EXCLUDED.laboratory),
           product_type = COALESCE(rp_catalog.product_type, EXCLUDED.product_type),
           presentation = COALESCE(rp_catalog.presentation, EXCLUDED.presentation),
           dose = COALESCE(rp_catalog.dose, EXCLUDED.dose),
           form = COALESCE(rp_catalog.form, EXCLUDED.form),
           enrich_status = CASE
             WHEN rp_catalog.enrich_status IN ('scraped') THEN rp_catalog.enrich_status
             ELSE EXCLUDED.enrich_status END,
           updated_at = now()`,
        params,
      )
      done += slice.length
      if (done % 5000 === 0 || done === rows.length) console.log(`[import] upserted ${done}/${rows.length}`)
    }
    await client.query('COMMIT')
    console.log(`[import] OK — ${rows.length} rows`)
  } catch (e) {
    await client.query('ROLLBACK')
    console.error('[import] FAIL:', e.message)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch(e => { console.error(e); process.exit(1) })
