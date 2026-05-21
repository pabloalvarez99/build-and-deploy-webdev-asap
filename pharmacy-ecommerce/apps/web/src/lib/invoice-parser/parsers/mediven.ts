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
//
// IMPORTANTE: el PDF tiene layout duplicado (original/cedible) — pdf-parse extrae
// ambas columnas concatenadas en una sola línea. Usamos lookahead `(?=\s|$)`
// en vez de `\s*$` para que `.+?` termine en el PRIMER match válido (lado izq.)
// y el dedupe posterior descarte la 2ª aparición del lado derecho.
const LINE_RE =
  /^(.+?)\s+(\d{1,4})\s+([\d\.]{1,9})\s+([\d\.]{1,12})\s+(\d{2}-\d{4})(?:\s+([A-Z0-9]+))?(?=\s|$)/i;

// FALLBACK regex global anclado en MM-YYYY — usado cuando line-by-line falla
// (Vision OCR puede romper líneas entre desc y números, o entremezclar columnas).
// Normaliza todo el texto a single-line, captura ítems consecutivos cuyo ancla
// decisiva es el patrón vto MM-YYYY.
//
// Descripción: empieza con letra mayúscula (productos farma), permite acentos,
// dígitos, símbolos comunes; mínimo 6 chars para evitar matchear basura.
// `?` lazy en desc para que no se coma datos del próximo ítem.
const FLEX_ITEM_RE =
  /([A-ZÑÁÉÍÓÚ][A-Z0-9ÑÁÉÍÓÚ\.\-\+\/\(\),% ]{4,120}?)\s+(\d{1,4})\s+([\d\.]{1,9})\s+([\d\.]{1,12})\s+(\d{2}-\d{4})(?:\s+([A-Z0-9]{2,15}))?(?=\s+[A-ZÑÁÉÍÓÚ]|\s*$)/gi;

interface RawCandidate {
  description: string;
  qtyStr: string;
  precioStr: string;
  totalStr: string;
  vtoStr: string;
  batchRaw?: string;
}

// Palabras-basura que el fallback anchor-based puede arrastrar al inicio de la
// descripción cuando Vision OCR concatena header+items. Cortamos al ÚLTIMO match
// y dejamos solo la descripción real del producto.
const DESC_TRASH_RE = /\b(?:Lote|Sucursal|FARMACIA\s+TU\s+FARMACIA(?:\s*\(?[A-Z]+\)?)?|JOSE\s+SANTIAGO\s+ALDUNATE(?:\s+\d+)?|Descripci[oó]n|Cant\.?|Precio|Total|Fecha\s*:?|Vence\s*:?|OC\s+No\.?\s+Peds?(?:\s+\d+)?|D[ií]as\s+Cr[eé]dito(?:\s*:?\s*\d+)?|Comuna(?:\s*:\s*\w+)?|Tel[eé]fono\s*:?\s*[\+\d\s\-]+|email\s*:?\s*\S+|R\.?U\.?T\.?\s*:?\s*[\d\.\-kK]+|FACTURA\s+ELECTR[OÓ]NICA|N°\s*\d+|Mediven\s+SpA|SOCIEDAD\s+DE\s+SERVICIOS\s+FARMACEUTICOS\s+Q&A\s+SPA|GIRO\s*:[^A-Z]*|S\.I\.I\.|Razón\s+social[^A-Z]*|Direcci[oó]n\s*:[^A-Z]*|Giro\s*:[^A-Z]*|Bayona\s+\d+[^A-Z]*|Ciudad\s*:[^A-Z]*)\b/gi;

function cleanDescription(raw: string): string {
  // Cortar al ÚLTIMO match de palabra-basura → todo antes es header leak
  let lastEnd = 0;
  let m: RegExpExecArray | null;
  DESC_TRASH_RE.lastIndex = 0;
  while ((m = DESC_TRASH_RE.exec(raw)) !== null) {
    lastEnd = m.index + m[0].length;
  }
  return raw.slice(lastEnd).trim().replace(/\s{2,}/g, ' ');
}

function buildLine(c: RawCandidate, seen: Set<string>): InvoiceLine | null {
  const description = cleanDescription(c.description);
  if (description.length < 4) return null;

  const quantity = parseInt(c.qtyStr, 10);
  const unit_cost = parseCLP(c.precioStr);
  const subtotal = parseCLP(c.totalStr);

  if (!quantity || !unit_cost || quantity <= 0 || unit_cost < 50) return null;

  // Sanity: total ≈ qty × precio (tolerancia 5%, IVA viene desglosado al pie)
  const expected = quantity * unit_cost;
  if (subtotal > 0 && expected > 0 && Math.abs(subtotal - expected) / expected > 0.05) return null;

  const expiry_date = monthYearToIsoEndOfMonth(c.vtoStr);
  const batch_code = c.batchRaw?.trim() || null;

  // Dedupe: clave (desc + qty + total + vto + lote)
  const key = `${description}|${quantity}|${subtotal}|${c.vtoStr}|${batch_code ?? ''}`;
  if (seen.has(key)) return null;
  seen.add(key);

  return {
    supplier_product_code: null,
    product_name_invoice: description,
    quantity,
    unit_cost,
    subtotal: subtotal > 0 ? subtotal : expected,
    batch_code,
    expiry_date,
  };
}

function parseLinesByLine(text: string): InvoiceLine[] {
  const rawLines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const seen = new Set<string>();
  const out: InvoiceLine[] = [];

  for (const line of rawLines) {
    if (SKIP_RE.test(line)) continue;
    const m = line.match(LINE_RE);
    if (!m) continue;
    const built = buildLine({
      description: m[1],
      qtyStr: m[2],
      precioStr: m[3],
      totalStr: m[4],
      vtoStr: m[5],
      batchRaw: m[6],
    }, seen);
    if (built) out.push(built);
  }
  return out;
}

function parseLinesAnchored(text: string): InvoiceLine[] {
  // Colapsar todo whitespace (incl newlines, tabs) a single space para que regex
  // global no dependa de line breaks. Mantiene caracteres legibles para descripción.
  const normalized = text.replace(/\s+/g, ' ');
  const seen = new Set<string>();
  const out: InvoiceLine[] = [];

  let m: RegExpExecArray | null;
  FLEX_ITEM_RE.lastIndex = 0;
  while ((m = FLEX_ITEM_RE.exec(normalized)) !== null) {
    const built = buildLine({
      description: m[1],
      qtyStr: m[2],
      precioStr: m[3],
      totalStr: m[4],
      vtoStr: m[5],
      batchRaw: m[6],
    }, seen);
    if (built) out.push(built);
  }
  return out;
}

function parseLines(text: string): InvoiceLine[] {
  // Approach 1 (preferido): line-by-line — preciso, rápido, ya funciona con pdf-parse.
  const lineBased = parseLinesByLine(text);
  if (lineBased.length > 0) return lineBased;

  // Approach 2 (fallback): anchor-based — robusto cuando Vision OCR rompe layout.
  // Tipicamente pasa con PDFs Mediven escaneados (no nativos) que disparan el
  // fallback a Vision OCR; el text resultante tiene line breaks por bounding box.
  return parseLinesAnchored(text);
}

export function parseMediven(text: string): ParsedInvoice {
  return { format: 'mediven', header: parseHeader(text), lines: parseLines(text) };
}
