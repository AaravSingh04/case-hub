import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/storage';
import { requireAdminUserServer } from '@/lib/auth/server';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdminUserServer();
    const { id } = params;
    const success = db.deleteCaseResource(id);

    if (!success) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
