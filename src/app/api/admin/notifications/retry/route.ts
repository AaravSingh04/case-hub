import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUserServer } from '@/lib/auth/server';
import { retryNotification } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    await requireAdminUserServer();
    const { notificationId } = await req.json();

    if (!notificationId) {
      return NextResponse.json({ error: 'notificationId is required' }, { status: 400 });
    }

    const success = await retryNotification(notificationId);
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
