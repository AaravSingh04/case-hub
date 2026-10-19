import { Competition, User, DiscoveryLog } from '../db/types';
import { db } from '../db/storage';
import { getAppBaseUrl } from '../utils';
import {
  getAdminUploadEmailHtml,
  getClosingSoonEmailHtml,
  getSavedUpdateEmailHtml,
  getAdminDiscoveryEmailHtml,
} from './templates';

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendRawEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendEmailResult> {
  const { to, subject, html } = params;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'Case Hub <notifications@casehub.internal>';

  if (apiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from,
          to,
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const errMsg = errJson.message || `Resend API failed with status ${response.status}`;
        console.error('Failed to send email via Resend:', errMsg);
        return { success: false, error: errMsg };
      }

      const data = await response.json();
      return { success: true, messageId: data.id };
    } catch (err: any) {
      console.error('Network exception in sendRawEmail:', err);
      return { success: false, error: err.message || 'Network error' };
    }
  }

  // Local development / fallback simulation:
  // Still logs complete delivery to console and notification outbox!
  console.log(`\n======================================================`);
  console.log(`[CASE HUB EMAIL DISPATCH] (Simulated Outbox)`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`======================================================\n`);

  return { success: true, messageId: `sim_${Date.now()}` };
}

/**
 * Sends automatic notification to Administrator when a student publishes a competition
 */
export async function sendAdminNewUploadNotification(
  competition: Competition,
  uploaderEmail: string
): Promise<void> {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@casehub.internal';
  const baseUrl = getAppBaseUrl();
  const detailUrl = `${baseUrl}/competitions/${competition.id}`;
  const subject = `New Competition Uploaded — ${competition.name} | Case Hub`;

  const html = getAdminUploadEmailHtml({
    competition,
    uploaderEmail,
    detailUrl,
  });

  // Log to DB outbox
  const notifLog = db.logNotification({
    recipient_email: adminEmail,
    recipient_name: 'Case Hub Administrator',
    subject,
    template_type: 'admin_new_upload',
    competition_id: competition.id,
    status: 'pending',
    payload: {
      competitionId: competition.id,
      competitionName: competition.name,
      uploaderEmail,
      detailUrl,
    },
  });

  try {
    const result = await sendRawEmail({
      to: adminEmail,
      subject,
      html,
    });

    if (result.success) {
      db.updateNotificationStatus(notifLog.id, 'sent');
    } else {
      db.updateNotificationStatus(notifLog.id, 'failed', result.error);
    }
  } catch (err: any) {
    db.updateNotificationStatus(notifLog.id, 'failed', err.message || 'Unknown send error');
  }
}

/**
 * Sends closing-soon reminder to a student
 */
export async function sendClosingSoonReminder(
  competition: Competition,
  recipient: User
): Promise<void> {
  const baseUrl = getAppBaseUrl();
  const detailUrl = `${baseUrl}/competitions/${competition.id}`;
  const subject = `Closing Soon: ${competition.name} — 48 Hours Remaining | Case Hub`;

  const html = getClosingSoonEmailHtml({
    competition,
    recipientName: recipient.display_name,
    detailUrl,
  });

  const notifLog = db.logNotification({
    recipient_email: recipient.email,
    recipient_name: recipient.display_name,
    subject,
    template_type: 'closing_soon',
    competition_id: competition.id,
    status: 'pending',
    payload: {
      competitionId: competition.id,
      recipientId: recipient.id,
      detailUrl,
    },
  });

  try {
    const result = await sendRawEmail({
      to: recipient.email,
      subject,
      html,
    });

    if (result.success) {
      db.updateNotificationStatus(notifLog.id, 'sent');
    } else {
      db.updateNotificationStatus(notifLog.id, 'failed', result.error);
    }
  } catch (err: any) {
    db.updateNotificationStatus(notifLog.id, 'failed', err.message || 'Unknown send error');
  }
}

/**
 * Sends update notification to students who saved a competition when dates change
 */
