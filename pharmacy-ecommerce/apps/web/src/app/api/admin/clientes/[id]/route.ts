import { NextRequest, NextResponse } from 'next/server';
import { errorResponse, getAdminUser, getServiceClient } from '@/lib/supabase/api-helpers';

// GET /api/admin/clientes/[id] — customer detail + full order history
// For registered users: id = user UUID
// For guest users: id = 'guest', ?email=xxx
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminUser();
  if (!admin) return errorResponse('Unauthorized', 401);

  const supabase = getServiceClient();
  const { id } = params;

  if (id === 'guest') {
    const email = request.nextUrl.searchParams.get('email');
    if (!email) return errorResponse('email required for guest lookup');

    const { data: orders } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .ilike('guest_email', email)
      .order('created_at', { ascending: false });

    const firstOrder = orders?.[0];
    return NextResponse.json({
      customer: {
        id: null,
        email,
        name: firstOrder?.guest_name || '',
        surname: firstOrder?.guest_surname || '',
        phone: firstOrder?.customer_phone || null,
        type: 'guest',
        created_at: firstOrder?.created_at || null,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      orders: (orders || []).map((o: any) => ({ ...o, items: o.order_items || [] })),
    });
  }

  // Registered user
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(id);
  if (userError || !userData.user) return errorResponse('Cliente no encontrado', 404);

  const u = userData.user;
  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', id)
    .order('created_at', { ascending: false });

  return NextResponse.json({
    customer: {
      id: u.id,
      email: u.email,
      name: u.user_metadata?.name || '',
      surname: u.user_metadata?.surname || '',
      phone: u.user_metadata?.phone || null,
      type: 'registered',
      created_at: u.created_at,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    orders: (orders || []).map((o: any) => ({ ...o, items: o.order_items || [] })),
  });
}

// PUT /api/admin/clientes/[id] — update registered user metadata
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminUser();
  if (!admin) return errorResponse('Unauthorized', 401);

  const { id } = params;
  const { name, surname, phone, email } = await request.json();

  const supabase = getServiceClient();

  const updateData: Record<string, unknown> = {
    user_metadata: { name, surname, phone: phone || null },
  };
  if (email) updateData.email = email;

  const { data, error } = await supabase.auth.admin.updateUserById(id, updateData);
  if (error) return errorResponse(error.message, 500);

  return NextResponse.json({ success: true, user: data.user });
}

// DELETE /api/admin/clientes/[id] — delete registered user account (orders remain)
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminUser();
  if (!admin) return errorResponse('Unauthorized', 401);

  const supabase = getServiceClient();
  const { error } = await supabase.auth.admin.deleteUser(params.id);
  if (error) return errorResponse(error.message, 500);

  return NextResponse.json({ success: true });
}
