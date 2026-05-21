import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseInvoice } from '../index';

// Fixture simula salida típica de Google Vision OCR para PDFs Mediven escaneados:
// cada celda en línea separada (bounding box por bounding box), sin layout
// horizontal preservado. Line-by-line falla (regex requiere desc+qty+pvp+tot+vto
// en MISMA línea). Fallback anchor-based debe rescatar.
const text = fs.readFileSync(path.join(__dirname, 'fixtures', 'mediven-vision.txt'), 'utf8');
const parsed = parseInvoice(text);

describe('parser: Mediven Vision OCR fallback (líneas rotas por bounding box)', () => {
  it('detects mediven format', () => {
    expect(parsed.format).toBe('mediven');
  });

  it('extracts header (funciona porque header siempre es key:value mismo nivel)', () => {
    expect(parsed.header.invoice_number).toBe('3666640');
    expect(parsed.header.invoice_date).toBe('2026-05-19');
    expect(parsed.header.po_reference).toBe('4205417');
  });

  it('parses 6 items via anchor-based fallback', () => {
    expect(parsed.lines.length).toBe(6);
  });

  it('captures BENTLEY despite multi-line OCR breakup', () => {
    const bentley = parsed.lines.find((l) => /BENTLEY/i.test(l.product_name_invoice));
    expect(bentley).toBeDefined();
    expect(bentley!.product_name_invoice).toBe('BENTLEY CLASICO GEL X 120 GR (DM)');
    expect(bentley!.quantity).toBe(3);
    expect(bentley!.unit_cost).toBe(2300);
    expect(bentley!.subtotal).toBe(6900);
    expect(bentley!.batch_code).toBe('5L332');
    expect(bentley!.expiry_date).toBe('2027-12-31');
  });

  it('captures CITRATO DE MAGNESIO (desc larga con numeros embebidos)', () => {
    const citrato = parsed.lines.find((l) => /CITRATO/i.test(l.product_name_invoice));
    expect(citrato).toBeDefined();
    expect(citrato!.product_name_invoice).toBe('CITRATO DE MAGNESIO CAP 500 MG X 30 GREEN MED');
    expect(citrato!.quantity).toBe(8);
    expect(citrato!.unit_cost).toBe(2593);
    expect(citrato!.batch_code).toBe('155TM0326');
  });

  it('all items have batch + expiry (Mediven siempre los provee)', () => {
    for (const l of parsed.lines) {
      expect(l.batch_code).toBeTruthy();
      expect(l.expiry_date).toBeTruthy();
    }
  });
});
