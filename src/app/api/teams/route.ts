import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/storage';
import { getCurrentUserServer } from '@/lib/auth/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const competitionId = searchParams.get('competitionId');

    if (!competitionId) {
      return NextResponse.json({ error: 'competitionId is required' }, { status: 400 });
    }

    const listings = db.getTeamListings(competitionId);
    return NextResponse.json({ listings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserServer();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required to post a team listing' }, { status: 401 });
    }

    const { competitionId, headline, description, targetTeamSize, contactMethod } = await req.json();

    if (!competitionId || !headline || !description || !targetTeamSize || !contactMethod) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const team = db.createTeamListing(competitionId, user, {
      headline: headline.trim(),
      description: description.trim(),
      target_team_size: parseInt(targetTeamSize, 10),
      contact_method: contactMethod.trim(),
    });

    return NextResponse.json({ success: true, team }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
