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

export function parseInvoice(text: string): ParsedInvoice {
  const format = detectFormat(text);
  if (format === 'mediven') return parseMediven(text);
  if (format === 'global') return parseGlobal(text);
  return parseGeneric(text);
}

export type { InvoiceLine, InvoiceHeader, ParsedInvoice, InvoiceFormat } from './types';
