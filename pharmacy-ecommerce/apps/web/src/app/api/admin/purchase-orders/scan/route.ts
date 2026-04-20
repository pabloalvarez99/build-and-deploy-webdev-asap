import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

export interface ScannedLine {
  supplier_product_code: string | null;
  product_name_invoice: string;
  quantity: number;
  unit_cost: number;
  subtotal: number;
  product_id: string | null;
  product_name_matched: string | null; // nombre del producto en catálogo si hay match
}

type RawLine = Omit<ScannedLine, 'product_id' | 'product_name_matched'>;

// ─────────────────────────────────────────────────────────────────────────────
// Parser 1: "Comprobante de Pedido" — formato usado por distribuidoras chilenas
// (Socofar, FASA, Salcobrand, etc.)
//
// Columnas: Código | Descripción | Cantidad | U/E | PvP | Total
//   - Código: alfanumérico, puede terminar en letra (19900069S, 199448M, 255447C)
//   - PvP y Total: llevan prefijo "$" y "." como separador de miles
//
// Estrategia: anclar en los dos "$" al final de la línea.
// La descripción puede contener números ("500 MG", "30 COMP") pero el "$"
// permite identificar exactamente dónde terminan Cantidad y U/E.
// ─────────────────────────────────────────────────────────────────────────────
function parseComprobantePedidoChileno(fullText: string): RawLine[] | null {
  // Detección de formato: debe tener encabezado con U/E, PvP y precios con $
  if (!/\bU\/E\b/i.test(fullText) || !/\bPvP\b/i.test(fullText)) return null;

  const lines = fullText.split('\n').map((l) => l.trim()).filter(Boolean);
  const results: RawLine[] = [];

  // Líneas de encabezado, totales o metadata que deben saltarse
  const skipRe =
    /^(cod[íi]go|descripci[oó]n|detalle\s+de|sub[\s-]?total|pedido\s+n|nombre|rut|giro|status|forma\s+de\s+pago|direcci[oó]n\s+de|fecha|orden\s+de\s+compra|comprobante|u\/e|pvp)/i;

  // Regex principal:
  //   ^CODE  — código alfanumérico (3-15 chars, puede terminar en letra)
  //   (.+?)  — descripción (lazy: para en cuanto el resto de la regex encaja)
  //   (\d+)  — Cantidad
  //   (\d+)  — U/E (se captura pero descarta)
  //   \$ NUM — PvP  (el $ es el ancla que evita confusión con números de descripción)
  //   \$ NUM — Total
  const lineRe =
    /^([A-Z0-9]{3,15})\s+(.+?)\s+(\d+)\s+(\d+)\s+\$\s*([\d.]+)\s+\$\s*([\d.]+)\s*$/i;

  const parseCLP = (s: string) => parseInt(s.replace(/\./g, ''), 10);

  for (const line of lines) {
    if (skipRe.test(line)) continue;

    const match = line.match(lineRe);
    if (!match) continue;

    const [, code, description, cantidadStr, , pvpStr, totalStr] = match;

    const quantity  = parseInt(cantidadStr, 10);
    const unit_cost = parseCLP(pvpStr);
    const subtotal  = parseCLP(totalStr);

    // Filtros de cordura
    if (!quantity || !unit_cost || quantity <= 0 || unit_cost < 50) continue;

    // Verificar que total ≈ cantidad × PvP (tolerancia 20% por descuentos o redondeos)
    const expected = quantity * unit_cost;
    if (subtotal > 0 && expected > 0 && Math.abs(subtotal - expected) / expected > 0.20) continue;

    results.push({
      supplier_product_code: code.toUpperCase(),
      product_name_invoice:  description.trim(),
      quantity,
      unit_cost,
      subtotal: subtotal > 0 ? subtotal : expected,
    });
  }

  return results.length > 0 ? results : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Parser 2: Heurístico genérico — fallback para otros formatos de factura.
// Busca líneas con al menos 2 números y toma los últimos como precio/subtotal.
// ─────────────────────────────────────────────────────────────────────────────
function parseGenericInvoice(fullText: string): RawLine[] {
  const lines = fullText.split('\n').map((l) => l.trim()).filter(Boolean);
  const results: RawLine[] = [];
  const numberPattern = /[\d.,]+/g;

  for (const line of lines) {
    const numbers = line.match(numberPattern);
    if (!numbers || numbers.length < 2) continue;

    const parsedNumbers = numbers
      .map((n) => parseFloat(n.replace(/\./g, '').replace(',', '.')))
      .filter((n) => !isNaN(n) && n > 0);

    if (parsedNumbers.length < 2) continue;

    const subtotal  = parsedNumbers.length >= 3 ? parsedNumbers[parsedNumbers.length - 1] : null;
    const unit_cost = parsedNumbers[parsedNumbers.length - (subtotal !== null ? 2 : 1)];
    const quantity  = parsedNumbers.length >= 3 ? parsedNumbers[parsedNumbers.length - 3] : parsedNumbers[0];

    if (unit_cost < 50) continue;

    const textPart = line.replace(/[\d.,]+/g, ' ').replace(/\s+/g, ' ').trim();
    const codeMatch = line.match(/^([A-Z0-9]{3,15})\s/i);
    const supplier_product_code = codeMatch ? codeMatch[1] : null;
    const product_name_invoice  = textPart || line.substring(0, 60);
    if (!product_name_invoice || product_name_invoice.length < 3) continue;

    results.push({
      supplier_product_code,
      product_name_invoice,
      quantity:  Math.round(quantity),
      unit_cost: Math.round(unit_cost),
      subtotal:  subtotal !== null ? Math.round(subtotal) : Math.round(quantity * unit_cost),
    });
  }

  return results;
}

// Intenta el parser específico primero; si no aplica, usa el genérico.
function parseInvoiceLines(fullText: string): RawLine[] {
  return parseComprobantePedidoChileno(fullText) ?? parseGenericInvoice(fullText);
}

async function ocrImage(apiKey: string, base64Content: string): Promise<string> {
  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{ image: { content: base64Content }, features: [{ type: 'TEXT_DETECTION', maxResults: 1 }] }],
      }),
    }
  );
  if (!res.ok) throw new Error(`Vision API error: ${await res.text()}`);
  const data = await res.json();
  return data.responses?.[0]?.fullTextAnnotation?.text ?? '';
}

