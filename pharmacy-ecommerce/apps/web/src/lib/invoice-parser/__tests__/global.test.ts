import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseInvoice } from '../index';

const text = fs.readFileSync(path.join(__dirname, 'fixtures', 'global.txt'), 'utf8');
const parsed = parseInvoice(text);

describe('parser: Global (Comprobante de Pedido)', () => {
  it('detects global format', () => {
    expect(parsed.format).toBe('global');
  });

  it('extracts invoice header', () => {
    expect(parsed.header.invoice_number).toBe('0000750277');
    expect(parsed.header.invoice_date).toBe('2026-04-28');
    expect(parsed.header.supplier_rut).toBeNull(); // PDF imprime RUT comprador, no proveedor
    expect(parsed.header.total).toBe(1297766); // Gross total con flete/IVA
    expect(parsed.header.subtotal_net).toBeNull();
    expect(parsed.header.tax_amount).toBeNull();
  });

  it('parses 71 line items', () => {
    expect(parsed.lines.length).toBeGreaterThanOrEqual(70);
    expect(parsed.lines.length).toBeLessThanOrEqual(73);
  });

  it('captures CENTRUM line (código 250708)', () => {
    const centrum = parsed.lines.find((l) => l.supplier_product_code === '250708');
    expect(centrum).toBeDefined();
    expect(centrum!.product_name_invoice).toMatch(/CENTRUM/i);
    expect(centrum!.quantity).toBe(3);
    expect(centrum!.unit_cost).toBe(4190);
    expect(centrum!.subtotal).toBe(12570);
  });

  it('no batch/expiry (Global no provee lotes)', () => {
    for (const l of parsed.lines) {
      expect(l.batch_code).toBeNull();
      expect(l.expiry_date).toBeNull();
    }
  });

  it('all items have supplier_product_code', () => {
    for (const l of parsed.lines) expect(l.supplier_product_code).toBeTruthy();
  });
});
