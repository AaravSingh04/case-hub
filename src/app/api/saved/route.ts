import { NextResponse } from 'next/server';
import { db } from '@/lib/db/storage';
import { getCurrentUserServer } from '@/lib/auth/server';

export async function GET() {
  try {
    const user = await getCurrentUserServer();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const saved = db.getSavedCompetitions(user.id);
    return NextResponse.json({ savedCompetitions: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
