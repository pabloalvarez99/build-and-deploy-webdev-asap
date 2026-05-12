#!/usr/bin/env node
// Extracts plain text from PDF(s) via pdf-parse v2.
// Usage: node scripts/extract-pdf-text.mjs <input.pdf> [...more.pdf]
import { PDFParse } from 'pdf-parse';
import fs from 'fs';
import path from 'path';

const files = process.argv.slice(2);
if (!files.length) { console.error('usage: extract-pdf-text.mjs <pdf>...'); process.exit(1); }

for (const f of files) {
  const buf = fs.readFileSync(f);
  const parser = new PDFParse({ data: buf });
  const r = await parser.getText();
  const outDir = path.join(path.dirname(import.meta.url.replace('file:///', '')), '..', 'src', 'lib', 'invoice-parser', '__tests__', 'fixtures');
  fs.mkdirSync(outDir, { recursive: true });
  const stem = path.basename(f).replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/gi, '_').toLowerCase();
  const outPath = path.join(outDir, `${stem}.txt`);
  fs.writeFileSync(outPath, r.text, 'utf8');
  console.log(`${f} → ${outPath} (${r.text.length} bytes, ${r.text.split('\n').length} lines, ${r.pages?.length ?? 0} pages)`);
}
