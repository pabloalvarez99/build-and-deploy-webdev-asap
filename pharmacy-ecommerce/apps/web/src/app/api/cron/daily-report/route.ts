import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sendDailyReport } from '@/lib/email';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const secret = request.headers.get('authorization')?.replace('Bearer ', '');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = await getDb();

    // Yesterday's date range (UTC)
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    const from = new Date(dateStr + 'T00:00:00Z');
    const to = new Date(dateStr + 'T23:59:59Z');

    // Get alert_email + threshold from settings
    const [emailSetting, thresholdSetting] = await Promise.all([
      db.admin_settings.findUnique({ where: { key: 'alert_email' } }),
      db.admin_settings.findUnique({ where: { key: 'low_stock_threshold' } }),
    ]);

    const alertEmail = emailSetting?.value;
    if (!alertEmail) {
      return NextResponse.json({ skipped: true, reason: 'No alert_email configured' });
    }

    const threshold = Number(thresholdSetting?.value ?? 10);

    // Fetch yesterday's orders
    const orders = await db.orders.findMany({
      where: {
        created_at: { gte: from, lte: to },
        OR: [
          { status: { in: ['paid', 'processing', 'shipped', 'delivered'] } },
          { status: 'completed', payment_provider: { in: ['pos_cash', 'pos_debit', 'pos_credit'] } },
        ],
      },
      select: { id: true, total: true, payment_provider: true },
    });

    const isPOS = (pp: string | null) => pp?.startsWith('pos_') ?? false;
    const revenue = orders.reduce((s, o) => s + Number(o.total), 0);
    const posOrders = orders.filter((o) => isPOS(o.payment_provider));
    const onlineOrders = orders.filter((o) => !isPOS(o.payment_provider));
    const avgTicket = orders.length > 0 ? revenue / orders.length : 0;

    // Top products for the day
    const orderIds = orders.map((o) => o.id);
    let topProducts: { name: string; units: number; revenue: number }[] = [];
    if (orderIds.length > 0) {
      const items = await db.order_items.findMany({
        where: { order_id: { in: orderIds } },
        select: { product_name: true, quantity: true, price_at_purchase: true },
      });
      const productMap: Record<string, { name: string; units: number; revenue: number }> = {};
      items.forEach((item) => {
        const key = item.product_name;
        if (!productMap[key]) productMap[key] = { name: item.product_name, units: 0, revenue: 0 };
        productMap[key].units += item.quantity;
        productMap[key].revenue += item.quantity * Number(item.price_at_purchase);
      });
      topProducts = Object.values(productMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
    }

    // Low-stock products
    const lowStockProducts = await db.products.findMany({
      where: { active: true, stock: { lte: threshold } },
      select: { name: true, stock: true },
      orderBy: { stock: 'asc' },
      take: 15,
    });

    // Format date in Spanish
    const dateLabel = yesterday.toLocaleDateString('es-CL', {
      weekday: 'long', day: 'numeric', month: 'long',
      timeZone: 'America/Santiago',
    });

    await sendDailyReport({
      to: alertEmail,
      date: dateLabel,
      revenue,
      orders: orders.length,
      posRevenue: posOrders.reduce((s, o) => s + Number(o.total), 0),
      posOrders: posOrders.length,
      onlineRevenue: onlineOrders.reduce((s, o) => s + Number(o.total), 0),
      onlineOrders: onlineOrders.length,
      avgTicket,
      topProducts,
      lowStock: lowStockProducts,
      threshold,
    });

    return NextResponse.json({
      sent: true,
      to: alertEmail,
      date: dateStr,
      orders: orders.length,
      revenue,
      lowStock: lowStockProducts.length,
    });
  } catch (err) {
    console.error('daily-report cron error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
