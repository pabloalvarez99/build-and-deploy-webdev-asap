import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, errorResponse, getServiceClient } from '@/lib/supabase/api-helpers';

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const body = await request.json();
    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: body.name,
        slug: body.slug,
        description: body.description || null,
        image_url: body.image_url || null,
        active: true,
      })
      .select()
      .single();

    if (error) return errorResponse(error.message, 500);
    return NextResponse.json(data);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
