// Entry point para parsing estructurado de facturas/pedidos de proveedores.
//
// Uso:
//   import { parseInvoice } from '@/lib/invoice-parser';
//   const { format, header, lines } = parseInvoice(ocrText);

import type { ParsedInvoice } from './types';
import { matchesMediven, parseMediven } from './parsers/mediven';
import { matchesGlobal, parseGlobal } from './parsers/global';
import { parseGeneric } from './parsers/generic';

export function detectFormat(text: string): 'mediven' | 'global' | 'generic' {
  if (matchesMediven(text)) return 'mediven';
  if (matchesGlobal(text)) return 'global';
  return 'generic';
}

// Nota de Crédito (NC): factura "negativa" — abono, devolución, ajuste de precio.
// NUNCA aumenta stock; al contrario, generalmente lo reduce o documenta corrección.
// El pipeline de compras debe rechazar NCs explícitamente para evitar duplicar stock.
export function isCreditNote(text: string): boolean {
  return /nota\s+de\s+cr[eé]dito|nota\s+cr[eé]dito\s+electr[oó]nica|\bN\.?C\.?E\.?\b/i.test(text);
}

export function parseInvoice(text: string): ParsedInvoice {
  if (isCreditNote(text)) {
    return {
      format: 'generic',
      header: {
        invoice_number: null, supplier_rut: null, supplier_name: null,
        invoice_date: null, due_date: null, po_reference: null,
        subtotal_net: null, tax_amount: null, total: null,
      },
      lines: [],
    };
  }
  const format = detectFormat(text);
  if (format === 'mediven') return parseMediven(text);
  if (format === 'global') return parseGlobal(text);
  return parseGeneric(text);
}

export type { InvoiceLine, InvoiceHeader, ParsedInvoice, InvoiceFormat } from './types';
