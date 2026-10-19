import { Competition, User } from '../db/types';
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
      <div style="margin-top: 4px;">Built for the HSB student community.</div>
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
      <div style="margin-top: 4px;">Built for the HSB student community.</div>
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
      <div style="margin-top: 4px;">Built for the HSB student community.</div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
