// Parser "Factura Electrónica SII" — Mediven SpA (RUT 76.425.071-0).
// El PDF tiene layout duplicado (original/cedible lado a lado) → dedupe necesario.
//
// Columnas tabla: Descripción | Cant. | Precio | Total | Lote
//   donde "Lote" en realidad es: "MM-YYYY <codigo_lote>"  (vto + batch_code)
//
// Header:
//   FACTURA ELECTRÓNICA  N°  3625647
//   R.U.T. : 76.425.071-0
//   Fecha: 04-05-2026   Vence: 05-05-2026
//   OC No. Peds 4160394
//   Neto / IVA (19%) / Total

import type { InvoiceHeader, InvoiceLine, ParsedInvoice } from '../types';
import { parseCLP, normalizeRut, ddmmyyyyToIso, monthYearToIsoEndOfMonth } from '../util';

const MEDIVEN_RUT = '76425071-0';

export function matchesMediven(text: string): boolean {
  if (/mediven/i.test(text)) return true;
  return /76\.?425\.?071\-?0/i.test(text);
}

function parseHeader(text: string): InvoiceHeader {
  const folioMatch = text.match(/FACTURA\s+ELECTR[OÓ]NICA\s*N°?\s*(\d+)/i)
    ?? text.match(/N°\s*(\d{6,})/i);

  // R.U.T : 76.425.071-0  → proveedor
  const rutMatch = text.match(/R\.?U\.?T\.?\s*:?\s*(\d[\d\.\-kK]+)/i);
  const supplier_rut = normalizeRut(rutMatch?.[1]) ?? MEDIVEN_RUT;

  const fechaMatch = text.match(/Fecha:\s*(\d{2}[\-\/]\d{2}[\-\/]\d{4})/i);
  const venceMatch = text.match(/Vence:\s*(\d{2}[\-\/]\d{2}[\-\/]\d{4})/i);
  const ocMatch = text.match(/OC\s*No\.?\s*Peds?\s*(\d+)/i);

  const netoMatch = text.match(/\bNeto\b\s*([\d\.]+)/i);
  const ivaMatch = text.match(/IVA\s*\(?\s*19%?\s*\)?\s*([\d\.]+)/i);
  const totalMatch = text.match(/\bTotal\b\s*([\d\.]+)/i);

  return {
    invoice_number: folioMatch?.[1] ?? null,
    supplier_rut,
    supplier_name: 'Mediven SpA',
    invoice_date: fechaMatch ? ddmmyyyyToIso(fechaMatch[1]) : null,
    due_date: venceMatch ? ddmmyyyyToIso(venceMatch[1]) : null,
    po_reference: ocMatch?.[1] ?? null,
    subtotal_net: netoMatch ? parseCLP(netoMatch[1]) : null,
    tax_amount: ivaMatch ? parseCLP(ivaMatch[1]) : null,
    total: totalMatch ? parseCLP(totalMatch[1]) : null,
  };
}

const SKIP_RE = /^(descripci[oó]n|cant\.?|precio|total|lote|raz[oó]n\s+social|direcci[oó]n|giro|sucursal|fecha|d[ií]as\s+cr[eé]dito|sub\s*total|neto|iva|son\s+|oc\s+no|comuna|res\s+80|timbre|generado|cedible|email|tel[eé]fono|r\.u\.t|mediven\s+spa)/i;

// Línea Mediven:
//   <desc>  <qty>  <precio>  <total>  <MM-YYYY>  <batch_code_opcional>
// Precio/total: sin "$", pueden tener punto miles.
// El ancla decisiva es el patrón \d{2}-\d{4} (vto MM-YYYY).
const LINE_RE =
  /^(.+?)\s+(\d{1,4})\s+([\d\.]{1,9})\s+([\d\.]{1,12})\s+(\d{2}-\d{4})(?:\s+([A-Z0-9]+))?\s*$/i;

function parseLines(text: string): InvoiceLine[] {
  const rawLines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const seen = new Set<string>(); // dedupe layout duplicado
  const out: InvoiceLine[] = [];

  for (const line of rawLines) {
    if (SKIP_RE.test(line)) continue;
    const m = line.match(LINE_RE);
    if (!m) continue;

    const [, descRaw, qtyStr, precioStr, totalStr, vtoStr, batchRaw] = m;
    const description = descRaw.trim();
    if (description.length < 4) continue;

    const quantity = parseInt(qtyStr, 10);
    const unit_cost = parseCLP(precioStr);
    const subtotal = parseCLP(totalStr);

    if (!quantity || !unit_cost || quantity <= 0 || unit_cost < 50) continue;

    // Sanity: total ≈ qty × precio (tolerancia 5%, IVA NO se aplica acá, viene neto+IVA al final)
    const expected = quantity * unit_cost;
    if (subtotal > 0 && expected > 0 && Math.abs(subtotal - expected) / expected > 0.05) continue;

    const expiry_date = monthYearToIsoEndOfMonth(vtoStr);
    const batch_code = batchRaw?.trim() || null;

    // Dedupe: clave (desc + qty + total + vto + lote)
    const key = `${description}|${quantity}|${subtotal}|${vtoStr}|${batch_code ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      supplier_product_code: null, // Mediven no entrega código interno
      product_name_invoice: description,
      quantity,
      unit_cost,
      subtotal: subtotal > 0 ? subtotal : expected,
      batch_code,
      expiry_date,
    });
  }

  return out;
}

export function parseMediven(text: string): ParsedInvoice {
  return { format: 'mediven', header: parseHeader(text), lines: parseLines(text) };
}
