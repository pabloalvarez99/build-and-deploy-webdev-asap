import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseInvoice } from '../index';

const text = fs.readFileSync(path.join(__dirname, 'fixtures', 'mediven.txt'), 'utf8');
const parsed = parseInvoice(text);

describe('parser: Mediven (Factura Electrónica SII)', () => {
  it('detects mediven format', () => {
    expect(parsed.format).toBe('mediven');
  });

  it('extracts header with RUT, folio, vto, OC, neto+IVA+total', () => {
    expect(parsed.header.invoice_number).toBe('3625647');
    expect(parsed.header.supplier_rut).toBe('76425071-0');
    expect(parsed.header.supplier_name).toBe('Mediven SpA');
    expect(parsed.header.invoice_date).toBe('2026-05-04');
    expect(parsed.header.due_date).toBe('2026-05-05');
    expect(parsed.header.po_reference).toBe('4160394');
    expect(parsed.header.subtotal_net).toBe(102060);
    expect(parsed.header.tax_amount).toBe(19391);
    expect(parsed.header.total).toBe(121451);
  });

  it('parses 9 deduped line items', () => {
    expect(parsed.lines.length).toBe(9);
  });

  it('captures BENTLEY line with batch_code=5L332 and expiry=2027-12-31', () => {
    const bentley = parsed.lines.find((l) => /BENTLEY/i.test(l.product_name_invoice));
    expect(bentley).toBeDefined();
    expect(bentley!.batch_code).toBe('5L332');
    expect(bentley!.expiry_date).toBe('2027-12-31');
    expect(bentley!.quantity).toBe(3);
    expect(bentley!.unit_cost).toBe(2300);
    expect(bentley!.subtotal).toBe(6900);
  });

  it('every line has batch_code + expiry_date (Mediven siempre los provee)', () => {
    for (const l of parsed.lines) {
      expect(l.batch_code).toBeTruthy();
      expect(l.expiry_date).toBeTruthy();
    }
  });

  it('line subtotals sum ≈ subtotal_net (within 1 unit rounding)', () => {
    const sum = parsed.lines.reduce((s, l) => s + l.subtotal, 0);
    expect(Math.abs(sum - parsed.header.subtotal_net!)).toBeLessThanOrEqual(1);
  });
});
