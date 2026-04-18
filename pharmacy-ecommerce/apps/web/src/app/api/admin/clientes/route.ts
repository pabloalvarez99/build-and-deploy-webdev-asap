import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers'
import { adminAuth } from '@/lib/firebase/admin'
import { getDb } from '@/lib/db'

export async function GET(_request: NextRequest) {
  const admin = await getAdminUser()
  if (!admin) return errorResponse('Unauthorized', 401)

  const db = await getDb()

  // 1. List all registered users via Firebase Admin (max 1000)
  const listResult = await adminAuth.listUsers(1000)
  const authUsers = listResult.users

  // 2. Get order stats per user_id (count + total spend)
  const userOrders = await db.orders.findMany({
    where: { user_id: { not: null } },
    select: { user_id: true, created_at: true, total: true, status: true },
  })

  const userOrderMap: Record<string, { count: number; last: string; total_spend: number }> = {}
  for (const o of userOrders) {
    if (!o.user_id) continue
    const uid = o.user_id
    if (!userOrderMap[uid]) userOrderMap[uid] = { count: 0, last: o.created_at.toISOString(), total_spend: 0 }
    userOrderMap[uid].count++
    if (!['cancelled', 'pending'].includes(o.status))
      userOrderMap[uid].total_spend += Number(o.total)
    if (o.created_at.toISOString() > userOrderMap[uid].last)
      userOrderMap[uid].last = o.created_at.toISOString()
  }

  // 3. Get unique guest customers with spend data
  const registeredEmails = new Set(authUsers.map((u) => u.email?.toLowerCase()))

  const guestOrders = await db.orders.findMany({
    where: { guest_email: { not: null } },
    select: { guest_email: true, guest_name: true, guest_surname: true, customer_phone: true, created_at: true, total: true, status: true },
    orderBy: { created_at: 'desc' },
  })

  const guestMap: Record<string, { name: string; surname: string; phone: string | null; count: number; last: string; total_spend: number }> = {}
  for (const o of guestOrders) {
    const emailLower = o.guest_email?.toLowerCase()
    if (!emailLower || registeredEmails.has(emailLower)) continue
    if (!guestMap[emailLower]) {
      guestMap[emailLower] = {
        name: o.guest_name || '',
        surname: o.guest_surname || '',
        phone: o.customer_phone || null,
        count: 0,
        last: o.created_at.toISOString(),
        total_spend: 0,
      }
    }
    guestMap[emailLower].count++
    if (!['cancelled', 'pending'].includes(o.status))
      guestMap[emailLower].total_spend += Number(o.total)
    if (o.created_at.toISOString() > guestMap[emailLower].last)
      guestMap[emailLower].last = o.created_at.toISOString()
  }

  const registered = authUsers.map((u) => ({
    id: u.uid,
    email: u.email,
    name: u.displayName || '',
    surname: '',
    phone: u.phoneNumber || null,
    created_at: u.metadata.creationTime,
    order_count: userOrderMap[u.uid]?.count ?? 0,
    last_order: userOrderMap[u.uid]?.last ?? null,
    total_spend: userOrderMap[u.uid]?.total_spend ?? 0,
    type: 'registered' as const,
  }))

  const guests = Object.entries(guestMap).map(([email, g]) => ({
    id: null,
    email,
    name: g.name,
    surname: g.surname,
    phone: g.phone,
    created_at: g.last,
    order_count: g.count,
    last_order: g.last,
    total_spend: g.total_spend,
    type: 'guest' as const,
  }))

  return NextResponse.json({ registered, guests })
}
