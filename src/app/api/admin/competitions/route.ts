import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/storage';
import { requireAdminUserServer } from '@/lib/auth/server';

export async function GET() {
  try {
    await requireAdminUserServer();
    const competitions = db.getAllCompetitionsAdmin(true);
    return NextResponse.json({ competitions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminUserServer();
    const body = await req.json();
    const { action, competitionId } = body;

    if (!competitionId || !action) {
      return NextResponse.json({ error: 'competitionId and action are required' }, { status: 400 });
    }

    if (action === 'archive') {
      const comp = db.archiveCompetition(competitionId, true);
      return NextResponse.json({ success: true, competition: comp });
    }

    if (action === 'restore') {
      const comp = db.archiveCompetition(competitionId, false);
      return NextResponse.json({ success: true, competition: comp });
    }

    if (action === 'verify') {
      const comp = db.verifyCompetition(competitionId, admin.display_name);
      return NextResponse.json({ success: true, competition: comp });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
