import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseInvoice } from '../index';

// Fixture simula salida típica Google Vision DOCUMENT_TEXT_DETECTION cuando el PDF
// es escaneado: cada celda en línea propia. State-machine es la única estrategia
// que entiende este layout (line-by-line + anchor-based fallan).
const text = fs.readFileSync(path.join(__dirname, 'fixtures', 'mediven-vertical.txt'), 'utf8');
const parsed = parseInvoice(text);

describe('parser: Mediven Vision OCR vertical (state-machine)', () => {
  it('detects mediven format', () => {
    expect(parsed.format).toBe('mediven');
  });

  it('extracts header', () => {
    expect(parsed.header.invoice_number).toBe('3666640');
    expect(parsed.header.invoice_date).toBe('2026-05-19');
    expect(parsed.header.po_reference).toBe('4205417');
  });

  it('parses 7 items via state-machine vertical reconstruction', () => {
    expect(parsed.lines.length).toBe(7);
  });

  it('captures BENTLEY desc limpia + qty/pvp/lote/vto', () => {
    const b = parsed.lines.find((l) => /BENTLEY/i.test(l.product_name_invoice));
    expect(b).toBeDefined();
    expect(b!.product_name_invoice).toBe('BENTLEY CLASICO GEL X 120 GR (DM)');
    expect(b!.quantity).toBe(3);
    expect(b!.unit_cost).toBe(2300);
    expect(b!.subtotal).toBe(6900);
    expect(b!.batch_code).toBe('5L332');
    expect(b!.expiry_date).toBe('2027-12-31');
  });

  it('captures CITRATO desc larga sin truncar', () => {
    const c = parsed.lines.find((l) => /CITRATO/i.test(l.product_name_invoice));
    expect(c).toBeDefined();
    expect(c!.product_name_invoice).toBe('CITRATO DE MAGNESIO CAP 500 MG X 30 GREEN MED');
    expect(c!.batch_code).toBe('155TM0326');
  });

  it('captures ONETEST con qty/pvp bajos (399 < umbral típico)', () => {
    const o = parsed.lines.find((l) => /ONETEST/i.test(l.product_name_invoice));
    expect(o).toBeDefined();
    expect(o!.unit_cost).toBe(399);
    expect(o!.quantity).toBe(6);
    expect(o!.subtotal).toBe(2394);
  });

  it('todas las descs son limpias (no contienen header words)', () => {
    for (const l of parsed.lines) {
      expect(l.product_name_invoice).not.toMatch(/^(Lote|Cant|Precio|Total|Fecha|Sucursal|Descripci)/i);
      expect(l.product_name_invoice).not.toMatch(/\d{2}-\d{4}/);
      expect(l.product_name_invoice).not.toMatch(/FARMACIA\s+TU\s+FARMACIA/i);
    }
  });
});
