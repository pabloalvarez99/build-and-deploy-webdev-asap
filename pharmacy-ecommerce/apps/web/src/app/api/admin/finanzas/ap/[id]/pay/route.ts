import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getOwnerUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const owner = await getOwnerUser();
  if (!owner) return errorResponse('Unauthorized', 403);

  const { amount, payment_method, paid_at, notes, mark_fully_paid } = await request.json();

  if (!amount || amount <= 0) return errorResponse('Monto requerido', 400);
  if (!payment_method) return errorResponse('Método de pago requerido', 400);

  const db = await getDb();
  const po = await db.purchase_orders.findUnique({ where: { id: params.id } });
  if (!po) return errorResponse('OC no encontrada', 404);

  await db.$transaction(async (tx) => {
    await tx.purchase_payments.create({
      data: {
        purchase_order_id: params.id,
        amount,
        payment_method,
        paid_at: paid_at ? new Date(paid_at) : new Date(),
        notes: notes || null,
        created_by: owner.email || owner.uid,
      },
    });

    if (mark_fully_paid) {
      await tx.purchase_orders.update({
        where: { id: params.id },
        data: {
          paid: true,
          paid_at: paid_at ? new Date(paid_at) : new Date(),
          payment_method_ap: payment_method,
        },
      });
    }
  });

  return NextResponse.json({ success: true });
}
