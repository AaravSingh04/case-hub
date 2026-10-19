import { NextResponse } from 'next/server';
import { db } from '@/lib/db/storage';
import { requireAdminUserServer } from '@/lib/auth/server';

export async function GET() {
  try {
    await requireAdminUserServer();
    const logs = db.getNotificationLogs();
    return NextResponse.json({ logs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
