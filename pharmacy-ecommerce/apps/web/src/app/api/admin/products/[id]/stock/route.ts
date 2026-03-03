import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, errorResponse, getServiceClient } from '@/lib/supabase/api-helpers';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { id } = await params;
    const body = await request.json();
    const { delta, reason } = body as { delta: number; reason: string };

    if (typeof delta !== 'number' || delta === 0) {
      return errorResponse('delta must be a non-zero number');
    }
    const validReasons = ['reposicion', 'correccion', 'merma', 'inventario'];
    if (!validReasons.includes(reason)) {
      return errorResponse(`reason must be one of: ${validReasons.join(', ')}`);
    }

    const supabase = getServiceClient();

    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('id, stock')
      .eq('id', id)
      .single();

    if (fetchError || !product) return errorResponse('Product not found', 404);

    const newStock = product.stock + delta;
    if (newStock < 0) return errorResponse('Stock no puede ser negativo', 400);

    const { data: updated, error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', id)
      .select('id, name, stock')
      .single();

    if (updateError) return errorResponse(updateError.message, 500);

    await supabase.from('stock_movements').insert({
      product_id: id,
      delta,
      reason,
      admin_id: admin.id,
    });

    return NextResponse.json({ success: true, stock: updated.stock });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { id } = await params;
    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from('stock_movements')
      .select(`
        id, delta, reason, created_at,
        profiles:admin_id ( name, email )
      `)
      .eq('product_id', id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return errorResponse(error.message, 500);
    return NextResponse.json(data || []);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
