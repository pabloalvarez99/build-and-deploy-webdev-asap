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

export async function sendDailyReport(opts: {
  to: string;
  date: string; // e.g. "lunes 14 de abril"
  revenue: number;
  orders: number;
  posRevenue: number;
  posOrders: number;
  onlineRevenue: number;
  onlineOrders: number;
  avgTicket: number;
  topProducts: { name: string; units: number; revenue: number }[];
  lowStock: { name: string; stock: number }[];
  threshold: number;
}) {
  if (!process.env.RESEND_API_KEY || !opts.to) return;

  const topRows = opts.topProducts.map((p, i) =>
    `<tr style="background:${i % 2 === 0 ? '#f8fafc' : '#ffffff'};">
      <td style="padding:8px 12px;color:#334155;">${p.name}</td>
      <td style="padding:8px 12px;text-align:center;color:#334155;">${p.units}</td>
      <td style="padding:8px 12px;text-align:right;font-weight:600;color:#0f172a;">${formatCLP(p.revenue)}</td>
    </tr>`
  ).join('');

  const lowStockRows = opts.lowStock.length === 0
    ? `<p style="margin:0;color:#166534;">Sin productos bajo el umbral (${opts.threshold} uds). ✅</p>`
    : opts.lowStock.slice(0, 10).map(p =>
        `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #fde68a;">
          <span style="color:#92400e;">${p.name}</span>
          <span style="font-weight:700;color:#b45309;">${p.stock} ud${p.stock !== 1 ? 's' : ''}.</span>
        </div>`
      ).join('');

  const html = emailWrapper(`
    <h1 style="margin:0 0 4px;font-size:20px;color:#0f172a;">Resumen diario</h1>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;">${opts.date}</p>

    <!-- KPI row -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td width="50%" style="padding-right:8px;">
          <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:16px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#166534;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Ventas totales</p>
            <p style="margin:6px 0 0;font-size:26px;font-weight:800;color:#059669;">${formatCLP(opts.revenue)}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#4ade80;">${opts.orders} orden${opts.orders !== 1 ? 'es' : ''}</p>
          </div>
        </td>
        <td width="50%" style="padding-left:8px;">
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#1e3a8a;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Ticket promedio</p>
            <p style="margin:6px 0 0;font-size:26px;font-weight:800;color:#2563eb;">${formatCLP(opts.avgTicket)}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#93c5fd;">&nbsp;</p>
          </div>
        </td>
      </tr>
    </table>

    <!-- Channel split -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;margin-bottom:24px;overflow:hidden;">
      <thead><tr style="background:#f8fafc;">
        <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;">Canal</th>
        <th style="padding:10px 12px;text-align:center;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;">Órdenes</th>
        <th style="padding:10px 12px;text-align:right;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;">Ventas</th>
      </tr></thead>
      <tbody>
        <tr><td style="padding:8px 12px;color:#334155;">POS (presencial)</td><td style="padding:8px 12px;text-align:center;">${opts.posOrders}</td><td style="padding:8px 12px;text-align:right;font-weight:600;">${formatCLP(opts.posRevenue)}</td></tr>
        <tr style="background:#f8fafc;"><td style="padding:8px 12px;color:#334155;">Online (web)</td><td style="padding:8px 12px;text-align:center;">${opts.onlineOrders}</td><td style="padding:8px 12px;text-align:right;font-weight:600;">${formatCLP(opts.onlineRevenue)}</td></tr>
      </tbody>
    </table>

    ${opts.topProducts.length > 0 ? `
    <!-- Top products -->
    <h2 style="margin:0 0 12px;font-size:16px;color:#0f172a;">Top productos del día</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;margin-bottom:24px;overflow:hidden;">
      <thead><tr style="background:#f8fafc;">
        <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;">Producto</th>
        <th style="padding:10px 12px;text-align:center;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;">Uds.</th>
        <th style="padding:10px 12px;text-align:right;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;">Ventas</th>
      </tr></thead>
      <tbody>${topRows}</tbody>
    </table>` : ''}

    <!-- Low stock -->
    <h2 style="margin:0 0 12px;font-size:16px;color:#0f172a;">Stock crítico</h2>
    <div style="background:${opts.lowStock.length === 0 ? '#f0fdf4;border:1px solid #86efac' : '#fffbeb;border:1px solid #fde68a'};border-radius:12px;padding:16px;margin-bottom:24px;">
      ${lowStockRows}
    </div>

    <a href="${BASE}/admin" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Ir al panel admin →</a>
  `);

  await getResend().emails.send({
    from: 'Tu Farmacia Admin <onboarding@resend.dev>',
    to: opts.to,
    subject: `📊 Resumen del día — ${opts.date} · Tu Farmacia`,
    html,
  });
}

