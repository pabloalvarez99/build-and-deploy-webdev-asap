// Parser "Factura Electrónica SII" — Mediven SpA (RUT 76.425.071-0).
//
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
//
// Mediven puede entregar el PDF como:
//   A) PDF nativo con texto — pdf-parse extrae 1 línea horizontal por ítem.
//   B) PDF escaneado → fallback Vision OCR — texto puede salir:
//      B1) Horizontal pero con concatenación rara (anchor-based fix).
//      B2) Vertical (cada celda en línea propia: desc / qty / pvp / tot / vto / batch)
//          → state-machine multi-line es la única que funciona.
//
// Por eso corre 3 estrategias en orden, primer non-empty resultado gana.

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

  const rutMatch = text.match(/R\.?U\.?T\.?\s*:?\s*(\d[\d\.\-kK]+)/i);
  const supplier_rut = normalizeRut(rutMatch?.[1]) ?? MEDIVEN_RUT;

  // `:` opcional + whitespace flexible (incl newlines) → tolera vertical OCR layout
  const fechaMatch = text.match(/Fecha\s*:?\s*(\d{2}[\-\/]\d{2}[\-\/]\d{4})/i);
  const venceMatch = text.match(/Vence\s*:?\s*(\d{2}[\-\/]\d{2}[\-\/]\d{4})/i);
  const ocMatch = text.match(/OC\s*No\.?\s*Peds?\s*:?\s*(\d+)/i);

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

const SKIP_RE = /^(descripci[oó]n|cant\.?|precio|total|lote|raz[oó]n\s+social|direcci[oó]n|giro|sucursal|fecha|d[ií]as\s+cr[eé]dito|sub\s*total|neto|iva|son\s+|oc\s+no|comuna|res\s+80|timbre|generado|cedible|email|tel[eé]fono|r\.u\.t|mediven\s+spa|s\.i\.i|farmacia\s+tu\s+farmacia|jose\s+santiago|aldunate|bayona|colina|santiago\s+norte|ciudad|softel|verifique|generado\s+por)/i;

// Header words que no deben aparecer como tail de la descripción (post-clean)
const TRAILING_GARBAGE_RE = /\b(?:Lote|Descripci[oó]n|Cant\.?|Precio|Total|Fecha|Vence|Sucursal|Comuna|Direcci[oó]n|Giro|Razón\s+social|R\.?U\.?T\.?|Tel[eé]fono|email|Bayona|Aldunate|Mediven|FARMACIA\s+TU\s+FARMACIA|SOCIEDAD)\b/gi;

// LINE_RE: línea horizontal completa (pdf-parse nativo). Lookahead `(?=\s|$)` para
// que `.+?` lazy termine en PRIMER match válido y el dedupe filtre lado-derecho duplicado.
// Precio/total: estricto CLP — entero 1-3 dígitos opcional con grupos de 3 (`.999`).
const LINE_RE =
  /^(.+?)\s+(\d{1,4})\s+(\d{1,3}(?:\.\d{3})*|\d{4,7})\s+(\d{1,3}(?:\.\d{3})*|\d{4,9})\s+(\d{2}-\d{4})(?:\s+([A-Z0-9]{2,15}))?(?=\s|$)/i;

// FLEX_ITEM_RE: regex global anclado en MM-YYYY tras normalizar todo whitespace a single space.
// Descripción: empieza con LETRA (no número), permite chars típicos farmacia, mín 5 max 100.
// Precio/total: estrictos CLP. Batch: 2-15 alfanum. Lookahead exige próximo item o fin.
const FLEX_ITEM_RE =
  /(?:^|\s)([A-ZÑÁÉÍÓÚ][A-Z0-9ÑÁÉÍÓÚ\.\-\+\/\(\)% ]{4,100}?)\s+(\d{1,4})\s+(\d{1,3}(?:\.\d{3})*|\d{4,7})\s+(\d{1,3}(?:\.\d{3})*|\d{4,9})\s+(\d{2}-\d{4})(?:\s+([A-Z0-9]{2,15}))?(?=\s+[A-ZÑÁÉÍÓÚ]|\s*$)/gi;

