import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';
import { awardLoyaltyPoints } from '@/lib/loyalty';

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
      payment_method, // 'pos_cash' | 'pos_debit' | 'pos_credit' | 'pos_mixed'
      cash_amount,
      card_amount,
      customer_name,
      customer_phone,
      customer_user_id,
      discount_amount,
      notes,
      prescription_records,
    }: {
      items: SaleItem[];
      payment_method: string;
      cash_amount?: number;
      card_amount?: number;
      customer_name?: string;
      customer_phone?: string;
      customer_user_id?: string;
      discount_amount?: number;
      notes?: string;
      prescription_records?: Array<{
        product_id?: string;
        product_name: string;
        quantity: number;
        prescription_number?: string;
        patient_name: string;
        patient_rut?: string;
        doctor_name?: string;
        medical_center?: string;
        prescription_date?: string;
        is_controlled?: boolean;
        dispensed_by?: string;
      }>;
    } = body;

    if (!items || items.length === 0) return errorResponse('Items requeridos', 400);
    if (!['pos_cash', 'pos_debit', 'pos_credit', 'pos_mixed'].includes(payment_method)) {
      return errorResponse('Método de pago inválido', 400);
    }

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = discount_amount && discount_amount > 0 ? Math.min(Math.round(discount_amount), subtotal) : 0;
    const total = subtotal - discount;
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
          cash_amount: cash_amount ? Math.round(cash_amount) : null,
          card_amount: card_amount ? Math.round(card_amount) : null,
          guest_name: customer_name || 'Venta POS',
          customer_phone: customer_phone || null,
          notes: notes || null,
          sold_by_user_id: admin.uid,
          sold_by_name: admin.name || admin.email || admin.uid,
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

    // Persist prescription records (blocking — required for ISP compliance)
    if (prescription_records && prescription_records.length > 0) {
      await db.prescription_records.createMany({
        data: prescription_records.map(pr => ({
          order_id: order.id,
          product_id: pr.product_id || null,
          product_name: pr.product_name,
          quantity: pr.quantity,
          prescription_number: pr.prescription_number || null,
          patient_name: pr.patient_name,
          patient_rut: pr.patient_rut || null,
          doctor_name: pr.doctor_name || null,
          medical_center: pr.medical_center || null,
          prescription_date: pr.prescription_date ? new Date(pr.prescription_date) : null,
          is_controlled: pr.is_controlled ?? false,
          dispensed_by: pr.dispensed_by || null,
        })),
      });
    }

    // Fire-and-forget low stock check (same logic as online order approval)
    checkAndAlertLowStock(db, items.map((i) => i.product_id)).catch(() => {});

    // Award loyalty points for registered customers (non-blocking)
    if (customer_user_id) {
      awardLoyaltyPoints(customer_user_id, order.id, total).catch(() => {});
    }

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
