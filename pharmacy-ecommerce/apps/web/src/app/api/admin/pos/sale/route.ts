import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

async function checkAndAlertLowStock(db: Awaited<ReturnType<typeof getDb>>, productIds: string[]) {
  if (productIds.length === 0) return;
  const settings = await db.admin_settings.findMany({ select: { key: true, value: true } });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const threshold = parseInt(map.low_stock_threshold || '10');
  const alertEmail = map.alert_email;
  if (!alertEmail) return;
  const lowStock = await db.products.findMany({
    where: { id: { in: productIds }, stock: { lte: threshold } },
    select: { name: true, stock: true },
  });
  if (lowStock.length > 0) {
    const { sendLowStockAlert } = await import('@/lib/email');
    await sendLowStockAlert(alertEmail, lowStock, threshold);
  }
}

interface SaleItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number; // unit price in CLP
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const body = await request.json();
    const {
      items,
      payment_method, // 'pos_cash' | 'pos_debit' | 'pos_credit'
      customer_name,
      customer_phone,
      notes,
    }: {
      items: SaleItem[];
      payment_method: string;
      customer_name?: string;
      customer_phone?: string;
      notes?: string;
    } = body;

    if (!items || items.length === 0) return errorResponse('Items requeridos', 400);
    if (!['pos_cash', 'pos_debit', 'pos_credit'].includes(payment_method)) {
      return errorResponse('Método de pago inválido', 400);
    }

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const db = await getDb();

    // Check stock for all items before starting transaction
    const products = await db.products.findMany({
      where: { id: { in: items.map((i) => i.product_id) }, active: true },
      select: { id: true, stock: true, name: true },
    });

    for (const item of items) {
      const p = products.find((p) => p.id === item.product_id);
      if (!p) return errorResponse(`Producto no encontrado: ${item.product_name}`, 400);
      if (p.stock < item.quantity) {
        return errorResponse(`Stock insuficiente para "${p.name}": disponible ${p.stock}`, 400);
      }
    }

    // Atomic transaction: create order + items + decrement stock + record movements
    const order = await db.$transaction(async (tx) => {
      const newOrder = await tx.orders.create({
        data: {
          status: 'completed',
          payment_provider: payment_method,
          total,
          guest_name: customer_name || 'Venta POS',
          customer_phone: customer_phone || null,
          notes: notes || null,
          order_items: {
            create: items.map((item) => ({
              product_id: item.product_id,
              product_name: item.product_name,
              quantity: item.quantity,
              price_at_purchase: item.price,
            })),
          },
        },
        include: { order_items: true },
      });

      for (const item of items) {
        await tx.products.update({
          where: { id: item.product_id },
          data: { stock: { decrement: item.quantity } },
        });

        await tx.stock_movements.create({
          data: {
            product_id: item.product_id,
            delta: -item.quantity,
            reason: 'sale_pos',
            admin_id: admin.email || admin.uid,
          },
        });
      }

      return newOrder;
    });

    // Fire-and-forget low stock check (same logic as online order approval)
    checkAndAlertLowStock(db, items.map((i) => i.product_id)).catch(() => {});

    return NextResponse.json({
      id: order.id,
      total: order.total.toString(),
      items_count: order.order_items.length,
    });
  } catch (error) {
    console.error('POS sale error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