interface RawCandidate {
  description: string;
  qtyStr: string;
  precioStr: string;
  totalStr: string;
  vtoStr: string;
  batchRaw?: string;
}

function cleanDescription(raw: string): string {
  let desc = raw.trim().replace(/\s{2,}/g, ' ');

  // Truncar al ÚLTIMO match de palabra-basura preámbulo (header leak antes del producto real)
  let lastEnd = 0;
  let m: RegExpExecArray | null;
  TRAILING_GARBAGE_RE.lastIndex = 0;
  while ((m = TRAILING_GARBAGE_RE.exec(desc)) !== null) {
    lastEnd = m.index + m[0].length;
  }
  if (lastEnd > 0) desc = desc.slice(lastEnd).trim();

  return desc;
}

// Validador anti-garbage: rechaza desc demasiado corta, demasiado larga, sin letras,
// o que sea puramente header words.
function isValidDescription(desc: string): boolean {
  if (desc.length < 5 || desc.length > 100) return false;
  if (!/[A-ZÑÁÉÍÓÚ]/.test(desc)) return false;
  // Debe tener al menos 1 palabra de 4+ letras consecutivas (no solo abreviaciones)
  if (!/[A-ZÑÁÉÍÓÚ]{4,}/.test(desc)) return false;
  if (SKIP_RE.test(desc)) return false;
  return true;
}

function buildLine(c: RawCandidate, seen: Set<string>, strictSubtotal: boolean): InvoiceLine | null {
  const description = cleanDescription(c.description);
  if (!isValidDescription(description)) return null;

  const quantity = parseInt(c.qtyStr, 10);
  const unit_cost = parseCLP(c.precioStr);
  const subtotal = parseCLP(c.totalStr);

  if (!quantity || quantity <= 0 || quantity > 999) return null;
  if (!unit_cost || unit_cost < 50 || unit_cost > 10_000_000) return null;

  // En fallback (Vision OCR), subtotal DEBE estar presente y matchear qty*pvp ±5%.
  // Esto rechaza garbage matches donde números random pasaron el regex.
  const expected = quantity * unit_cost;
  if (strictSubtotal) {
    if (!subtotal || subtotal <= 0) return null;
    if (Math.abs(subtotal - expected) / expected > 0.05) return null;
  } else {
    // Línea pdf-parse: subtotal puede faltar, tolerancia 5%
    if (subtotal > 0 && Math.abs(subtotal - expected) / expected > 0.05) return null;
  }

  const expiry_date = monthYearToIsoEndOfMonth(c.vtoStr);
  if (!expiry_date) return null;
  const batch_code = c.batchRaw?.trim() || null;

  const key = `${description}|${quantity}|${subtotal || expected}|${c.vtoStr}|${batch_code ?? ''}`;
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

// ════════════════════════════════════════════════════════════════════════════
// STRATEGY 1: line-by-line — pdf-parse nativo, layout horizontal
// ════════════════════════════════════════════════════════════════════════════
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
    }, seen, /* strictSubtotal */ false);
    if (built) out.push(built);
  }
  return out;
}

// ════════════════════════════════════════════════════════════════════════════
// STRATEGY 2: anchor-based — Vision OCR horizontal con line breaks raros
// Normaliza todo whitespace a single space, regex global anclado en MM-YYYY.
// ════════════════════════════════════════════════════════════════════════════
function parseLinesAnchored(text: string): InvoiceLine[] {
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
    }, seen, /* strictSubtotal */ true);
    if (built) out.push(built);
  }
  return out;
}

