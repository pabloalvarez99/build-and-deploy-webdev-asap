import { readFileSync } from 'node:fs';
import { DRUG_INFO, lookupDrugInfo, tokenizeIngredients, inferRiesgoBeers } from '../src/lib/drug-info';
import { DRUG_EXTRAS } from '../src/lib/drug-info-extras';

const EXTRA_FIELDS = ['signos_alarma','consejos_uso','riesgo_beers','via','embarazo','lactancia','receta'] as const;

// 1) Coverage: every DRUG_INFO key (non-alias entry) must have a DRUG_EXTRAS entry
const infoKeys = Object.keys(DRUG_INFO);
const missingExtras = infoKeys.filter(k => !(k in DRUG_EXTRAS));
console.log(`[1] DRUG_INFO entries: ${infoKeys.length}`);
console.log(`[1] Sin extras: ${missingExtras.length}`);
if (missingExtras.length) console.log('   ' + missingExtras.join(', '));

// 2) Stale: every DRUG_EXTRAS key must reference an existing DRUG_INFO entry
const extraKeys = Object.keys(DRUG_EXTRAS);
const orphanExtras = extraKeys.filter(k => !(k in DRUG_INFO));
console.log(`\n[2] DRUG_EXTRAS entries: ${extraKeys.length}`);
console.log(`[2] Huérfanos (extras sin info base): ${orphanExtras.length}`);
if (orphanExtras.length) console.log('   ' + orphanExtras.join(', '));

// 3) Field completeness per extras entry
const incomplete: { key: string; missing: string[] }[] = [];
for (const [k, ex] of Object.entries(DRUG_EXTRAS)) {
  const missing = EXTRA_FIELDS.filter(f => !(ex as any)[f]);
  if (missing.length > 0) incomplete.push({ key: k, missing });
}
console.log(`\n[3] Extras con campos faltantes: ${incomplete.length}`);
for (const i of incomplete.slice(0, 50)) console.log(`   ${i.key}: faltan [${i.missing.join(', ')}]`);

// 4) Catalog coverage via ai.json
const rows: any[] = JSON.parse(readFileSync(new URL('./ai.json', import.meta.url), 'utf8'));
let okProds = 0, partialProds = 0, missProds = 0;
for (const { active_ingredient: ai, n } of rows) {
  const results = lookupDrugInfo(ai);
  const cnt = Number(n);
  if (results.length === 0) { missProds += cnt; continue; }
  const allHaveExtras = results.every(r => r.name in DRUG_EXTRAS);
  if (allHaveExtras) okProds += cnt; else partialProds += cnt;
}
const totalProds = okProds + partialProds + missProds;
console.log(`\n[4] Catálogo (ai.json):`);
console.log(`   Total productos: ${totalProds}`);
console.log(`   Con info+extras: ${okProds} (${(okProds/totalProds*100).toFixed(2)}%)`);
console.log(`   Parciales (algún token sin extras): ${partialProds}`);
console.log(`   Sin info: ${missProds}`);

// 5) inferRiesgoBeers smoke test
let beersOK = 0, beersNull = 0;
for (const [k] of Object.entries(DRUG_INFO)) {
  const r = lookupDrugInfo(k);
  if (r.length === 0) continue;
  const b = inferRiesgoBeers(r[0].info);
  if (b) beersOK++; else beersNull++;
}
console.log(`\n[5] Riesgo Beers resoluble: ${beersOK} / null: ${beersNull}`);

// 6) Tokenizer smoke
const t = tokenizeIngredients('PARACETAMOL 500MG + IBUPROFENO 200MG');
console.log(`\n[6] Tokenizer sample: [${t.join(', ')}]`);

const allGreen = missingExtras.length === 0 && orphanExtras.length === 0 && incomplete.length === 0 && partialProds === 0 && missProds === 0;
console.log(`\n=== ${allGreen ? '100% OK ✓' : 'GAPS PRESENTES ✗'} ===`);
process.exit(allGreen ? 0 : 1);