export async function sendSavedUpdateNotification(
  competition: Competition,
  recipient: User,
  changedFields: string[],
  previousValues: Record<string, any>
): Promise<void> {
  const baseUrl = getAppBaseUrl();
  const detailUrl = `${baseUrl}/competitions/${competition.id}`;
  const subject = `Update: Important Changes to ${competition.name} | Case Hub`;

  const html = getSavedUpdateEmailHtml({
    competition,
    recipientName: recipient.display_name,
    detailUrl,
    changedFields,
    previousValues,
  });

  const notifLog = db.logNotification({
    recipient_email: recipient.email,
    recipient_name: recipient.display_name,
    subject,
    template_type: 'saved_update',
    competition_id: competition.id,
    status: 'pending',
    payload: {
      competitionId: competition.id,
      recipientId: recipient.id,
      changedFields,
      previousValues,
      detailUrl,
    },
  });

  try {
    const result = await sendRawEmail({
      to: recipient.email,
      subject,
      html,
    });

    if (result.success) {
      db.updateNotificationStatus(notifLog.id, 'sent');
    } else {
      db.updateNotificationStatus(notifLog.id, 'failed', result.error);
    }
  } catch (err: any) {
    db.updateNotificationStatus(notifLog.id, 'failed', err.message || 'Unknown send error');
  }
}

/**
 * Retry a failed notification from the Admin Dashboard
 */
export async function retryNotification(notificationId: string): Promise<boolean> {
  const logs = db.getNotificationLogs();
  const target = logs.find((l) => l.id === notificationId);
  if (!target) return false;

  const comp = db.getCompetitionById(target.competition_id);
  if (!comp) return false;

  const baseUrl = getAppBaseUrl();
  const detailUrl = `${baseUrl}/competitions/${comp.id}`;

  let html = '';
  if (target.template_type === 'admin_new_upload') {
    const meta = db.getCompetitionPrivateMetadata(comp.id);
    html = getAdminUploadEmailHtml({
      competition: comp,
      uploaderEmail: meta?.uploader_email || 'student@hsb.internal',
      detailUrl,
    });
  } else if (target.template_type === 'closing_soon') {
    html = getClosingSoonEmailHtml({
      competition: comp,
      recipientName: target.recipient_name,
      detailUrl,
    });
  } else if (target.template_type === 'saved_update') {
    html = getSavedUpdateEmailHtml({
      competition: comp,
      recipientName: target.recipient_name,
      detailUrl,
      changedFields: target.payload.changedFields || ['registration_deadline'],
      previousValues: target.payload.previousValues || {},
    });
  }

  const result = await sendRawEmail({
    to: target.recipient_email,
    subject: target.subject,
    html,
  });

  if (result.success) {
    db.updateNotificationStatus(notificationId, 'sent');
    return true;
  } else {
    db.updateNotificationStatus(notificationId, 'failed', result.error);
    return false;
  }
}

/**
 * Sends summary notification to Administrator following an automated discovery run
 */
export async function sendAdminDiscoveryEmail(params: {
  discoveredCompetitions: Competition[];
  runLog: DiscoveryLog;
}): Promise<void> {
  const { discoveredCompetitions, runLog } = params;
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@casehub.internal';
  const baseUrl = getAppBaseUrl();
  const adminDashboardUrl = `${baseUrl}/admin`;
  const subject = `Automated Discovery Summary: ${runLog.items_published} New Competitions Published | Case Hub`;

  const html = getAdminDiscoveryEmailHtml({
    discoveredCompetitions,
    runLog,
    adminDashboardUrl,
    baseUrl,
  });

  const notifLog = db.logNotification({
    recipient_email: adminEmail,
    recipient_name: 'Case Hub Administrator',
    subject,
    template_type: 'admin_discovery_summary',
    competition_id: discoveredCompetitions[0]?.id || 'system_discovery',
    status: 'pending',
    payload: {
      items_found: runLog.items_found,
      items_published: runLog.items_published,
      duplicates_skipped: runLog.duplicates_skipped,
      run_id: runLog.run_id,
      adminDashboardUrl,
    },
  });

  try {
    const result = await sendRawEmail({
      to: adminEmail,
      subject,
      html,
    });

    if (result.success) {
      db.updateNotificationStatus(notifLog.id, 'sent');
    } else {
      db.updateNotificationStatus(notifLog.id, 'failed', result.error);
    }
  } catch (err: any) {
    db.updateNotificationStatus(notifLog.id, 'failed', err.message || 'Unknown send error');
  }
}

