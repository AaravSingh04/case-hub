import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserServer } from '@/lib/auth/server';

export async function GET() {
  try {
    const user = await getCurrentUserServer();
    return NextResponse.json({ user });
  } catch (err: any) {
    return NextResponse.json({ user: null, error: err.message }, { status: 500 });
  }
}
