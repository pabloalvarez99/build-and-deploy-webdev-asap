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

// Parser heurístico para facturas de proveedores chilenos.
// Las facturas varían entre proveedores, así que extraemos líneas de texto
// y buscamos patrones: código | descripción | cantidad | precio unitario | subtotal
function parseInvoiceLines(fullText: string): Omit<ScannedLine, 'product_id' | 'product_name_matched'>[] {
  const lines = fullText.split('\n').map((l) => l.trim()).filter(Boolean);
  const results: Omit<ScannedLine, 'product_id' | 'product_name_matched'>[] = [];

  // Patrón: línea con al menos 2 números que parezcan cantidad y precio
  // Intentamos detectar: [código?] [descripción] [cantidad] [precio_unit] [subtotal?]
  const numberPattern = /[\d.,]+/g;

  for (const line of lines) {
    const numbers = line.match(numberPattern);
    if (!numbers || numbers.length < 2) continue;

    // Filtrar números válidos (al menos uno > 1 para precio)
    const parsedNumbers = numbers
      .map((n) => parseFloat(n.replace(/\./g, '').replace(',', '.')))
      .filter((n) => !isNaN(n) && n > 0);

    if (parsedNumbers.length < 2) continue;

    // Heurística: último número grande = subtotal, penúltimo = precio unit, antes = cantidad
    // Si hay 3+ números: qty = parsedNumbers[parsedNumbers.length - 3], unit = ...-2, sub = ...-1
    // Si hay 2 números: qty = parsedNumbers[0], unit = parsedNumbers[1]
    const subtotal = parsedNumbers.length >= 3 ? parsedNumbers[parsedNumbers.length - 1] : null;
    const unit_cost = parsedNumbers[parsedNumbers.length - (subtotal !== null ? 2 : 1)];
    const quantity = parsedNumbers.length >= 3
      ? parsedNumbers[parsedNumbers.length - 3]
      : parsedNumbers[0];

    // Ignorar líneas donde los "números" son todos pequeños (probablemente fechas, códigos postales, etc.)
    if (unit_cost < 50) continue; // precios en CLP siempre > 50

    // Extraer la parte de texto (descripción) — todo lo que no sean números al inicio
    const textPart = line
      .replace(/[\d.,]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Intentar extraer código de producto: secuencia alfanumérica corta al inicio de la línea
    const codeMatch = line.match(/^([A-Z0-9]{3,15})\s/i);
    const supplier_product_code = codeMatch ? codeMatch[1] : null;

    const product_name_invoice = textPart || line.substring(0, 60);

    if (!product_name_invoice || product_name_invoice.length < 3) continue;

    results.push({
      supplier_product_code,
      product_name_invoice,
      quantity: Math.round(quantity),
      unit_cost: Math.round(unit_cost),
      subtotal: subtotal !== null ? Math.round(subtotal) : Math.round(quantity * unit_cost),
    });
  }

  return results;
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
