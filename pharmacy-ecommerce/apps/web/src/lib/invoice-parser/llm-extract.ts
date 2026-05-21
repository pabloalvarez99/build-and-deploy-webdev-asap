// LLM-based fallback para extracción de líneas de factura cuando todas las
// estrategias regex/state-machine fallan (Vision OCR caótico, formatos nuevos).
//
// Usa Anthropic Claude haiku-4-5 vía fetch directo (sin SDK → cero deps añadidas).
// Activado solo si ANTHROPIC_API_KEY está configurado en env.
//
// Costo aprox: $0.001-0.003 por factura (haiku 4.5). Sólo se invoca cuando regex
// retorna 0 líneas — no afecta facturas normales.

import type { InvoiceLine, InvoiceFormat } from './types';
import { monthYearToIsoEndOfMonth, ddmmyyyyToIso } from './util';

const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TEXT_CHARS = 12000;

interface LLMItem {
  name?: string;
  qty?: number;
  unit_price?: number;
  subtotal?: number;
  expiry?: string;
  expiry_mm_yyyy?: string;
  batch?: string | null;
  supplier_code?: string | null;
}

function buildPrompt(format: InvoiceFormat, ocrText: string): string {
  if (format === 'mediven') {
    return `Eres un parser de facturas farmacéuticas Mediven SpA (Chile).
OCR text de la factura abajo. Extrae cada LÍNEA DE PRODUCTO (no headers, no totales).

Formato tabla Mediven: Descripción | Cant | Precio | Total | Vencimiento | Lote
- Precios y totales en CLP con punto miles (2.300 = 2300, 23.136 = 23136).
- Total = Cant × Precio (tolerancia ±5%). Si no cuadra, NO incluyas el ítem.
- Vencimiento formato MM-YYYY (ej "12-2027").
- Lote alfanumérico 2-15 chars (opcional, puede faltar).
- Descripción puede tener paréntesis ej "(DM)", "[BE]", "%", números, slashes.
- Ignora layout duplicado (original/cedible) — dedupe por nombre+lote+vto.

Responde SOLO JSON array sin markdown, sin comentarios, sin texto extra:
[{"name":"...","qty":N,"unit_price":N,"subtotal":N,"expiry_mm_yyyy":"MM-YYYY","batch":"..."|null}]

Si no hay items válidos: []

OCR:
${ocrText.slice(0, MAX_TEXT_CHARS)}`;
  }

  // Genérico (otros proveedores)
  return `Eres un parser de facturas/pedidos de proveedores farmacéuticos chilenos.
Extrae cada LÍNEA DE PRODUCTO del OCR text abajo.

Responde SOLO JSON array sin markdown:
[{"name":"...","qty":N,"unit_price":N,"subtotal":N,"expiry":"YYYY-MM-DD"|null,"batch":string|null,"supplier_code":string|null}]

Si no hay items válidos: []

OCR:
${ocrText.slice(0, MAX_TEXT_CHARS)}`;
}

function safeJsonParse<T>(raw: string): T | null {
  // Tolerar wrapping markdown ```json ... ```
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Intentar extraer el primer array JSON dentro del texto
    const arrMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrMatch) {
      try {
        return JSON.parse(arrMatch[0]) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function extractViaLLM(
  format: InvoiceFormat,
  ocrText: string,
  apiKey: string,
): Promise<InvoiceLine[]> {
  const prompt = buildPrompt(format, ocrText);

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Claude API ${res.status}: ${await res.text().catch(() => '')}`);
  }

  const data = (await res.json()) as { content?: Array<{ text?: string }> };
  const responseText = data.content?.[0]?.text ?? '[]';

  const items = safeJsonParse<LLMItem[]>(responseText);
  if (!items || !Array.isArray(items)) return [];

  const seen = new Set<string>();
  const lines: InvoiceLine[] = [];

  for (const it of items) {
    const name = typeof it.name === 'string' ? it.name.trim() : '';
    const qty = Number(it.qty);
    const unit_cost = Number(it.unit_price);
    const subtotal = Number(it.subtotal);

    if (!name || name.length < 4) continue;
    if (!qty || qty <= 0 || qty > 999) continue;
    if (!unit_cost || unit_cost < 50 || unit_cost > 10_000_000) continue;

    // Sanity: subtotal ≈ qty * unit_cost (tolerancia 5%)
    const expected = qty * unit_cost;
    const finalSubtotal = subtotal > 0 ? subtotal : expected;
    if (Math.abs(finalSubtotal - expected) / expected > 0.05) continue;

    // Expiry: aceptar MM-YYYY o YYYY-MM-DD
    let expiry_date: string | null = null;
    if (it.expiry_mm_yyyy) {
      expiry_date = monthYearToIsoEndOfMonth(it.expiry_mm_yyyy);
    } else if (it.expiry) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(it.expiry)) expiry_date = it.expiry;
      else if (/^\d{2}-\d{4}$/.test(it.expiry)) expiry_date = monthYearToIsoEndOfMonth(it.expiry);
      else if (/^\d{2}[\-\/]\d{2}[\-\/]\d{4}$/.test(it.expiry)) expiry_date = ddmmyyyyToIso(it.expiry);
    }

    const batch_code = it.batch ? String(it.batch).trim() : null;
    const supplier_product_code = it.supplier_code ? String(it.supplier_code).trim() : null;

    const key = `${name}|${qty}|${finalSubtotal}|${expiry_date ?? ''}|${batch_code ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);

    lines.push({
      supplier_product_code,
      product_name_invoice: name,
      quantity: qty,
      unit_cost,
      subtotal: finalSubtotal,
      batch_code,
      expiry_date,
    });
  }

  return lines;
}
