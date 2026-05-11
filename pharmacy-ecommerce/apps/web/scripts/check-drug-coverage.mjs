#!/usr/bin/env node
// Reports active_ingredient values that lookupDrugInfo() returns empty for.
// Reads scripts/ai.json. Run with: node --experimental-strip-types scripts/check-drug-coverage.mjs
import { readFileSync } from 'node:fs';
import { lookupDrugInfo, tokenizeIngredients } from '../src/lib/drug-info.ts';

const rows = JSON.parse(readFileSync(new URL('./ai.json', import.meta.url), 'utf8'));
let okRows = 0, missRows = 0, okProds = 0, missProds = 0;
const misses = [];
for (const { active_ingredient: ai, n } of rows) {
  const count = Number(n);
  const r = lookupDrugInfo(ai);
  if (r.length > 0) { okRows++; okProds += count; }
  else {
    missRows++; missProds += count;
    misses.push({ ai, n: count, tokens: tokenizeIngredients(ai) });
  }
}
console.log(`Rows: ${okRows}/${okRows+missRows} covered (${((okRows/(okRows+missRows))*100).toFixed(1)}%)`);
console.log(`Products: ${okProds}/${okProds+missProds} covered (${((okProds/(okProds+missProds))*100).toFixed(1)}%)`);
console.log(`\nMisses (${misses.length}):`);
misses.sort((a,b) => b.n - a.n);
for (const m of misses) console.log(`  [${m.n}] "${m.ai}"  →  tokens=[${m.tokens.join(', ')}]`);
