import { NextRequest, NextResponse } from 'next/server';
import { runAutomatedDiscovery } from '@/lib/discovery';
import { getCurrentUserServer } from '@/lib/auth/server';
import { db } from '@/lib/db/storage';

export const dynamic = 'force-dynamic';

async function isAuthorized(request: NextRequest): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  // If CRON_SECRET is configured, check bearer token
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // Also check if request comes from logged-in admin
  const user = await getCurrentUserServer();
  if (user && user.role === 'admin') {
    return true;
  }

  // In development without secret, permit local invocations
  if (process.env.NODE_ENV !== 'production' && !cronSecret) {
    return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized invocation' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const force = searchParams.get('force') === 'true';

  try {
    const result = await runAutomatedDiscovery({ force });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Discovery run failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized invocation' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const force = Boolean(body.force);

    if (body.interval_days) {
      db.updateDiscoveryConfig({ interval_days: Number(body.interval_days) });
    }

    if (body.enabled !== undefined) {
      db.updateDiscoveryConfig({ enabled: Boolean(body.enabled) });
    }

    const result = await runAutomatedDiscovery({ force });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Discovery run failed' },
      { status: 500 }
    );
  }
}
