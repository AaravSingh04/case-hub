import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/storage';
import { getCurrentUserServer, requireAdminUserServer } from '@/lib/auth/server';
import { ReportReason } from '@/lib/db/types';

export async function GET() {
  try {
    await requireAdminUserServer();
    const reports = db.getReports();
    return NextResponse.json({ reports });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserServer();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required to submit a report' }, { status: 401 });
    }

    const { competitionId, reason, additionalDetails } = await req.json();

    if (!competitionId || !reason) {
      return NextResponse.json({ error: 'competitionId and reason are required' }, { status: 400 });
    }

    const report = db.createReport(competitionId, user, reason as ReportReason, additionalDetails);
    return NextResponse.json({ success: true, report }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
