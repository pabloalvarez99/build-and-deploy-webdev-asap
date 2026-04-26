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
    const controlled = searchParams.get('controlled');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 50;

    const db = await getDb();
    const where = {
      ...(from || to ? {
        dispensed_at: {
          ...(from ? { gte: new Date(from + 'T00:00:00.000Z') } : {}),
          ...(to ? { lte: new Date(to + 'T23:59:59.999Z') } : {}),
        },
      } : {}),
      ...(controlled !== null ? { is_controlled: controlled === 'true' } : {}),
    };

    const [records, total] = await Promise.all([
      db.prescription_records.findMany({
        where,
        orderBy: { dispensed_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.prescription_records.count({ where }),
    ]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
    const [countHoy, countMes] = await Promise.all([
      db.prescription_records.count({ where: { dispensed_at: { gte: todayStart } } }),
      db.prescription_records.count({ where: { dispensed_at: { gte: monthStart } } }),
    ]);

    return NextResponse.json({ records, total, page, limit, kpis: { hoy: countHoy, mes: countMes } });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}

export interface PrescriptionInput {
  order_id?: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  prescription_number?: string;
  patient_name: string;
  patient_rut?: string;
  doctor_name?: string;
  medical_center?: string;
  prescription_date?: string;
  is_controlled?: boolean;
  dispensed_by?: string;
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const body: PrescriptionInput = await request.json();
    if (!body.patient_name || !body.product_name || !body.quantity) {
      return errorResponse('patient_name, product_name, quantity requeridos', 400);
    }

    const db = await getDb();
    const record = await db.prescription_records.create({
      data: {
        order_id: body.order_id || null,
        product_id: body.product_id || null,
        product_name: body.product_name,
        quantity: body.quantity,
        prescription_number: body.prescription_number || null,
        patient_name: body.patient_name,
        patient_rut: body.patient_rut || null,
        doctor_name: body.doctor_name || null,
        medical_center: body.medical_center || null,
        prescription_date: body.prescription_date ? new Date(body.prescription_date) : null,
        is_controlled: body.is_controlled ?? false,
        dispensed_by: body.dispensed_by || null,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
