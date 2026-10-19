import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/storage';
import { getCurrentUserServer } from '@/lib/auth/server';
import { sendSavedUpdateNotification } from '@/lib/email';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const competition = db.getCompetitionById(id);

    if (!competition) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
    }

    return NextResponse.json({ competition });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUserServer();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = params;
    const updates = await req.json();

    const { competition, changedFields, previousValues } = db.updateCompetition(
      id,
      updates,
      user.id,
      user.role === 'admin'
    );

    if (!competition) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
    }

    // If important dates changed, notify students who saved this competition!
    if (changedFields.length > 0) {
      const savedStudents = db.getUsersWhoSavedCompetition(competition.id);
      for (const student of savedStudents) {
        sendSavedUpdateNotification(competition, student, changedFields, previousValues).catch((err) => {
          console.error(`Failed to send saved update notification to ${student.email}:`, err);
        });
      }
    }

    return NextResponse.json({ success: true, competition });
  } catch (err: any) {
    const status = err.message.includes('Unauthorized') ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUserServer();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = params;
    const success = db.deleteCompetition(id, user.id, user.role === 'admin');

    if (!success) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Competition deleted successfully' });
  } catch (err: any) {
    const status = err.message.includes('Unauthorized') ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