export interface DailySummaryData {
  to: string;
  date: string;
  ventas_hoy: number;
  ordenes_hoy: number;
  delta_ventas_pct: number | null;
  margen_bruto: number | null;
  meta_diaria: number | null;
  pct_meta: number | null;
  diferencia_caja: number | null;
  top_productos: { name: string; units: number; revenue: number }[];
  alertas: {
    reservas_por_expirar: number;
    por_vencer_7d: number;
    stock_cero: number;
    faltas_con_stock: number;
  };
}

export async function sendDailySummary(data: DailySummaryData) {
  if (!process.env.RESEND_API_KEY || !data.to) return;
  const resend = getResend();

  const fmtCLP = (n: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(n);

  const deltaHtml = data.delta_ventas_pct !== null
    ? ` <span style="color:${data.delta_ventas_pct >= 0 ? '#059669' : '#dc2626'};font-size:13px;">${data.delta_ventas_pct >= 0 ? '▲' : '▼'} ${Math.abs(data.delta_ventas_pct)}% vs ayer</span>`
    : '';

  const topTable = data.top_productos.length > 0
    ? `<table width="100%" style="border-collapse:collapse;margin-top:8px;">
        <tr style="background:#f8fafc;">
          <th style="padding:6px 10px;text-align:left;font-size:12px;color:#64748b;">Producto</th>
          <th style="padding:6px 10px;text-align:center;font-size:12px;color:#64748b;">Uds.</th>
          <th style="padding:6px 10px;text-align:right;font-size:12px;color:#64748b;">Total</th>
        </tr>
        ${data.top_productos.map(p =>
          `<tr><td style="padding:6px 10px;font-size:13px;color:#334155;">${p.name}</td>
           <td style="padding:6px 10px;text-align:center;font-size:13px;">${p.units}</td>
           <td style="padding:6px 10px;text-align:right;font-size:13px;font-weight:600;">${fmtCLP(p.revenue)}</td></tr>`
        ).join('')}
       </table>`
    : '<p style="color:#94a3b8;font-size:13px;margin:0;">Sin ventas registradas.</p>';

  const alertLines = [
    data.alertas.reservas_por_expirar > 0 ? `⏰ ${data.alertas.reservas_por_expirar} reserva(s) por expirar` : null,
    data.alertas.por_vencer_7d > 0 ? `📦 ${data.alertas.por_vencer_7d} lote(s) vence(n) en 7 días` : null,
    data.alertas.stock_cero > 0 ? `🚫 ${data.alertas.stock_cero} producto(s) sin stock` : null,
    data.alertas.faltas_con_stock > 0 ? `📋 ${data.alertas.faltas_con_stock} falta(s) con stock disponible` : null,
  ].filter(Boolean).join('<br>');

  const html = emailWrapper(`
    <h2 style="color:#0f172a;font-size:20px;margin:0 0 4px;">Resumen del día</h2>
    <p style="color:#64748b;font-size:14px;margin:0 0 24px;">${data.date}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td width="50%" style="padding-right:8px;">
          <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:16px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#166534;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Ventas</p>
            <p style="margin:6px 0 2px;font-size:26px;font-weight:800;color:#059669;">${fmtCLP(data.ventas_hoy)}</p>
            <p style="margin:0;font-size:12px;color:#4ade80;">${data.ordenes_hoy} pedidos${deltaHtml}</p>
          </div>
        </td>
        <td width="50%" style="padding-left:8px;">
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;text-align:center;">
            ${data.margen_bruto !== null
              ? `<p style="margin:0;font-size:12px;color:#334155;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Margen bruto est.</p>
                 <p style="margin:6px 0 2px;font-size:26px;font-weight:800;color:#0f172a;">${fmtCLP(data.margen_bruto)}</p>
                 <p style="margin:0;font-size:12px;color:#94a3b8;">productos con costo cargado</p>`
              : `<p style="margin:0;font-size:13px;color:#94a3b8;padding-top:12px;">Sin datos de costo<br>Carga cost_price en productos</p>`}
          </div>
        </td>
      </tr>
    </table>

    ${data.meta_diaria ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:12px;margin-bottom:20px;">
      <p style="margin:0;font-size:13px;color:#92400e;font-weight:600;">Meta diaria: ${data.pct_meta ?? 0}% — ${fmtCLP(data.ventas_hoy)} / ${fmtCLP(data.meta_diaria)}</p>
      <div style="margin-top:8px;height:6px;background:#fde68a;border-radius:3px;overflow:hidden;">
        <div style="height:100%;width:${Math.min(data.pct_meta ?? 0, 100)}%;background:${(data.pct_meta ?? 0) >= 80 ? '#059669' : (data.pct_meta ?? 0) >= 50 ? '#d97706' : '#dc2626'};border-radius:3px;"></div>
      </div>
    </div>` : ''}

    ${data.diferencia_caja !== null ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px;margin-bottom:20px;">
      <p style="margin:0;font-size:13px;color:#334155;">Diferencia de caja: <strong style="color:${data.diferencia_caja === 0 ? '#059669' : Math.abs(data.diferencia_caja) < 1000 ? '#d97706' : '#dc2626'}">${fmtCLP(data.diferencia_caja)}</strong></p>
    </div>` : ''}

    <h3 style="font-size:14px;font-weight:600;color:#0f172a;margin:0 0 4px;">Top 5 productos</h3>
    ${topTable}

    ${alertLines ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:12px;margin-top:20px;">
      <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#991b1b;">Para mañana</p>
      <p style="margin:0;font-size:13px;color:#7f1d1d;line-height:1.8;">${alertLines}</p>
    </div>` : ''}

    <div style="margin-top:24px;text-align:center;">
      <a href="${BASE}/admin/operaciones" style="background:#059669;color:#fff;padding:10px 24px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;">Ver Operaciones →</a>
    </div>
  `);

  await resend.emails.send({
    from: FROM,
    to: data.to,
    subject: `📊 Resumen ${data.date} — ${fmtCLP(data.ventas_hoy)} · Tu Farmacia`,
    html,
  });
}

export async function sendExpressOrderEmail(opts: {
  supplierEmail: string;
  supplierName: string;
  pharmacyContact: string;
  items: { name: string; qty: number; unit_cost?: number | null }[];
  notes?: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const resend = getResend();

  const rows = opts.items.map(i =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#334155;">${i.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:center;font-weight:700;color:#d97706;">${i.qty}</td>
      ${i.unit_cost ? `<td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right;color:#64748b;">${new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',minimumFractionDigits:0}).format(i.unit_cost)}</td>` : '<td></td>'}
    </tr>`
  ).join('');

  const html = emailWrapper(`
    <h2 style="color:#0f172a;font-size:20px;margin:0 0 4px;">Pedido urgente de reposición</h2>
    <p style="color:#64748b;font-size:14px;margin:0 0 24px;">Tu Farmacia — Coquimbo, Chile</p>

    <p style="color:#334155;font-size:14px;margin:0 0 16px;">Estimado/a ${opts.supplierName},</p>
    <p style="color:#334155;font-size:14px;margin:0 0 20px;">
      Necesitamos los siguientes productos con carácter urgente. Por favor confirme disponibilidad y fecha estimada de entrega.
    </p>

    <table width="100%" style="border-collapse:collapse;margin-bottom:20px;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="padding:8px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;">Producto</th>
          <th style="padding:8px 12px;text-align:center;font-size:12px;color:#64748b;font-weight:600;">Cantidad</th>
          <th style="padding:8px 12px;text-align:right;font-size:12px;color:#64748b;font-weight:600;">P. referencia</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    ${opts.notes ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px;margin-bottom:20px;">
      <p style="margin:0;font-size:13px;color:#92400e;"><strong>Nota:</strong> ${opts.notes}</p>
    </div>` : ''}

    <p style="color:#334155;font-size:13px;margin:0 0 4px;">Contacto: <strong>${opts.pharmacyContact}</strong></p>
    <p style="color:#64748b;font-size:12px;margin:0;">Tu Farmacia · Coquimbo, Chile · <a href="${BASE}/admin" style="color:#059669;">tu-farmacia.cl</a></p>
  `);

  await resend.emails.send({
    from: FROM,
    to: opts.supplierEmail,
    subject: `⚡ Pedido urgente Tu Farmacia — ${opts.items.map(i => i.name).join(', ').slice(0, 60)}`,
    html,
  });
}

export async function sendNewOrderAlert(opts: {
  toEmail: string;
  orderId: string;
  customerName: string;
  total: number;
  paymentMethod: string;
  items: { product_name: string; quantity: number; price: number }[];
}) {
  if (!process.env.RESEND_API_KEY || !opts.toEmail) return;

  const itemsList = opts.items
    .map(i => `- ${i.product_name} x${i.quantity} — ${formatCLP(i.price * i.quantity)}`)
    .join('\n');

  await getResend().emails.send({
    from: 'Tu Farmacia Admin <onboarding@resend.dev>',
    to: opts.toEmail,
    subject: `🛒 Nueva orden #${opts.orderId.slice(0, 8).toUpperCase()} — ${formatCLP(opts.total)}`,
    text: [
      `Se ha recibido un nuevo pedido en Tu Farmacia.`,
      '',
      `Cliente: ${opts.customerName}`,
      `Monto: ${formatCLP(opts.total)}`,
      `Método de pago: ${opts.paymentMethod}`,
      '',
      `Productos:`,
      itemsList,
      '',
      `Ver pedido: ${BASE}/admin/ordenes/${opts.orderId}`,
    ].join('\n'),
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
