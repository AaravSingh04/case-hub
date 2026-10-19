import { NextResponse } from 'next/server';
import { db } from '@/lib/db/storage';
import { getCurrentUserServer } from '@/lib/auth/server';

export async function GET() {
  try {
    const user = await getCurrentUserServer();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const all = db.getAllCompetitionsAdmin(true);
    const myPosts = all.filter((c) => c.uploader_id === user.id);

    return NextResponse.json({ myPosts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
