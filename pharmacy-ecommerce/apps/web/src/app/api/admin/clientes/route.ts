import { NextRequest, NextResponse } from 'next/server';
import { errorResponse, getAdminUser, getServiceClient } from '@/lib/supabase/api-helpers';

export async function GET(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return errorResponse('Unauthorized', 401);

  const supabase = getServiceClient();

  // 1. Get all registered users via admin API
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (authError) return errorResponse(authError.message, 500);

  const authUsers = authData?.users ?? [];

  // 2. Get order counts per user_id for registered users
  const { data: userOrders } = await supabase
    .from('orders')
    .select('user_id, created_at')
    .not('user_id', 'is', null);

  const userOrderMap: Record<string, { count: number; last: string }> = {};
  for (const o of userOrders ?? []) {
    if (!o.user_id) continue;
    if (!userOrderMap[o.user_id]) userOrderMap[o.user_id] = { count: 0, last: o.created_at };
    userOrderMap[o.user_id].count++;
    if (o.created_at > userOrderMap[o.user_id].last) userOrderMap[o.user_id].last = o.created_at;
  }

  // 3. Get unique guest customers (orders with guest_email not matching any registered email)
  const registeredEmails = new Set(authUsers.map((u: { email?: string }) => u.email?.toLowerCase()));

  const { data: guestOrders } = await supabase
    .from('orders')
    .select('guest_email, guest_name, guest_surname, customer_phone, created_at')
    .not('guest_email', 'is', null)
    .order('created_at', { ascending: false });

  const guestMap: Record<string, { name: string; surname: string; phone: string | null; count: number; last: string }> = {};
  for (const o of guestOrders ?? []) {
    const emailLower = o.guest_email?.toLowerCase();
    if (!emailLower || registeredEmails.has(emailLower)) continue;
    if (!guestMap[emailLower]) {
      guestMap[emailLower] = { name: o.guest_name || '', surname: o.guest_surname || '', phone: o.customer_phone, count: 0, last: o.created_at };
    }
    guestMap[emailLower].count++;
    if (o.created_at > guestMap[emailLower].last) guestMap[emailLower].last = o.created_at;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const registered = authUsers.map((u: any) => ({
    id: u.id,
    email: u.email,
    name: u.user_metadata?.name || '',
    surname: u.user_metadata?.surname || '',
    phone: u.user_metadata?.phone || null,
    created_at: u.created_at,
    order_count: userOrderMap[u.id]?.count ?? 0,
    last_order: userOrderMap[u.id]?.last ?? null,
    type: 'registered' as const,
  }));

  const guests = Object.entries(guestMap).map(([email, g]) => ({
    id: null,
    email,
    name: g.name,
    surname: g.surname,
    phone: g.phone,
    created_at: g.last,
    order_count: g.count,
    last_order: g.last,
    type: 'guest' as const,
  }));

  return NextResponse.json({ registered, guests });
}
