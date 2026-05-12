// Parser "Comprobante de Pedido" — Global y distribuidoras similares (Socofar, FASA, Salcobrand).
// Columnas: Código | Descripción | Cantidad | U/E | PvP | Total

import type { InvoiceHeader, InvoiceLine, ParsedInvoice } from '../types';
import { parseCLP, normalizeRut, timestampToIsoDate } from '../util';

// Detección: cabecera contiene "U/E" y "PvP" o "Comprobante De Pedido".
export function matchesGlobal(text: string): boolean {
  if (/comprobante\s+de\s+pedido/i.test(text)) return true;
  return /\bU\/E\b/i.test(text) && /\bPvP\b/i.test(text);
}

function parseHeader(text: string): InvoiceHeader {
  const pedidoMatch = text.match(/Pedido\s*N°\s*:?\s*(\d+)/i);
  const fechaMatch = text.match(/Fecha:\s*(\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2}:\d{2})?)/i);
  const rutMatch = text.match(/Rut:\s*([\d\.]+\-[\dkK])/i);
  const nombreMatch = text.match(/Nombre:\s*(.+?)(?:\r?\n|Rut:)/i);
  const montoMatch = text.match(/Monto:\s*\$?\s*([\d\.]+)/i);
  // Buscar "Total: $..." al final del doc, ignorando "Sub Total:".
  const totalAllMatches = Array.from(text.matchAll(/(?<!Sub\s)\bTotal:\s*\$?\s*([\d\.]+)/gi));
  const totalMatch = totalAllMatches.length ? totalAllMatches[totalAllMatches.length - 1] : null;

  return {
    invoice_number: pedidoMatch?.[1] ?? null,
    // OJO: Global imprime el RUT del COMPRADOR ("Nombre: Q&A SPA"), no el del proveedor.
    // No exponer como supplier_rut para no romper auto-match. Quedará null.
    supplier_rut: null,
    supplier_name: nombreMatch ? null : null, // mismo motivo — es el comprador
    invoice_date: fechaMatch ? timestampToIsoDate(fechaMatch[1]) : null,
    due_date: null,
    po_reference: null,
    subtotal_net: null,
    tax_amount: null,
    total: totalMatch ? parseCLP(totalMatch[1]) : (montoMatch ? parseCLP(montoMatch[1]) : null),
  };
}

const SKIP_RE =
  /^(cod[íi]go|descripci[oó]n|detalle\s+de|sub[\s-]?total|pedido\s+n|nombre|rut|giro|status|forma\s+de\s+pago|direcci[oó]n\s+de|fecha|orden\s+de\s+compra|comprobante|u\/e|pvp)/i;

// ^CODE DESC QTY U/E $PvP $TOTAL
const LINE_RE =
  /^([A-Z0-9]{3,15})\s+(.+?)\s+(\d+)\s+(\d+)\s+\$\s*([\d.]+)\s+\$\s*([\d.]+)\s*$/i;

function parseLines(text: string): InvoiceLine[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const out: InvoiceLine[] = [];

  for (const line of lines) {
    if (SKIP_RE.test(line)) continue;
    const m = line.match(LINE_RE);
    if (!m) continue;

    const [, code, description, qtyStr, , pvpStr, totalStr] = m;
    const quantity = parseInt(qtyStr, 10);
    const unit_cost = parseCLP(pvpStr);
    const subtotal = parseCLP(totalStr);

    if (!quantity || !unit_cost || quantity <= 0 || unit_cost < 50) continue;
    // Sanity: total ≈ qty × precio (tolerancia 20%)
    const expected = quantity * unit_cost;
    if (subtotal > 0 && expected > 0 && Math.abs(subtotal - expected) / expected > 0.20) continue;

    out.push({
      supplier_product_code: code.toUpperCase(),
      product_name_invoice: description.trim(),
      quantity,
      unit_cost,
      subtotal: subtotal > 0 ? subtotal : expected,
      batch_code: null,
      expiry_date: null,
    });
  }

  return out;
}

export function parseGlobal(text: string): ParsedInvoice {
  return { format: 'global', header: parseHeader(text), lines: parseLines(text) };
}

// Re-export para que el detector pueda forzar Global aunque normalizeRut quede null.
export { normalizeRut as _normalizeRut };
