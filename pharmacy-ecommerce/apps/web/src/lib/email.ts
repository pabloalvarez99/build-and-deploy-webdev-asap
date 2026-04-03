import { Resend } from 'resend';

const FROM = 'Tu Farmacia <onboarding@resend.dev>';
const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'https://tu-farmacia.cl';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
}

interface LowStockProduct {
  name: string;
  stock: number;
}

export interface OrderEmailItem {
  product_name: string;
  quantity: number;
  price_at_purchase: string;
}

function formatCLP(amount: number | string) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(Number(amount));
}

function itemsTable(items: OrderEmailItem[]) {
  return items.map(i =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#334155;">${i.product_name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#334155;text-align:center;">×${i.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#0f172a;text-align:right;font-weight:600;">${formatCLP(Number(i.price_at_purchase) * i.quantity)}</td>
    </tr>`
  ).join('');
}

function emailWrapper(content: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td>
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="background:#059669;padding:28px 32px;">
          <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Tu Farmacia</p>
          <p style="margin:4px 0 0;color:#a7f3d0;font-size:14px;">Coquimbo, Chile</p>
        </td></tr>
        <tr><td style="padding:32px;">${content}</td></tr>
        <tr><td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">Tu Farmacia · Coquimbo, Chile · <a href="${BASE}" style="color:#059669;">tu-farmacia.cl</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendWebpayConfirmation(opts: {
  to: string;
  name: string;
  orderId: string;
  total: number;
  items: OrderEmailItem[];
}) {
  if (!process.env.RESEND_API_KEY) return;
  const shortId = opts.orderId.substring(0, 8).toUpperCase();
  const html = emailWrapper(`
    <p style="margin:0 0 8px;font-size:28px;">✅</p>
    <h1 style="margin:0 0 8px;font-size:22px;color:#0f172a;">¡Pago confirmado!</h1>
    <p style="margin:0 0 24px;color:#64748b;">Hola <strong>${opts.name}</strong>, tu compra fue procesada exitosamente.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;margin-bottom:24px;overflow:hidden;">
      <thead><tr style="background:#f8fafc;">
        <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Producto</th>
        <th style="padding:10px 12px;text-align:center;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Cant.</th>
        <th style="padding:10px 12px;text-align:right;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Subtotal</th>
      </tr></thead>
      <tbody>${itemsTable(opts.items)}</tbody>
      <tfoot><tr style="background:#f0fdf4;">
        <td colspan="2" style="padding:12px;font-weight:700;color:#0f172a;">Total pagado</td>
        <td style="padding:12px;text-align:right;font-weight:800;font-size:18px;color:#059669;">${formatCLP(opts.total)}</td>
      </tr></tfoot>
    </table>

    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-weight:700;color:#1e3a8a;">¿Qué sigue?</p>
      <ol style="margin:0;padding-left:20px;color:#1e40af;line-height:1.8;">
        <li>Estamos preparando tu pedido</li>
        <li>Te avisaremos cuando esté listo para retirar</li>
        <li>Retira en nuestra farmacia con tu número de orden</li>
      </ol>
    </div>

    <div style="background:#f8fafc;border-radius:8px;padding:12px;margin-bottom:24px;">
      <p style="margin:0;font-size:12px;color:#94a3b8;">N° de orden</p>
      <p style="margin:4px 0 0;font-family:monospace;font-size:14px;color:#334155;">${shortId}...</p>
    </div>

    <a href="${BASE}/mis-pedidos" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Ver mis pedidos →</a>
  `);

  await getResend().emails.send({
    from: FROM,
    to: opts.to,
    subject: `✅ Pago confirmado — Pedido #${shortId} · Tu Farmacia`,
    html,
  });
}

export async function sendPickupReservationEmail(opts: {
  to: string;
  name: string;
  orderId: string;
  pickupCode: string;
  total: number;
  expiresAt: string;
  items: OrderEmailItem[];
}) {
  if (!process.env.RESEND_API_KEY) return;
  const shortId = opts.orderId.substring(0, 8).toUpperCase();
  const expiresFormatted = new Date(opts.expiresAt).toLocaleDateString('es-CL', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  });

  const html = emailWrapper(`
    <p style="margin:0 0 8px;font-size:28px;">🏪</p>
    <h1 style="margin:0 0 8px;font-size:22px;color:#0f172a;">Reserva confirmada</h1>
    <p style="margin:0 0 24px;color:#64748b;">Hola <strong>${opts.name}</strong>, tu reserva fue creada exitosamente.</p>

    <div style="text-align:center;background:#f0fdf4;border:2px solid #86efac;border-radius:16px;padding:24px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#166534;text-transform:uppercase;letter-spacing:0.1em;">Código de retiro</p>
      <p style="margin:0;font-family:monospace;font-size:40px;font-weight:900;letter-spacing:0.3em;color:#166534;">${opts.pickupCode}</p>
      <p style="margin:8px 0 0;font-size:12px;color:#4ade80;">Válido hasta: ${expiresFormatted}</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;margin-bottom:24px;overflow:hidden;">
      <thead><tr style="background:#f8fafc;">
        <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Producto</th>
        <th style="padding:10px 12px;text-align:center;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Cant.</th>
        <th style="padding:10px 12px;text-align:right;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Subtotal</th>
      </tr></thead>
      <tbody>${itemsTable(opts.items)}</tbody>
      <tfoot><tr style="background:#fffbeb;">
        <td colspan="2" style="padding:12px;font-weight:700;color:#0f172a;">Total a pagar en tienda</td>
        <td style="padding:12px;text-align:right;font-weight:800;font-size:18px;color:#d97706;">${formatCLP(opts.total)}</td>
      </tr></tfoot>
    </table>

    <div style="background:#fefce8;border:1px solid #fde68a;border-radius:12px;padding:16px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-weight:700;color:#713f12;">Instrucciones de retiro</p>
      <ol style="margin:0;padding-left:20px;color:#92400e;line-height:1.8;">
        <li>Espera la confirmación de la farmacia</li>
        <li>Acércate dentro de las próximas 24 horas</li>
        <li>Muestra tu código <strong>${opts.pickupCode}</strong> al personal</li>
        <li>Paga en tienda y retira tus productos</li>
      </ol>
    </div>
  `);

  await getResend().emails.send({
    from: FROM,
    to: opts.to,
    subject: `🏪 Reserva confirmada — Código ${opts.pickupCode} · Tu Farmacia`,
    html,
  });
}

