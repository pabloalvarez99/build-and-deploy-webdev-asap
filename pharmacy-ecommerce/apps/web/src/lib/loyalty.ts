import { getDb } from '@/lib/db'
import { calcPoints } from '@/lib/loyalty-utils'

export { calcPoints }

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
