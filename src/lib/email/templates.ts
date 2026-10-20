import { Competition, User, DiscoveryLog } from '../db/types';
import { formatDate, formatDateTime } from '../utils';

export function getAdminUploadEmailHtml(params: {
  competition: Competition;
  uploaderEmail: string;
  detailUrl: string;
}): string {
  const { competition: c, uploaderEmail, detailUrl } = params;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>New Competition Uploaded — ${c.name} | Case Hub</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F7F4EC; margin: 0; padding: 24px; color: #202C3B; }
    .container { max-width: 640px; margin: 0 auto; background: #FFFFFF; border: 1px solid #DCD6CA; border-radius: 4px; overflow: hidden; }
    .header { background: #102747; padding: 36px 32px; text-align: center; }
    .wordmark { color: #FFFFFF; font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 700; letter-spacing: 0.5px; margin: 0; }
    .tagline { color: #AC925B; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; margin-top: 6px; font-weight: 600; }
    .body { padding: 32px; }
    .badge { display: inline-block; background: #EEE9DE; color: #102747; padding: 4px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border-radius: 2px; margin-bottom: 12px; }
    .title { font-family: 'Playfair Display', Georgia, serif; font-size: 24px; color: #0A1930; margin: 0 0 8px 0; line-height: 1.3; }
    .organizer { color: #737985; font-size: 15px; margin-bottom: 20px; font-weight: 500; }
    .poster { width: 100%; max-height: 320px; object-fit: cover; border-radius: 4px; border: 1px solid #DCD6CA; margin-bottom: 24px; }
    .desc { font-size: 15px; line-height: 1.6; color: #202C3B; margin-bottom: 24px; }
    .grid { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
    .grid td { padding: 10px 12px; border-bottom: 1px solid #EEE9DE; font-size: 14px; }
    .grid td.label { width: 38%; color: #737985; font-weight: 600; }
    .grid td.val { color: #0A1930; font-weight: 500; }
    .cta-container { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background-color: #102747; color: #FFFFFF !important; text-decoration: none; padding: 14px 28px; font-size: 15px; font-weight: 600; border-radius: 4px; letter-spacing: 0.3px; }
    .btn:hover { background-color: #1C3557; }
    .notice { background: #FCFAF6; border-left: 3px solid #AC925B; padding: 12px 16px; font-size: 13px; color: #737985; margin-bottom: 24px; }
    .footer { background: #EEE9DE; padding: 24px; text-align: center; font-size: 12px; color: #737985; border-top: 1px solid #DCD6CA; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="wordmark">Case Hub</h1>
      <div class="tagline">Discover. Share. Compete.</div>
    </div>
    <div class="body">
      <span class="badge">Immediate Student Publication</span>
      <h2 class="title">${c.name}</h2>
      <div class="organizer">Organized by ${c.organizer}</div>

      ${c.poster_url ? `<img src="${c.poster_url}" alt="${c.name} Poster" class="poster" />` : ''}

      <div class="desc">${c.description}</div>

      <table class="grid">
        <tr>
          <td class="label">Category</td>
          <td class="val">${c.category} ${c.industry ? `(${c.industry})` : ''}</td>
        </tr>
        <tr>
          <td class="label">Registration Deadline</td>
          <td class="val"><strong>${formatDate(c.registration_deadline)}</strong></td>
        </tr>
        ${c.event_start_date ? `
        <tr>
          <td class="label">Event Dates</td>
          <td class="val">${formatDate(c.event_start_date)} ${c.event_end_date ? `– ${formatDate(c.event_end_date)}` : ''}</td>
        </tr>` : ''}
        <tr>
          <td class="label">Competition Mode</td>
          <td class="val">${c.mode} ${c.location ? `(${c.location})` : ''}</td>
        </tr>
        <tr>
          <td class="label">Team Size</td>
          <td class="val">${c.min_team_size === c.max_team_size ? `${c.min_team_size} members` : `${c.min_team_size} – ${c.max_team_size} members`}</td>
        </tr>
        <tr>
          <td class="label">Eligibility</td>
          <td class="val">${c.eligibility}</td>
        </tr>
        <tr>
          <td class="label">Prize Details</td>
          <td class="val">${c.prize_details || 'N/A'}</td>
        </tr>
        <tr>
          <td class="label">Participation Fee</td>
          <td class="val">${c.entry_fee || 'Free'}</td>
        </tr>
        <tr>
          <td class="label">Official Registration Link</td>
          <td class="val" style="word-break: break-all;"><a href="${c.official_registration_url}" style="color: #102747;">${c.official_registration_url}</a></td>
        </tr>
        <tr>
          <td class="label">Uploader Display Name</td>
          <td class="val">${c.uploader_display_name}</td>
        </tr>
        <tr>
          <td class="label">Uploader Email</td>
          <td class="val"><a href="mailto:${uploaderEmail}" style="color: #102747;">${uploaderEmail}</a></td>
        </tr>
        <tr>
          <td class="label">Submission Timestamp</td>
          <td class="val">${formatDateTime(c.created_at)}</td>
        </tr>
      </table>

      <div class="notice">
        <strong>Publishing Status:</strong> This competition was validated and published instantly to the Case Hub catalog. As an administrator, you may review the details or moderate if necessary.
      </div>

      <div class="cta-container">
        <a href="${detailUrl}" class="btn" target="_blank" rel="noopener noreferrer">View Competition on Case Hub</a>
      </div>
    </div>
    <div class="footer">
      <div>Case Hub — Discover. Share. Compete.</div>
      <div style="margin-top: 4px;">Connecting ambitious business students with premier case competitions.</div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function getClosingSoonEmailHtml(params: {
  competition: Competition;
  recipientName: string;
  detailUrl: string;
}): string {
  const { competition: c, recipientName, detailUrl } = params;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Closing Soon: ${c.name} | Case Hub</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F7F4EC; margin: 0; padding: 24px; color: #202C3B; }
    .container { max-width: 640px; margin: 0 auto; background: #FFFFFF; border: 1px solid #DCD6CA; border-radius: 4px; overflow: hidden; }
    .header { background: #102747; padding: 32px; text-align: center; }
    .wordmark { color: #FFFFFF; font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 700; margin: 0; }
    .tagline { color: #AC925B; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; margin-top: 6px; font-weight: 600; }
    .body { padding: 32px; }
    .badge-urgent { display: inline-block; background: #FDE8E8; color: #A94343; padding: 4px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border-radius: 2px; margin-bottom: 12px; }
    .title { font-family: 'Playfair Display', Georgia, serif; font-size: 22px; color: #0A1930; margin: 0 0 8px 0; }
    .organizer { color: #737985; font-size: 14px; margin-bottom: 20px; }
    .poster { width: 100%; max-height: 280px; object-fit: cover; border-radius: 4px; border: 1px solid #DCD6CA; margin-bottom: 20px; }
    .desc { font-size: 14px; line-height: 1.6; color: #202C3B; margin-bottom: 20px; }
    .deadline-box { background: #FCFAF6; border: 1px solid #DCD6CA; border-left: 4px solid #A94343; padding: 16px; margin-bottom: 24px; }
    .deadline-title { font-size: 12px; text-transform: uppercase; color: #737985; font-weight: 700; letter-spacing: 1px; }
    .deadline-val { font-size: 18px; font-weight: 700; color: #A94343; margin-top: 4px; }
    .cta-container { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background-color: #102747; color: #FFFFFF !important; text-decoration: none; padding: 14px 28px; font-size: 15px; font-weight: 600; border-radius: 4px; }
    .footer { background: #EEE9DE; padding: 20px; text-align: center; font-size: 12px; color: #737985; border-top: 1px solid #DCD6CA; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="wordmark">Case Hub</h1>
      <div class="tagline">Discover. Share. Compete.</div>
    </div>
    <div class="body">
      <span class="badge-urgent">Closing in under 48 Hours</span>
      <h2 class="title">${c.name}</h2>
      <div class="organizer">Organized by ${c.organizer}</div>

      <p style="font-size: 15px;">Hello ${recipientName},</p>
      <p style="font-size: 14px; color: #737985;">This is an automated alert from Case Hub. Registration for the following competition is closing within the next 48 hours:</p>

      ${c.poster_url ? `<img src="${c.poster_url}" alt="${c.name} Poster" class="poster" />` : ''}

      <div class="deadline-box">
        <div class="deadline-title">Registration Deadline</div>
        <div class="deadline-val">${formatDateTime(c.registration_deadline)}</div>
      </div>

      <div class="desc">${c.description}</div>

      <div class="cta-container">
        <a href="${detailUrl}" class="btn" target="_blank" rel="noopener noreferrer">View Competition on Case Hub</a>
      </div>
    </div>
    <div class="footer">
      <div>Case Hub — Discover. Share. Compete.</div>
      <div style="margin-top: 4px;">Connecting ambitious business students with premier case competitions.</div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function getSavedUpdateEmailHtml(params: {
  competition: Competition;
  recipientName: string;
  detailUrl: string;
  changedFields: string[];
  previousValues: Record<string, any>;
}): string {
  const { competition: c, recipientName, detailUrl, changedFields, previousValues } = params;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Update to Saved Competition: ${c.name} | Case Hub</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F7F4EC; margin: 0; padding: 24px; color: #202C3B; }
    .container { max-width: 640px; margin: 0 auto; background: #FFFFFF; border: 1px solid #DCD6CA; border-radius: 4px; overflow: hidden; }
    .header { background: #102747; padding: 32px; text-align: center; }
    .wordmark { color: #FFFFFF; font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 700; margin: 0; }
    .tagline { color: #AC925B; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; margin-top: 6px; font-weight: 600; }
    .body { padding: 32px; }
    .badge { display: inline-block; background: #E6EFF8; color: #102747; padding: 4px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border-radius: 2px; margin-bottom: 12px; }
    .title { font-family: 'Playfair Display', Georgia, serif; font-size: 22px; color: #0A1930; margin: 0 0 8px 0; }
    .change-table { width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #DCD6CA; }
    .change-table th { background: #EEE9DE; text-align: left; padding: 10px 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #102747; }
    .change-table td { padding: 10px 12px; border-top: 1px solid #EEE9DE; font-size: 14px; }
    .old-val { color: #A94343; text-decoration: line-through; }
    .new-val { color: #355C48; font-weight: 600; }
    .cta-container { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background-color: #102747; color: #FFFFFF !important; text-decoration: none; padding: 14px 28px; font-size: 15px; font-weight: 600; border-radius: 4px; }
    .footer { background: #EEE9DE; padding: 20px; text-align: center; font-size: 12px; color: #737985; border-top: 1px solid #DCD6CA; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="wordmark">Case Hub</h1>
      <div class="tagline">Discover. Share. Compete.</div>
    </div>
    <div class="body">
      <span class="badge">Saved Opportunity Notice</span>
      <h2 class="title">${c.name}</h2>
      <p style="font-size: 15px;">Hello ${recipientName},</p>
      <p style="font-size: 14px; color: #737985;">Important dates or schedule details have been updated for a competition in your saved list:</p>

      <table class="change-table">
        <thead>
          <tr>
            <th>Field</th>
            <th>Previous Schedule</th>
            <th>Updated Schedule</th>
          </tr>
        </thead>
        <tbody>
          ${changedFields.map((field) => {
            const label = field === 'registration_deadline' ? 'Registration Deadline' : field === 'event_start_date' ? 'Event Start Date' : 'Event End Date';
            const oldVal = formatDate(previousValues[field]);
            const newVal = formatDate((c as any)[field]);
            return `
              <tr>
                <td><strong>${label}</strong></td>
                <td class="old-val">${oldVal}</td>
                <td class="new-val">${newVal}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <div class="cta-container">
        <a href="${detailUrl}" class="btn" target="_blank" rel="noopener noreferrer">View Competition on Case Hub</a>
      </div>
    </div>
    <div class="footer">
      <div>Case Hub — Discover. Share. Compete.</div>
      <div style="margin-top: 4px;">Connecting ambitious business students with premier case competitions.</div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function getAdminDiscoveryEmailHtml(params: {
  discoveredCompetitions: Competition[];
  runLog: DiscoveryLog;
  adminDashboardUrl: string;
  baseUrl: string;
}): string {
  const { discoveredCompetitions, runLog, adminDashboardUrl, baseUrl } = params;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Automated Discovery Summary — Case Hub</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F7F4EC; margin: 0; padding: 24px; color: #202C3B; }
    .container { max-width: 680px; margin: 0 auto; background: #FFFFFF; border: 1px solid #DCD6CA; border-radius: 4px; overflow: hidden; }
    .header { background: #102747; padding: 32px; text-align: center; }
    .wordmark { color: #FFFFFF; font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 700; margin: 0; }
    .tagline { color: #AC925B; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; margin-top: 6px; font-weight: 600; }
    .body { padding: 32px; }
    .badge { display: inline-block; background: #355C48; color: #FFFFFF; padding: 4px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border-radius: 2px; margin-bottom: 12px; }
    .title { font-family: 'Playfair Display', Georgia, serif; font-size: 24px; color: #0A1930; margin: 0 0 8px 0; }
    .subtitle { color: #737985; font-size: 14px; margin-bottom: 24px; }
    .stat-row { display: flex; gap: 12px; margin-bottom: 24px; }
    .stat-box { flex: 1; background: #FCFAF6; border: 1px solid #DCD6CA; padding: 12px; text-align: center; border-radius: 4px; }
    .stat-val { font-size: 20px; font-weight: 700; color: #102747; }
    .stat-lbl { font-size: 11px; text-transform: uppercase; color: #737985; letter-spacing: 0.5px; margin-top: 4px; }
    .comp-item { border: 1px solid #DCD6CA; border-radius: 4px; padding: 16px; margin-bottom: 14px; background: #FCFAF6; }
    .comp-title { font-family: 'Playfair Display', Georgia, serif; font-size: 17px; font-weight: 700; color: #0A1930; margin: 0 0 4px 0; }
    .comp-meta { font-size: 13px; color: #737985; margin-bottom: 8px; }
    .comp-deadline { font-size: 13px; font-weight: 600; color: #355C48; }
    .comp-link { display: inline-block; margin-top: 10px; font-size: 13px; font-weight: 600; color: #102747; text-decoration: underline; }
    .cta-container { text-align: center; margin: 32px 0 16px 0; }
    .btn { display: inline-block; background-color: #102747; color: #FFFFFF !important; text-decoration: none; padding: 14px 28px; font-size: 15px; font-weight: 600; border-radius: 4px; }
    .footer { background: #EEE9DE; padding: 20px; text-align: center; font-size: 12px; color: #737985; border-top: 1px solid #DCD6CA; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="wordmark">Case Hub</h1>
      <div class="tagline">Discover. Share. Compete.</div>
    </div>
    <div class="body">
      <span class="badge">Automated Discovery Run</span>
      <h2 class="title">Competition Discovery Summary</h2>
      <div class="subtitle">Completed on ${formatDateTime(runLog.completed_at)} • Source: ${runLog.source}</div>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 10px; background: #FCFAF6; border: 1px solid #DCD6CA; text-align: center; width: 33%;">
            <div style="font-size: 20px; font-weight: 700; color: #102747;">${runLog.items_found}</div>
            <div style="font-size: 11px; text-transform: uppercase; color: #737985; margin-top: 4px;">Found</div>
          </td>
          <td style="padding: 10px; background: #FCFAF6; border: 1px solid #DCD6CA; text-align: center; width: 33%; border-left: none;">
            <div style="font-size: 20px; font-weight: 700; color: #355C48;">${runLog.items_published}</div>
            <div style="font-size: 11px; text-transform: uppercase; color: #737985; margin-top: 4px;">Published</div>
          </td>
          <td style="padding: 10px; background: #FCFAF6; border: 1px solid #DCD6CA; text-align: center; width: 33%; border-left: none;">
            <div style="font-size: 20px; font-weight: 700; color: #737985;">${runLog.duplicates_skipped}</div>
            <div style="font-size: 11px; text-transform: uppercase; color: #737985; margin-top: 4px;">Duplicates Skipped</div>
          </td>
        </tr>
      </table>

      ${discoveredCompetitions.length > 0 ? `
        <h3 style="font-size: 16px; color: #102747; margin-bottom: 12px; font-family: 'Playfair Display', Georgia, serif;">Newly Published Competitions</h3>
        ${discoveredCompetitions.map((c) => `
          <div class="comp-item">
            <div class="comp-title">${c.name}</div>
            <div class="comp-meta">Organized by ${c.organizer} • ${c.category} • ${c.mode}</div>
            <div class="comp-deadline">Registration Deadline: ${formatDate(c.registration_deadline)}</div>
            <div>
              <a href="${baseUrl}/competitions/${c.id}" class="comp-link" target="_blank" rel="noopener noreferrer">View Competition on Case Hub &rarr;</a>
            </div>
          </div>
        `).join('')}
      ` : `
        <p style="font-size: 14px; color: #737985; font-style: italic;">No new unique competitions were found in this scheduled run.</p>
      `}

      <div class="cta-container">
        <a href="${adminDashboardUrl}" class="btn" target="_blank" rel="noopener noreferrer">Open Admin Dashboard</a>
      </div>
    </div>
    <div class="footer">
      <div>Case Hub — Discover. Share. Compete.</div>
      <div style="margin-top: 4px;">Connecting ambitious business students with premier case competitions.</div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function getOtpEmailHtml(params: {
  recipientName: string;
  otp: string;
}): string {
  const { recipientName, otp } = params;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Your Case Hub Verification Code</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F7F4EC; margin: 0; padding: 24px; color: #202C3B; }
    .container { max-width: 540px; margin: 0 auto; background: #FFFFFF; border: 1px solid #DCD6CA; border-radius: 4px; overflow: hidden; }
    .header { background: #102747; padding: 32px; text-align: center; }
    .wordmark { color: #FFFFFF; font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 700; margin: 0; }
    .tagline { color: #AC925B; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; margin-top: 6px; font-weight: 600; }
    .body { padding: 36px 32px; text-align: center; }
    .title { font-family: 'Playfair Display', Georgia, serif; font-size: 22px; color: #0A1930; margin: 0 0 12px 0; }
    .greeting { font-size: 15px; color: #202C3B; margin-bottom: 20px; }
    .code-box { background: #F7F4EC; border: 1px solid #DCD6CA; border-radius: 6px; padding: 20px; margin: 28px 0; display: inline-block; min-width: 240px; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 700; color: #102747; letter-spacing: 8px; margin: 0; }
    .expiry { font-size: 13px; color: #737985; margin-top: 16px; }
    .security-note { font-size: 12px; color: #737985; line-height: 1.5; margin-top: 24px; padding-top: 20px; border-top: 1px solid #EEE9DE; }
    .footer { background: #EEE9DE; padding: 20px; text-align: center; font-size: 12px; color: #737985; border-top: 1px solid #DCD6CA; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="wordmark">Case Hub</h1>
      <div class="tagline">Discover. Share. Compete.</div>
    </div>
    <div class="body">
      <h2 class="title">Verify Your Email Address</h2>
      <p class="greeting">Hello ${recipientName || 'Student'},</p>
      <p style="font-size: 14px; color: #737985; max-width: 420px; margin: 0 auto;">
        Please use the following six-digit verification code to complete your registration on Case Hub:
      </p>

      <div class="code-box">
        <div class="otp-code">${otp}</div>
      </div>

      <div class="expiry">
        This code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.
      </div>

      <div class="security-note">
        If you did not request this verification code, please ignore this email or contact support.
      </div>
    </div>
    <div class="footer">
      <div>Case Hub — Discover. Share. Compete.</div>
      <div style="margin-top: 4px;">Academic competition and case preparation platform for MBA students.</div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

