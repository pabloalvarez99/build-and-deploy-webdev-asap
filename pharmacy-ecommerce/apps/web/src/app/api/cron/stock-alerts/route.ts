import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { Resend } from 'resend'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = await getDb()

  // Read settings
  const [thresholdRow, alertEmailRow] = await Promise.all([
    db.admin_settings.findUnique({ where: { key: 'low_stock_threshold' } }),
    db.admin_settings.findUnique({ where: { key: 'alert_email' } }),
  ])

  const threshold = thresholdRow?.value ? parseInt(thresholdRow.value, 10) : 10
  const alertEmail = alertEmailRow?.value

  // No recipient configured → skip silently
  if (!alertEmail) {
    return NextResponse.json({ skipped: true, reason: 'no alert_email configured' })
  }

  // Query out-of-stock products
  const outOfStock = await db.products.findMany({
    where: { stock: 0, active: true },
    select: {
      id: true,
      name: true,
      stock: true,
      categories: { select: { name: true } },
    },
    orderBy: { name: 'asc' },
  })

  // Query low-stock products (stock > 0 but <= threshold)
  const lowStock = await db.products.findMany({
    where: { stock: { gt: 0, lte: threshold }, active: true },
    select: {
      id: true,
      name: true,
      stock: true,
      categories: { select: { name: true } },
    },
    orderBy: { stock: 'asc' },
  })

  // Nothing to report
  if (outOfStock.length === 0 && lowStock.length === 0) {
    return NextResponse.json({ skipped: true, reason: 'no low-stock products' })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
  }

  const date = new Date().toLocaleDateString('es-CL', {
    timeZone: 'America/Santiago',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const tableRow = (name: string, category: string, stock: number, stockLabel: string) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#64748b;">${category}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:bold;color:${stock === 0 ? '#dc2626' : '#d97706'};">${stock}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;color:#64748b;">${stockLabel}</td>
    </tr>`

  const outOfStockRows = outOfStock
    .map((p) => tableRow(p.name, p.categories?.name ?? '—', p.stock, '—'))
    .join('')

  const lowStockRows = lowStock
    .map((p) => tableRow(p.name, p.categories?.name ?? '—', p.stock, String(threshold)))
    .join('')

  const outOfStockSection = outOfStock.length > 0 ? `
    <h2 style="color:#dc2626;margin:24px 0 8px;">Sin stock (${outOfStock.length} producto${outOfStock.length !== 1 ? 's' : ''})</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="background:#fee2e2;">
          <th style="padding:8px 12px;text-align:left;">Nombre</th>
          <th style="padding:8px 12px;text-align:left;">Categoría</th>
          <th style="padding:8px 12px;text-align:center;">Stock actual</th>
          <th style="padding:8px 12px;text-align:center;">Umbral</th>
        </tr>
      </thead>
      <tbody>${outOfStockRows}</tbody>
    </table>` : ''

  const lowStockSection = lowStock.length > 0 ? `
    <h2 style="color:#d97706;margin:24px 0 8px;">Bajo stock (${lowStock.length} producto${lowStock.length !== 1 ? 's' : ''})</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="background:#fef3c7;">
          <th style="padding:8px 12px;text-align:left;">Nombre</th>
          <th style="padding:8px 12px;text-align:left;">Categoría</th>
          <th style="padding:8px 12px;text-align:center;">Stock actual</th>
          <th style="padding:8px 12px;text-align:center;">Umbral</th>
        </tr>
      </thead>
      <tbody>${lowStockRows}</tbody>
    </table>` : ''

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:sans-serif;color:#1e293b;max-width:700px;margin:0 auto;padding:24px;">
  <h1 style="color:#0891b2;margin-bottom:4px;">Tu Farmacia</h1>
  <p style="color:#64748b;margin-top:0;">Alerta de Stock Bajo — ${date}</p>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;">
  <p>Se han detectado <strong>${outOfStock.length + lowStock.length} producto(s)</strong> con stock bajo o agotado.</p>
  ${outOfStockSection}
  ${lowStockSection}
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0 16px;">
  <p style="font-size:13px;color:#64748b;">
    Gestiona el inventario en
    <a href="https://tu-farmacia.cl/admin/stock" style="color:#0891b2;">tu-farmacia.cl/admin/stock</a>
  </p>
</body>
</html>`

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: 'Tu Farmacia <no-reply@tu-farmacia.cl>',
    to: alertEmail,
    subject: `⚠️ Tu Farmacia — Alerta de Stock Bajo (${date})`,
    html,
  })

  const result = {
    sent_to: alertEmail,
    out_of_stock: outOfStock.length,
    low_stock: lowStock.length,
    threshold,
    ran_at: new Date().toISOString(),
  }

  console.log('Cron stock-alerts:', result)
  return NextResponse.json(result)
}
