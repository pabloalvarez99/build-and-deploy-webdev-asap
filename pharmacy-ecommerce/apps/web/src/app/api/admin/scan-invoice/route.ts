import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';
import { getStorageBucket } from '@/lib/firebase/admin';
import { getParser } from '@/lib/invoice-parser/registry';

export async function POST(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return errorResponse('No autorizado', 401);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse('Formato de solicitud inválido', 400);
  }

  const imageFile = formData.get('image') as File | null;
  if (!imageFile) return errorResponse('No se recibió imagen', 400);

  const parserName = (formData.get('parser') as string) || 'heuristic';

  // Convert image to buffer + base64 for Vision API
  const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
  const base64Image = imageBuffer.toString('base64');
  const mimeType = imageFile.type || 'image/jpeg';

  // Call Google Cloud Vision API
  const visionApiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!visionApiKey) return errorResponse('Vision API no configurada', 500);

  let ocrText = '';
  try {
    const visionRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64Image },
              features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
              imageContext: { languageHints: ['es'] },
            },
          ],
        }),
      }
    );

    if (!visionRes.ok) {
      const err = await visionRes.text();
      console.error('Vision API error:', err);
      return errorResponse('Error al procesar la imagen con OCR', 502);
    }

    const visionData = await visionRes.json();
    ocrText =
      visionData.responses?.[0]?.fullTextAnnotation?.text ||
      visionData.responses?.[0]?.textAnnotations?.[0]?.description ||
      '';
  } catch (err) {
    console.error('Vision API fetch failed:', err);
    return errorResponse('Error de conexión con OCR', 502);
  }

  // Upload image to Firebase Storage (audit trail — non-blocking)
  let invoiceImageUrl = '';
  try {
    const ext = mimeType.split('/')[1] || 'jpg';
    const timestamp = Date.now();
    const filePath = `invoices/${admin.uid}/${timestamp}.${ext}`;
    const bucket = getStorageBucket();
    const file = bucket.file(filePath);

    await file.save(imageBuffer, {
      metadata: { contentType: mimeType },
      public: true,
    });

    invoiceImageUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
  } catch (err) {
    // Storage failure is non-critical — log and continue
    console.error('Firebase Storage upload failed:', err);
  }

  // Parse OCR text
  const parser = getParser(parserName);
  const extracted = parser.parse(ocrText);

  return NextResponse.json({ extracted, ocrText, invoiceImageUrl });
}
