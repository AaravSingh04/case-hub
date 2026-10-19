import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/storage';
import { requireAdminUserServer } from '@/lib/auth/server';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdminUserServer();
    const { id } = params;
    const { status, resolutionNotes } = await req.json();

    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 });
    }

    const updated = db.updateReportStatus(id, status, admin.id, resolutionNotes);
    if (!updated) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, report: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
