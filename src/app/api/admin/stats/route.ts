import { NextResponse } from 'next/server';
import { db } from '@/lib/db/storage';
import { requireAdminUserServer } from '@/lib/auth/server';

export async function GET() {
  try {
    await requireAdminUserServer();
    const stats = db.getAdminStats();
    return NextResponse.json({ stats });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
