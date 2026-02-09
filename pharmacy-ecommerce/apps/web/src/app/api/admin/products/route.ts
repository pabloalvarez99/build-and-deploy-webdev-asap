import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, errorResponse, getServiceClient } from '@/lib/supabase/api-helpers';

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const body = await request.json();
    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from('products')
      .insert({
        name: body.name,
        slug: body.slug,
        description: body.description,
        price: parseFloat(body.price),
        stock: body.stock || 0,
        category_id: body.category_id || null,
        image_url: body.image_url || null,
        laboratory: body.laboratory || null,
        therapeutic_action: body.therapeutic_action || null,
        active_ingredient: body.active_ingredient || null,
        prescription_type: body.prescription_type || 'direct',
        presentation: body.presentation || null,
        active: body.active !== false,
      })
      .select()
      .single();

    if (error) return errorResponse(error.message, 500);
    return NextResponse.json(data);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