export async function sendPickupApprovalEmail(opts: {
  to: string;
  name: string;
  orderId: string;
  pickupCode: string;
  total: number;
  items: OrderEmailItem[];
}) {
  if (!process.env.RESEND_API_KEY) return;
  const shortId = opts.orderId.substring(0, 8).toUpperCase();

  const html = emailWrapper(`
    <p style="margin:0 0 8px;font-size:28px;">✅</p>
    <h1 style="margin:0 0 8px;font-size:22px;color:#0f172a;">¡Tu reserva fue aprobada!</h1>
    <p style="margin:0 0 24px;color:#64748b;">Hola <strong>${opts.name}</strong>, tu reserva ha sido aprobada. Ya puedes venir a retirar tu pedido.</p>

    <div style="text-align:center;background:#f0fdf4;border:2px solid #86efac;border-radius:16px;padding:24px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#166534;text-transform:uppercase;letter-spacing:0.1em;">Código de retiro</p>
      <p style="margin:0;font-family:monospace;font-size:40px;font-weight:900;letter-spacing:0.3em;color:#166534;">${opts.pickupCode}</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;margin-bottom:24px;overflow:hidden;">
      <thead><tr style="background:#f8fafc;">
        <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Producto</th>
        <th style="padding:10px 12px;text-align:center;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Cant.</th>
        <th style="padding:10px 12px;text-align:right;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Subtotal</th>
      </tr></thead>
      <tbody>${itemsTable(opts.items)}</tbody>
      <tfoot><tr style="background:#fffbeb;">
        <td colspan="2" style="padding:12px;font-weight:700;color:#0f172a;">Total a pagar en tienda</td>
        <td style="padding:12px;text-align:right;font-weight:800;font-size:18px;color:#d97706;">${formatCLP(opts.total)}</td>
      </tr></tfoot>
    </table>

    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:16px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-weight:700;color:#166534;">¿Qué sigue?</p>
      <ol style="margin:0;padding-left:20px;color:#166534;line-height:1.8;">
        <li>Acércate a nuestra farmacia cuando puedas</li>
        <li>Muestra tu código <strong>${opts.pickupCode}</strong> al personal</li>
        <li>Paga ${formatCLP(opts.total)} en tienda y retira tus productos</li>
      </ol>
    </div>

    <div style="background:#f8fafc;border-radius:8px;padding:12px;margin-bottom:24px;">
      <p style="margin:0;font-size:12px;color:#94a3b8;">N° de orden</p>
      <p style="margin:4px 0 0;font-family:monospace;font-size:14px;color:#334155;">${shortId}...</p>
    </div>

    <a href="${BASE}/mis-pedidos" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Ver mis pedidos →</a>
  `);

  await getResend().emails.send({
    from: FROM,
    to: opts.to,
    subject: `✅ Reserva aprobada — Código ${opts.pickupCode} · Tu Farmacia`,
    html,
  });
}

export async function sendPickupRejectionEmail(opts: {
  to: string;
  name: string;
  orderId: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const shortId = opts.orderId.substring(0, 8).toUpperCase();

  const html = emailWrapper(`
    <p style="margin:0 0 8px;font-size:28px;">❌</p>
    <h1 style="margin:0 0 8px;font-size:22px;color:#0f172a;">Tu reserva no pudo ser aprobada</h1>
    <p style="margin:0 0 24px;color:#64748b;">Hola <strong>${opts.name}</strong>, lamentamos informarte que tu reserva no pudo ser procesada en esta ocasión.</p>

    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;color:#991b1b;">No se realizó ningún cargo ni se descontó stock. Puedes volver a intentarlo o comunicarte con nosotros.</p>
    </div>

    <div style="background:#f8fafc;border-radius:8px;padding:12px;margin-bottom:24px;">
      <p style="margin:0;font-size:12px;color:#94a3b8;">N° de orden</p>
      <p style="margin:4px 0 0;font-family:monospace;font-size:14px;color:#334155;">${shortId}...</p>
    </div>

    <p style="margin:0 0 16px;color:#64748b;">Si tienes dudas, contáctanos por WhatsApp o visítanos en nuestra farmacia en Coquimbo.</p>

    <a href="${BASE}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Volver a la tienda →</a>
  `);

  await getResend().emails.send({
    from: FROM,
    to: opts.to,
    subject: `❌ Reserva cancelada — Pedido #${shortId} · Tu Farmacia`,
    html,
  });
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

  await getResend().emails.send({
    from: 'Tu Farmacia Admin <onboarding@resend.dev>',
    to: toEmail,
    subject: `⚠️ Alerta: ${products.length} producto(s) con stock crítico (umbral: ${threshold})`,
    text: [
      `Los siguientes productos tienen stock bajo el umbral configurado (${threshold} unidades):`,
      '',
      productList,
      '',
      'Ingresa al panel admin para gestionar el stock:',
      `${BASE}/admin/productos`,
    ].join('\n'),
  });
}
