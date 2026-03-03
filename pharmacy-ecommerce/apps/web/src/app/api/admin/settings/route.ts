import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, errorResponse, getServiceClient } from '@/lib/supabase/api-helpers';

export async function GET() {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const supabase = getServiceClient();
    const { data, error } = await supabase.from('admin_settings').select('*');
    if (error) return errorResponse(error.message, 500);

    const settings = Object.fromEntries((data || []).map((r: { key: string; value: string }) => [r.key, r.value]));
    return NextResponse.json(settings);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const body = await request.json() as Record<string, string>;
    const supabase = getServiceClient();

    const updates = Object.entries(body).map(([key, value]) => ({
      key,
      value: String(value),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('admin_settings')
      .upsert(updates, { onConflict: 'key' });

    if (error) return errorResponse(error.message, 500);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