// ════════════════════════════════════════════════════════════════════════════
// STRATEGY 3: state-machine — Vision OCR vertical, cada celda en línea propia.
// Busca ancla MM-YYYY, mira 4-6 líneas previas para qty/pvp/tot/desc.
// Patrón celda-por-línea típico de Google Vision DOCUMENT_TEXT_DETECTION:
//   BENTLEY CLASICO GEL X 120 GR (DM)
//   3
//   2.300
//   6.900
//   12-2027
//   5L332
// ════════════════════════════════════════════════════════════════════════════
const RE_INT_QTY = /^\d{1,4}$/;
const RE_NUMBER_CLP = /^(?:\d{1,3}(?:\.\d{3})+|\d{1,7})$/;
const RE_MMYYYY = /^(\d{2})-(\d{4})$/;
const RE_BATCH = /^[A-Z0-9]{2,15}$/;

function parseLinesStateMachine(text: string): InvoiceLine[] {
  const rawLines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const seen = new Set<string>();
  const out: InvoiceLine[] = [];

  // Buscar cada índice donde aparece MM-YYYY como línea ENTERA (no embebido)
  for (let i = 0; i < rawLines.length; i++) {
    const ln = rawLines[i];
    const vtoMatch = ln.match(RE_MMYYYY);
    if (!vtoMatch) continue;

    // Mirar 3 líneas previas: deben ser qty, pvp, tot (en ese orden).
    if (i < 3) continue;
    const qtyLn = rawLines[i - 3];
    const pvpLn = rawLines[i - 2];
    const totLn = rawLines[i - 1];
    if (!RE_INT_QTY.test(qtyLn)) continue;
    if (!RE_NUMBER_CLP.test(pvpLn)) continue;
    if (!RE_NUMBER_CLP.test(totLn)) continue;

    // Antes de qty, descripción: buscar hacia atrás líneas no-numéricas hasta otra ancla
    // o hasta encontrar header word. Máximo 3 líneas atrás (descripción usualmente 1 línea
    // pero Vision puede dividir nombres largos).
    let descStart = i - 4;
    const descParts: string[] = [];
    while (descStart >= 0 && descStart >= i - 8) {
      const dl = rawLines[descStart];
      // Romper si encuentro otra ancla MM-YYYY, batch posterior, número, o header word
      if (RE_MMYYYY.test(dl)) break;
      if (RE_INT_QTY.test(dl) || RE_NUMBER_CLP.test(dl)) break;
      if (SKIP_RE.test(dl)) break;
      if (RE_BATCH.test(dl) && dl.length <= 12 && /^\d/.test(dl)) break; // batch code numeric
      // Línea válida de descripción: empieza con letra mayúscula
      if (!/^[A-ZÑÁÉÍÓÚ]/.test(dl)) break;
      descParts.unshift(dl);
      descStart--;
    }
    if (descParts.length === 0) continue;
    const description = descParts.join(' ');

    // Después de vto, opcional batch
    let batch: string | undefined = undefined;
    if (i + 1 < rawLines.length) {
      const next = rawLines[i + 1];
      if (RE_BATCH.test(next) && !RE_MMYYYY.test(next) && !RE_INT_QTY.test(next)) {
        batch = next;
      }
    }

    const built = buildLine({
      description,
      qtyStr: qtyLn,
      precioStr: pvpLn,
      totalStr: totLn,
      vtoStr: ln,
      batchRaw: batch,
    }, seen, /* strictSubtotal */ true);
    if (built) out.push(built);
  }

  return out;
}

// ════════════════════════════════════════════════════════════════════════════
// Orquestador: corre 3 estrategias, retorna primera con ≥1 línea
// ════════════════════════════════════════════════════════════════════════════
function parseLines(text: string): InvoiceLine[] {
  const a = parseLinesByLine(text);
  if (a.length > 0) return a;
  const b = parseLinesAnchored(text);
  if (b.length > 0) return b;
  return parseLinesStateMachine(text);
}

export function parseMediven(text: string): ParsedInvoice {
  return { format: 'mediven', header: parseHeader(text), lines: parseLines(text) };
}
