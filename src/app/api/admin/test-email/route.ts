import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUserServer, getAdminNotificationEmails } from '@/lib/auth/server';
import { sendRawEmail, getResendApiKey, getSenderEmail } from '@/lib/email';
import { db } from '@/lib/db/storage';

/**
 * GET /api/admin/test-email
 * Returns live email configuration status for administrator inspection
 */
export async function GET() {
  try {
    const adminUser = await requireAdminUserServer();
    const apiKey = getResendApiKey();
    const from = getSenderEmail();
    const notificationRecipients = getAdminNotificationEmails();

    return NextResponse.json({
      configured: Boolean(apiKey),
      apiKeyMasked: apiKey ? `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}` : null,
      from,
      notificationRecipients,
      isDefaultSender: from.includes('onboarding@resend.dev'),
    });
  } catch (err: any) {
    const status = err.message?.includes('Authentication required') ? 401 : 403;
    return NextResponse.json({ error: err.message || 'Unauthorized access' }, { status });
  }
}

/**
 * POST /api/admin/test-email
 * Secure test-email dispatch endpoint for authorized administrators
 */
export async function POST(req: NextRequest) {
  try {
    const adminUser = await requireAdminUserServer();
    const body = await req.json().catch(() => ({}));
    const recipient = body.recipientEmail?.trim() || adminUser.email;

    const apiKey = getResendApiKey();
    const from = getSenderEmail();

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email service is not configured: RESEND_API_KEY is missing from environment variables. Please configure RESEND_API_KEY in your Vercel Project Settings.',
          config: {
            hasApiKey: false,
            from,
            recipient,
          },
        },
        { status: 503 }
      );
    }

    const testSubject = `Case Hub Diagnostic Test Email — ${new Date().toLocaleTimeString()}`;
    const testHtml = `
      <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: #FAF9F6; border: 1px solid #E2D9CC; padding: 32px; border-radius: 8px;">
        <h1 style="color: #0A1930; font-size: 24px; margin-bottom: 8px;">Case Hub — Email System Test</h1>
        <p style="color: #64748B; font-size: 14px; margin-top: 0;">Automated Administrative Diagnostic Dispatch</p>
        <hr style="border: none; border-top: 1px solid #E2D9CC; margin: 20px 0;" />
        <p style="color: #1E293B; font-size: 15px; line-height: 1.6;">
          Hello <strong>${adminUser.display_name}</strong>,
        </p>
        <p style="color: #1E293B; font-size: 15px; line-height: 1.6;">
          This is an official diagnostic dispatch confirming that your <strong>Resend transactional email delivery engine</strong> is properly integrated and operational in Case Hub.
        </p>
        <div style="background: #FFFFFF; border-left: 4px solid #AC925B; padding: 16px; margin: 24px 0; border-radius: 4px;">
          <p style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>Sender (EMAIL_FROM):</strong> ${from}</p>
          <p style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>Recipient:</strong> ${recipient}</p>
          <p style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>Dispatched At:</strong> ${new Date().toISOString()}</p>
          <p style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>Admin Operator:</strong> ${adminUser.email}</p>
        </div>
        <p style="color: #64748B; font-size: 13px; margin-top: 24px;">
          If this message is present in your inbox, students will successfully receive their six-digit OTP verification codes.
        </p>
      </div>
    `;

    const result = await sendRawEmail({
      to: recipient,
      subject: testSubject,
      html: testHtml,
    });

    // Log diagnostic dispatch in notification outbox
    db.logNotification({
      recipient_email: recipient,
      recipient_name: adminUser.display_name,
      user_id: adminUser.id,
      subject: testSubject,
      template_type: 'admin_test_diagnostic',
      competition_id: 'system_diagnostic',
      status: result.success ? 'sent' : 'failed',
      error_message: result.error,
      payload: {
        messageId: result.messageId,
        from,
        recipient,
        operator: adminUser.email,
      },
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          config: {
            hasApiKey: true,
            from,
            recipient,
          },
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: `Diagnostic test email was successfully dispatched to ${recipient} via Resend.`,
      config: {
        hasApiKey: true,
        from,
        recipient,
      },
    });
  } catch (err: any) {
    const status = err.message?.includes('Authentication required')
      ? 401
      : err.message?.includes('Administrator')
      ? 403
      : 500;
    return NextResponse.json(
      { success: false, error: err.message || 'Unauthorized access' },
      { status }
    );
  }
}
