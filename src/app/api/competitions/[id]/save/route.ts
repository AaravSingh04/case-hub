import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/storage';
import { getCurrentUserServer } from '@/lib/auth/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUserServer();
    if (!user) {
      return NextResponse.json({ isSaved: false });
    }

    const { id } = params;
    const isSaved = db.isCompetitionSaved(user.id, id);
    return NextResponse.json({ isSaved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUserServer();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = params;
    const result = db.toggleSaveCompetition(user.id, id);
    return NextResponse.json({ success: true, saved: result.saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
