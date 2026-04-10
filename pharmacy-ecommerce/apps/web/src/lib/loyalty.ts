import { getDb } from '@/lib/db'
import { calcPoints } from '@/lib/loyalty-utils'

export { calcPoints }

/** 1 punto = $100 CLP de descuento */
export const POINTS_TO_CLP = 100

/**
 * Otorga puntos de fidelización a un usuario registrado.
 * No lanza errores — no debe bloquear el flujo principal.
 */
export async function awardLoyaltyPoints(userId: string, orderId: string, totalCLP: number): Promise<void> {
  const points = calcPoints(totalCLP)
  if (points <= 0) return

  const db = await getDb()
  await db.$transaction(async (tx) => {
    await tx.profiles.upsert({
      where: { id: userId },
      update: { loyalty_points: { increment: points } },
      create: { id: userId, loyalty_points: points },
    })
    await tx.loyalty_transactions.create({
      data: { user_id: userId, order_id: orderId, points, reason: 'purchase' },
    })
  })
}

/**
 * Canjea puntos de un usuario para obtener descuento.
 * Lanza error si no tiene suficientes puntos.
 */
export async function redeemLoyaltyPoints(userId: string, orderId: string, pointsToRedeem: number): Promise<void> {
  if (pointsToRedeem <= 0) return

  const db = await getDb()
  await db.$transaction(async (tx) => {
    const profile = await tx.profiles.findUnique({
      where: { id: userId },
      select: { loyalty_points: true },
    })
    if (!profile || profile.loyalty_points < pointsToRedeem) {
      throw new Error('Puntos insuficientes')
    }
    await tx.profiles.update({
      where: { id: userId },
      data: { loyalty_points: { decrement: pointsToRedeem } },
    })
    await tx.loyalty_transactions.create({
      data: { user_id: userId, order_id: orderId, points: -pointsToRedeem, reason: 'redemption' },
    })
  })
}

/**
 * Restaura los puntos canjeados en una orden (al cancelar).
 * No lanza errores — no debe bloquear el flujo principal.
 */
export async function restoreLoyaltyPoints(orderId: string): Promise<void> {
  const db = await getDb()
  const redemptions = await db.loyalty_transactions.findMany({
    where: { order_id: orderId, points: { lt: 0 }, reason: 'redemption' },
    select: { user_id: true, points: true },
  })
  if (redemptions.length === 0) return

  await db.$transaction(async (tx) => {
    for (const r of redemptions) {
      const restore = Math.abs(r.points)
      await tx.profiles.update({
        where: { id: r.user_id },
        data: { loyalty_points: { increment: restore } },
      })
      await tx.loyalty_transactions.create({
        data: { user_id: r.user_id, order_id: orderId, points: restore, reason: 'redemption_restore' },
      })
    }
  })
}
