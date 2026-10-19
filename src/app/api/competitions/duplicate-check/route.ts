import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/storage';

export async function POST(req: NextRequest) {
  try {
    const { name, organizer, registrationUrl } = await req.json();

    if (!name || !organizer || !registrationUrl) {
      return NextResponse.json({ isDuplicate: false, matches: [] });
    }

    const result = db.checkPotentialDuplicate(name, organizer, registrationUrl);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
