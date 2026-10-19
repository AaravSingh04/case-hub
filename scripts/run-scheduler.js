/**
 * CASE HUB — Standalone CLI Scheduler Runner
 * Usage: node scripts/run-scheduler.js
 */
const http = require('http');

async function triggerCron() {
  const url = process.env.CRON_URL || 'http://localhost:3000/api/cron/closing-soon';
  const secret = process.env.CRON_SECRET || 'case_hub_cron_secret_key';

  console.log(`[Case Hub Scheduler] Triggering job at: ${url}`);

  try {
    const fetch = globalThis.fetch || require('node-fetch');
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
      },
    });

    const data = await res.json();
    console.log('[Case Hub Scheduler Result]:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('[Case Hub Scheduler Error]:', err.message);
  }
}

triggerCron();
