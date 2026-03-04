import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface LowStockProduct {
  name: string;
  stock: number;
}

export async function sendLowStockAlert(
  toEmail: string,
  products: LowStockProduct[],
  threshold: number
) {
  if (!process.env.RESEND_API_KEY || !toEmail || products.length === 0) return;

  const productList = products
    .map(p => `- ${p.name}: ${p.stock} unidades`)
    .join('\n');

  await resend.emails.send({
    from: 'Tu Farmacia Admin <onboarding@resend.dev>',
    to: toEmail,
    subject: `⚠️ Alerta: ${products.length} producto(s) con stock crítico (umbral: ${threshold})`,
    text: [
      `Los siguientes productos tienen stock bajo el umbral configurado (${threshold} unidades):`,
      '',
      productList,
      '',
      'Ingresa al panel admin para gestionar el stock:',
      `${process.env.NEXT_PUBLIC_SITE_URL || 'https://tu-farmacia.cl'}/admin/productos`,
    ].join('\n'),
  });
}
