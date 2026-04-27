import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const db = await getDb()
    const setting = await db.admin_settings.findUnique({ where: { key: 'loyalty_enabled' } })
    const enabled = setting ? setting.value !== 'false' : true
    return NextResponse.json({ enabled })
  } catch {
    return NextResponse.json({ enabled: true })
  }
}
