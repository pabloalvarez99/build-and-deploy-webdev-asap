import { parseInvoice, detectFormat, isCreditNote } from '../src/lib/invoice-parser';
import { PDFParse } from 'pdf-parse';
import fs from 'fs';

const files = [
  'C:/Users/Administrator/Documents/GitHub/build-and-deploy-webdev-asap/0000740850.pdf',
  'C:/Users/Administrator/Documents/GitHub/build-and-deploy-webdev-asap/0000750277.pdf',
  'C:/Users/Administrator/Documents/GitHub/build-and-deploy-webdev-asap/FA_7964633 (1).pdf',
];

(async () => {
  for (const f of files) {
    const buf = fs.readFileSync(f);
    const p = new PDFParse({ data: buf });
    const r = await p.getText();
    const text = r.text;
    const fmt = detectFormat(text);
    const cn = isCreditNote(text);
    const parsed = parseInvoice(text);
    console.log('FILE:', f.split('/').pop());
    console.log('  format:', fmt, '| credit_note:', cn);
    console.log('  header:', JSON.stringify(parsed.header));
    console.log('  lines:', parsed.lines.length);
    console.log('  first 3:', JSON.stringify(parsed.lines.slice(0, 3), null, 2));
    const total = parsed.lines.reduce((s, l) => s + l.subtotal, 0);
    console.log('  sum_subtotals:', total);
    console.log('');
  }
})();
