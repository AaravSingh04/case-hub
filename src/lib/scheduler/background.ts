import { db } from '../db/storage';
import { sendClosingSoonReminder } from '../email';

/**
 * Server-side recurring automation worker.
 * Checks for closing soon competitions (<= 48 hours remaining) and dispatches reminders.
 */
export async function runClosingSoonScheduler(): Promise<{
  processedCount: number;
  dispatchedCount: number;
}> {
  const now = new Date();
  const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const allCompetitions = db.getAllCompetitionsAdmin(false);
  const existingLogs = db.getNotificationLogs();

  const closingSoon = allCompetitions.filter((c) => {
    const deadline = new Date(c.registration_deadline);
    const isPast = deadline.getTime() <= now.getTime();
    const isWithin48h = deadline.getTime() <= in48Hours.getTime();
    return !isPast && isWithin48h;
  });

  let dispatchedCount = 0;
  const students = db.getUsers().filter((u) => u.role === 'student' && (u.email_verified === undefined || u.email_verified === true));

  for (const comp of closingSoon) {
    const interested = db.getUsersWhoSavedCompetition(comp.id).filter((u) => u.email_verified === undefined || u.email_verified === true);
    const recipients = interested.length > 0 ? interested : students;

    for (const student of recipients) {
      const currentLogs = db.getNotificationLogs();
      const alreadySent = currentLogs.some(
        (l) =>
          l.template_type === 'closing_soon' &&
          l.competition_id === comp.id &&
          l.recipient_email === student.email &&
          (l.status === 'sent' || l.status === 'pending') &&
          new Date(l.created_at).getTime() > now.getTime() - 48 * 60 * 60 * 1000
      );

      if (!alreadySent) {
        await sendClosingSoonReminder(comp, student);
        dispatchedCount++;
      }
    }
  }

  return {
    processedCount: closingSoon.length,
    dispatchedCount,
  };
}
