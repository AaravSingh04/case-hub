import { Competition, User, DiscoveryLog } from '../db/types';
import { db } from '../db/storage';
import { getAppBaseUrl } from '../utils';
import { getAdminNotificationEmails } from '../auth/server';
import {
  getAdminUploadEmailHtml,
  getClosingSoonEmailHtml,
  getSavedUpdateEmailHtml,
  getAdminDiscoveryEmailHtml,
  getOtpEmailHtml,
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
  console.log(`\n======================================================`);
  console.log(`[CASE HUB EMAIL DISPATCH] (Simulated Outbox)`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`======================================================\n`);

  return { success: true, messageId: `sim_${Date.now()}` };
}

/**
 * Sends real 6-digit email OTP verification code to student during registration or password reset
 */
export async function sendOtpEmail(params: {
  to: string;
  recipientName: string;
  otp: string;
}): Promise<SendEmailResult> {
  const { to, recipientName, otp } = params;
  const subject = `Your Case Hub Verification Code: ${otp}`;
  const html = getOtpEmailHtml({ recipientName, otp });

  return sendRawEmail({
    to,
    subject,
    html,
  });
}

/**
 * Sends automatic notification to Administrator when a student publishes a competition
 */
export async function sendAdminNewUploadNotification(
  competition: Competition,
  uploaderEmail: string
): Promise<void> {
  const adminEmails = getAdminNotificationEmails();
  const baseUrl = getAppBaseUrl();
  const detailUrl = `${baseUrl}/competitions/${competition.id}`;
  const subject = `New Competition Uploaded — ${competition.name} | Case Hub`;

  const html = getAdminUploadEmailHtml({
    competition,
    uploaderEmail,
    detailUrl,
  });

  for (const adminEmail of adminEmails) {
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
}

/**
 * Sends automatic notification to Administrator for each published discovered competition (Req 13)
 */
export async function sendAdminNewDiscoveryNotification(
  competition: Competition
): Promise<void> {
  const adminEmails = getAdminNotificationEmails();
  const baseUrl = getAppBaseUrl();
  const detailUrl = `${baseUrl}/competitions/${competition.id}`;
  const subject = `New Competition Published — ${competition.name} | Case Hub`;

  const html = getAdminUploadEmailHtml({
    competition,
    uploaderEmail: 'automated-discovery@casehub.internal',
    detailUrl,
  });

  for (const adminEmail of adminEmails) {
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
        source: competition.discovery_source || 'Unstop',
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
}

/**
 * Sends 48-hour closing-soon reminder to all registered users with verified emails
 */
export async function sendClosingSoonReminder(
  competition: Competition,
  recipient: User
): Promise<void> {
  const baseUrl = getAppBaseUrl();
  const detailUrl = `${baseUrl}/competitions/${competition.id}`;
  const subject = `Closing Soon: ${competition.name} — 48-Hour Reminder | Case Hub`;

  const html = getClosingSoonEmailHtml({
    competition,
    recipientName: recipient.display_name,
    detailUrl,
  });

  const notifLog = db.logNotification({
    recipient_email: recipient.email,
    recipient_name: recipient.display_name,
    user_id: recipient.id,
    subject,
    template_type: 'closing_soon',
    competition_id: competition.id,
    status: 'pending',
    payload: {
      competitionId: competition.id,
      competitionName: competition.name,
      deadline: competition.registration_deadline,
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
  const subject = `Schedule Update: ${competition.name} | Case Hub`;

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
    user_id: recipient.id,
    subject,
    template_type: 'saved_update',
    competition_id: competition.id,
    status: 'pending',
    payload: {
      competitionId: competition.id,
      competitionName: competition.name,
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
 * Sends summary notification to Administrator following an automated discovery run
 */
export async function sendAdminDiscoveryEmail(params: {
  discoveredCompetitions: Competition[];
  runLog: DiscoveryLog;
}): Promise<void> {
  const { discoveredCompetitions, runLog } = params;
  const adminEmails = getAdminNotificationEmails();
  const baseUrl = getAppBaseUrl();
  const adminDashboardUrl = `${baseUrl}/admin`;
  const subject = `Automated Discovery Summary: ${runLog.items_published} New Competitions Published | Case Hub`;

  const html = getAdminDiscoveryEmailHtml({
    discoveredCompetitions,
    runLog,
    adminDashboardUrl,
    baseUrl,
  });

  for (const adminEmail of adminEmails) {
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
}

/**
 * Retry a failed notification from the Admin Dashboard
 */
export async function retryNotification(notificationId: string): Promise<boolean> {
  const logs = db.getNotificationLogs();
  const target = logs.find((l) => l.id === notificationId);
  if (!target) return false;

  const comp = db.getCompetitionById(target.competition_id);
  const baseUrl = getAppBaseUrl();
  const detailUrl = comp ? `${baseUrl}/competitions/${comp.id}` : baseUrl;

  let html = '';
  if (target.template_type === 'admin_new_upload' && comp) {
    const meta = db.getCompetitionPrivateMetadata(comp.id);
    html = getAdminUploadEmailHtml({
      competition: comp,
      uploaderEmail: meta?.uploader_email || 'student@casehub.internal',
      detailUrl,
    });
  } else if (target.template_type === 'closing_soon' && comp) {
    html = getClosingSoonEmailHtml({
      competition: comp,
      recipientName: target.recipient_name,
      detailUrl,
    });
  } else if (target.template_type === 'saved_update' && comp) {
    html = getSavedUpdateEmailHtml({
      competition: comp,
      recipientName: target.recipient_name,
      detailUrl,
      changedFields: target.payload?.changedFields || ['registration_deadline'],
      previousValues: target.payload?.previousValues || {},
    });
  } else {
    html = `<div style="font-family: serif; color: #0A1930; padding: 24px;">
      <h2>Notification Resend: ${target.subject}</h2>
      <p>Original template: ${target.template_type}</p>
      <p>Timestamp: ${new Date().toLocaleString()}</p>
    </div>`;
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

