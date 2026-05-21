import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';
import { parseInvoice, isCreditNote } from '@/lib/invoice-parser';
import type { InvoiceLine, InvoiceHeader, InvoiceFormat } from '@/lib/invoice-parser';
import { preTokenize, fuzzyMatch } from '@/lib/invoice-parser/fuzzy-match';

export type MatchSource = 'mapping' | 'fuzzy' | null;

export interface ScannedLine extends InvoiceLine {
  product_id: string | null;
  product_name_matched: string | null;
  /** Origen del auto-match: 'mapping' (supplier_code), 'fuzzy' (nombre token-match), o null. */
  match_source: MatchSource;
  /** Score fuzzy [0..1] cuando match_source==='fuzzy'. */
  match_score?: number;
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

async function extractPdfText(base64Content: string): Promise<string> {
  // pdf-parse v2 — texto directo desde PDF nativo (facturas SII son siempre digitales).
  // Mucho más rápido y barato que Vision OCR; fallback si layout es escaneado.
  const { PDFParse } = await import('pdf-parse');
  const buf = Buffer.from(base64Content, 'base64');
  const parser = new PDFParse({ data: buf });
  const r = await parser.getText();
  return r.text || '';
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
  text_source: 'pdf' | 'vision';
  is_credit_note: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const body = await request.json();
    const { image_base64, pdf_base64, supplier_id: providedSupplierId } = body;

    if (!image_base64 && !pdf_base64) return errorResponse('image_base64 or pdf_base64 is required', 400);

    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;

    // Estrategia: PDF nativo (gratis, instantáneo) → fallback a Vision OCR (escaneados/imágenes).
    let fullText = '';
    let textSource: 'pdf' | 'vision' = 'vision';
    if (pdf_base64) {
      try {
        fullText = await extractPdfText(pdf_base64);
        textSource = 'pdf';
      } catch {
        fullText = '';
      }
      // Si pdf-parse devolvió poco texto (PDF escaneado), recurrir a Vision
      if (fullText.length < 100) {
        if (!apiKey) return errorResponse('Vision API not configured (PDF escaneado o sin texto)', 500);
        fullText = await ocrPdf(apiKey, pdf_base64);
        textSource = 'vision';
      }
    } else {
      if (!apiKey) return errorResponse('Vision API not configured', 500);
      fullText = await ocrImage(apiKey, image_base64);
      textSource = 'vision';
    }

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
        text_source: textSource,
        is_credit_note: false,
      });
    }

    // Rechazar Nota de Crédito explícitamente (no afecta stock)
    const creditNote = isCreditNote(fullText);
    const parsed = parseInvoice(fullText);

    // Telemetría server-side cuando el parser no detecta líneas: imprimir muestra
    // del OCR raw para diagnosticar regex faltantes (ver en Vercel Functions logs).
    if (parsed.lines.length === 0 && !creditNote) {
      console.warn('[scan] lines=0 — diagnostico parser', {
        format: parsed.format,
        text_source: textSource,
        text_length: fullText.length,
        header_invoice_number: parsed.header.invoice_number,
        ocr_first_1200: fullText.slice(0, 1200),
      });
    }

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
    // Fallback: match by default_invoice_format (útil cuando el PDF no imprime RUT del proveedor, p.ej. Global)
    if (!resolvedSupplierId && parsed.format !== 'generic') {
      const supplier = await db.suppliers.findFirst({
        where: { default_invoice_format: parsed.format, active: true },
        select: { id: true },
      });
      resolvedSupplierId = supplier?.id ?? null;
    }

    // FASE 1 — Resolver mapping supplier_code → product_id (preciso, instantáneo)
    const linesAfterMapping: ScannedLine[] = await Promise.all(
      parsed.lines.map(async (line) => {
        if (!resolvedSupplierId || !line.supplier_product_code) {
          return { ...line, product_id: null, product_name_matched: null, match_source: null };
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
        if (!mapping) {
          return { ...line, product_id: null, product_name_matched: null, match_source: null };
        }
        return {
          ...line,
          product_id: mapping.products.id,
          product_name_matched: mapping.products.name,
          match_source: 'mapping' as MatchSource,
        };
      })
    );

    // FASE 2 — Fuzzy match por nombre para líneas todavía sin product_id.
    // Crítico para Mediven (no entrega supplier_code → sin esto, 100% manual).
    const needsFuzzy = linesAfterMapping.some((l) => !l.product_id);
    let lines: ScannedLine[] = linesAfterMapping;
    if (needsFuzzy) {
      const productTokens = preTokenize(
        await db.products.findMany({
          where: { active: true },
          select: { id: true, name: true, stock: true },
        })
      );
      lines = linesAfterMapping.map((l) => {
        if (l.product_id) return l;
        const candidates = fuzzyMatch(l.product_name_invoice, productTokens, 1);
        const top = candidates[0];
        if (!top || !top.confident) return l;
        return {
          ...l,
          product_id: top.product_id,
          product_name_matched: top.product_name,
          match_source: 'fuzzy' as MatchSource,
          match_score: top.score,
        };
      });
    }

    return NextResponse.json<ScanResponse>({
      format: parsed.format,
      header: parsed.header,
      lines,
      ocr_raw: fullText,
      detected_supplier_id: resolvedSupplierId,
      text_source: textSource,
      is_credit_note: creditNote,
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
