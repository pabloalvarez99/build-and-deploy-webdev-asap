import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';
import { parseInvoice } from '@/lib/invoice-parser';
import type { InvoiceLine, InvoiceHeader, InvoiceFormat } from '@/lib/invoice-parser';

export interface ScannedLine extends InvoiceLine {
  product_id: string | null;
  product_name_matched: string | null;
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
          pages: [1, 2, 3, 4, 5],
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

export interface ScanResponse {
  format: InvoiceFormat;
  header: InvoiceHeader;
  lines: ScannedLine[];
  ocr_raw: string;
  detected_supplier_id: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const body = await request.json();
    const { image_base64, pdf_base64, supplier_id: providedSupplierId } = body;

    if (!image_base64 && !pdf_base64) return errorResponse('image_base64 or pdf_base64 is required', 400);

    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    if (!apiKey) return errorResponse('Vision API not configured', 500);

    const fullText = pdf_base64
      ? await ocrPdf(apiKey, pdf_base64)
      : await ocrImage(apiKey, image_base64);

    if (!fullText) {
      return NextResponse.json<ScanResponse>({
        format: 'generic',
        header: {
          invoice_number: null, supplier_rut: null, supplier_name: null,
          invoice_date: null, due_date: null, po_reference: null,
          subtotal_net: null, tax_amount: null, total: null,
        },
        lines: [],
        ocr_raw: '',
        detected_supplier_id: null,
      });
    }

    const parsed = parseInvoice(fullText);
    const db = await getDb();

    // Auto-detectar supplier por RUT si no se pasó uno explícito
    let resolvedSupplierId: string | null = providedSupplierId ?? null;
    if (!resolvedSupplierId && parsed.header.supplier_rut) {
      // Buscar por RUT exacto o con/sin puntos
      const rutDigits = parsed.header.supplier_rut.replace(/[^\dkK]/gi, '');
      const supplier = await db.suppliers.findFirst({
        where: {
          OR: [
            { rut: parsed.header.supplier_rut },
            { rut: { contains: rutDigits.slice(0, -1) } }, // sin DV por flexibilidad
          ],
          active: true,
        },
        select: { id: true },
      });
      resolvedSupplierId = supplier?.id ?? null;
    }

    // Resolver mapping supplier_code → product_id por cada línea (cuando aplique)
    const lines: ScannedLine[] = await Promise.all(
      parsed.lines.map(async (line) => {
        if (!resolvedSupplierId || !line.supplier_product_code) {
          return { ...line, product_id: null, product_name_matched: null };
        }
        const mapping = await db.supplier_product_mappings.findUnique({
          where: {
            supplier_id_supplier_code: {
              supplier_id: resolvedSupplierId,
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

    return NextResponse.json<ScanResponse>({
      format: parsed.format,
      header: parsed.header,
      lines,
      ocr_raw: fullText,
      detected_supplier_id: resolvedSupplierId,
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
