import { describe, it, expect } from 'vitest';
import { isCreditNote, parseInvoice } from '../index';

describe('Nota de Crédito detection', () => {
  it('detects "NOTA DE CRÉDITO ELECTRÓNICA"', () => {
    expect(isCreditNote('NOTA DE CRÉDITO ELECTRÓNICA  N° 12345')).toBe(true);
  });
  it('detects "Nota de Credito" sin tilde', () => {
    expect(isCreditNote('Nota de Credito 999')).toBe(true);
  });
  it('detects acronym NCE', () => {
    expect(isCreditNote('Documento: N.C.E. 555')).toBe(true);
  });
  it('does NOT confuse with FACTURA', () => {
    expect(isCreditNote('FACTURA ELECTRÓNICA N° 999 — Crédito 30 días')).toBe(false);
  });
  it('parseInvoice short-circuits NC → empty lines, generic', () => {
    const r = parseInvoice('NOTA DE CRÉDITO ELECTRÓNICA\nN° 9999\nTotal 100.000');
    expect(r.format).toBe('generic');
    expect(r.lines).toEqual([]);
    expect(r.header.invoice_number).toBeNull();
  });
});