async function ocrPdf(apiKey: string, base64Content: string): Promise<string> {
  const res = await fetch(
    `https://vision.googleapis.com/v1/files:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          inputConfig: { content: base64Content, mimeType: 'application/pdf' },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
          pages: [1, 2, 3, 4, 5], // first 5 pages
        }],
      }),
    }
  );
  if (!res.ok) throw new Error(`Vision API error: ${await res.text()}`);
  const data = await res.json();
  const pages = data.responses?.[0]?.responses ?? [];
  return pages.map((p: { fullTextAnnotation?: { text: string } }) => p.fullTextAnnotation?.text ?? '').join('\n');
}

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const body = await request.json();
    const { image_base64, pdf_base64, supplier_id } = body;

    if (!image_base64 && !pdf_base64) return errorResponse('image_base64 or pdf_base64 is required', 400);

    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    if (!apiKey) return errorResponse('Vision API not configured', 500);

    const fullText = pdf_base64
      ? await ocrPdf(apiKey, pdf_base64)
      : await ocrImage(apiKey, image_base64);

    if (!fullText) {
      return NextResponse.json({ lines: [], ocr_raw: '' });
    }

    // Parsear líneas
    const rawLines = parseInvoiceLines(fullText);

    // Para cada línea, buscar en supplier_product_mappings si supplier_id fue provisto
    const db = await getDb();
    const lines: ScannedLine[] = await Promise.all(
      rawLines.map(async (line) => {
        if (!supplier_id || !line.supplier_product_code) {
          return { ...line, product_id: null, product_name_matched: null };
        }

        const mapping = await db.supplier_product_mappings.findUnique({
          where: {
            supplier_id_supplier_code: {
              supplier_id,
              supplier_code: line.supplier_product_code,
            },
          },
          include: { products: { select: { id: true, name: true } } },
        });

        return {
          ...line,
          product_id: mapping?.products.id ?? null,
          product_name_matched: mapping?.products.name ?? null,
        };
      })
    );

    return NextResponse.json({ lines, ocr_raw: fullText });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
