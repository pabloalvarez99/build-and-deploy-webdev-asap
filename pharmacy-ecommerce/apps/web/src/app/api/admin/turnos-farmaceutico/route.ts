import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;

    const db = await getDb();
    const where = {
      ...(from || to ? {
        shift_start: {
          ...(from ? { gte: new Date(from + 'T00:00:00.000Z') } : {}),
          ...(to ? { lte: new Date(to + 'T23:59:59.999Z') } : {}),
        },
      } : {}),
    };

    const [shifts, total] = await Promise.all([
      db.pharmacist_shifts.findMany({
        where,
        orderBy: { shift_start: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.pharmacist_shifts.count({ where }),
    ]);

    const shiftsWithRx = await Promise.all(
      shifts.map(async (shift) => {
        const rxWhere = {
          dispensed_at: {
            gte: shift.shift_start,
            ...(shift.shift_end ? { lte: shift.shift_end } : {}),
          },
        };
        const [rxCount, rxRecords] = await Promise.all([
          db.prescription_records.count({ where: rxWhere }),
          db.prescription_records.findMany({
            where: rxWhere,
            select: {
              id: true,
              product_name: true,
              quantity: true,
              patient_name: true,
              is_controlled: true,
              dispensed_at: true,
            },
            orderBy: { dispensed_at: 'asc' },
          }),
        ]);
        return { ...shift, rx_count: rxCount, prescriptions: rxRecords };
      })
    );

    return NextResponse.json({ shifts: shiftsWithRx, total, page, limit });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
