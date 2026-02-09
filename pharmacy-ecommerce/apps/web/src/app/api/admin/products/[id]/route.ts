import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, errorResponse, getServiceClient } from '@/lib/supabase/api-helpers';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { id } = await params;
    const body = await request.json();
    const supabase = getServiceClient();

    const updateData: Record<string, any> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) updateData.price = parseFloat(body.price);
    if (body.stock !== undefined) updateData.stock = body.stock;
    if (body.category_id !== undefined) updateData.category_id = body.category_id || null;
    if (body.image_url !== undefined) updateData.image_url = body.image_url || null;
    if (body.laboratory !== undefined) updateData.laboratory = body.laboratory || null;
    if (body.therapeutic_action !== undefined) updateData.therapeutic_action = body.therapeutic_action || null;
    if (body.active_ingredient !== undefined) updateData.active_ingredient = body.active_ingredient || null;
    if (body.prescription_type !== undefined) updateData.prescription_type = body.prescription_type;
    if (body.presentation !== undefined) updateData.presentation = body.presentation || null;
    if (body.active !== undefined) updateData.active = body.active;

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) return errorResponse(error.message, 500);
    return NextResponse.json(data);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { id } = await params;
    const supabase = getServiceClient();

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) return errorResponse(error.message, 500);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
