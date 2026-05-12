// Fallback heurístico — formatos no reconocidos.
// Conserva la lógica original del scan endpoint: busca líneas con ≥2 números,
// asume últimos como precio/subtotal. No extrae lote ni vto.

import type { InvoiceHeader, InvoiceLine, ParsedInvoice } from '../types';
import { normalizeRut } from '../util';

function parseHeader(text: string): InvoiceHeader {
  const rutMatch = text.match(/R\.?U\.?T\.?\s*:?\s*(\d[\d\.\-kK]+)/i);
  return {
    invoice_number: null,
    supplier_rut: normalizeRut(rutMatch?.[1]),
    supplier_name: null,
    invoice_date: null,
    due_date: null,
    po_reference: null,
    subtotal_net: null,
    tax_amount: null,
    total: null,
  };
}

function parseLines(text: string): InvoiceLine[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const out: InvoiceLine[] = [];
  const numberPattern = /[\d.,]+/g;

  for (const line of lines) {
    const numbers = line.match(numberPattern);
    if (!numbers || numbers.length < 2) continue;

    const parsed = numbers
      .map((n) => parseFloat(n.replace(/\./g, '').replace(',', '.')))
      .filter((n) => !isNaN(n) && n > 0);
    if (parsed.length < 2) continue;

    const subtotal = parsed.length >= 3 ? parsed[parsed.length - 1] : null;
    const unit_cost = parsed[parsed.length - (subtotal !== null ? 2 : 1)];
    const quantity = parsed.length >= 3 ? parsed[parsed.length - 3] : parsed[0];
    if (unit_cost < 50) continue;

    const textPart = line.replace(/[\d.,]+/g, ' ').replace(/\s+/g, ' ').trim();
    const codeMatch = line.match(/^([A-Z0-9]{3,15})\s/i);
    const supplier_product_code = codeMatch ? codeMatch[1] : null;
    const product_name_invoice = textPart || line.substring(0, 60);
    if (!product_name_invoice || product_name_invoice.length < 3) continue;

    out.push({
      supplier_product_code,
      product_name_invoice,
      quantity: Math.round(quantity),
      unit_cost: Math.round(unit_cost),
      subtotal: subtotal !== null ? Math.round(subtotal) : Math.round(quantity * unit_cost),
      batch_code: null,
      expiry_date: null,
    });
  }

  return out;
}

export function parseGeneric(text: string): ParsedInvoice {
  return { format: 'generic', header: parseHeader(text), lines: parseLines(text) };
}
