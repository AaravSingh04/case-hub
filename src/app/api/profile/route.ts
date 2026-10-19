import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/storage';
import { getCurrentUserServer } from '@/lib/auth/server';

export async function GET() {
  try {
    const user = await getCurrentUserServer();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const stats = db.getStudentStats(user.id);
    return NextResponse.json({ user, stats });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUserServer();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { display_name, program_of_study, year_of_study, linkedin_url, bio, avatar_url } = body;

    const updated = db.updateUserProfile(user.id, {
      display_name: display_name?.trim() || user.display_name,
      program_of_study: program_of_study?.trim(),
      year_of_study: year_of_study?.trim(),
      linkedin_url: linkedin_url?.trim(),
      bio: bio?.trim(),
      avatar_url: avatar_url?.trim() || user.avatar_url,
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
