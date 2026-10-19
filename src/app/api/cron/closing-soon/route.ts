import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/storage';
import { getCurrentUserServer } from '@/lib/auth/server';
import { sendClosingSoonReminder } from '@/lib/email';
import { getDeadlineStatus } from '@/lib/utils';

export async function GET(req: NextRequest) {
  return handleClosingSoonRun(req);
}

export async function POST(req: NextRequest) {
  return handleClosingSoonRun(req);
}

async function handleClosingSoonRun(req: NextRequest) {
  try {
    // Check authorization: either valid CRON_SECRET or Admin user
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const isCronAuthorized = Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`);

    const currentUser = await getCurrentUserServer();
    const isAdminAuthorized = currentUser?.role === 'admin';

    if (!isCronAuthorized && !isAdminAuthorized) {
      return NextResponse.json({ error: 'Unauthorized scheduler trigger' }, { status: 401 });
    }

    const now = new Date();
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const allCompetitions = db.getAllCompetitionsAdmin(false);
    const existingLogs = db.getNotificationLogs();

    // Find competitions closing within 48 hours and not yet closed
    const closingSoon = allCompetitions.filter((c) => {
      const deadline = new Date(c.registration_deadline);
      const isPast = deadline.getTime() <= now.getTime();
      const isWithin48h = deadline.getTime() <= in48Hours.getTime();
      return !isPast && isWithin48h;
    });

    const registeredUsers = db.getRegisteredVerifiedUsers();
    const sentSummary: { competitionId: string; competitionName: string; recipients: string[] }[] = [];

    for (const comp of closingSoon) {
      const sentToThisComp: string[] = [];

      for (const user of registeredUsers) {
        // Check idempotency: ensure closing_soon was not already sent to this user for this competition
        const alreadySent = existingLogs.some(
          (l) =>
            l.template_type === 'closing_soon' &&
            l.competition_id === comp.id &&
            l.recipient_email.toLowerCase() === user.email.toLowerCase() &&
            l.status === 'sent'
        );

        if (!alreadySent) {
          await sendClosingSoonReminder(comp, user);
          sentToThisComp.push(user.email);
        }
      }

      if (sentToThisComp.length > 0) {
        sentSummary.push({
          competitionId: comp.id,
          competitionName: comp.name,
          recipients: sentToThisComp,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Closing-soon scheduler completed',
      closingSoonFound: closingSoon.length,
      dispatchedCount: sentSummary.reduce((acc, s) => acc + s.recipients.length, 0),
      summary: sentSummary,
      executedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Closing-soon scheduler error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
