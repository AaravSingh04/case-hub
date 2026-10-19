import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/storage';
import { SESSION_COOKIE_NAME } from '@/lib/auth/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, email } = body;

    let user = null;

    if (userId) {
      user = db.getUserById(userId);
    } else if (email && typeof email === 'string') {
      const cleanEmail = email.trim().toLowerCase();
      user = db.getUserByEmail(cleanEmail);

      // If user doesn't exist, create a new student account
      if (!user) {
        const id = `usr_student_${Date.now()}`;
        const displayName = cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        const newUser = {
          id,
          email: cleanEmail,
          display_name: displayName,
          role: 'student' as const, // Strict rule: public login cannot set admin
          program_of_study: 'MBA Student',
          year_of_study: 'Year 1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const state = (db as any);
        // Save into db
        user = newUser;
        // Also add to users table
        const allUsers = db.getUsers();
        allUsers.push(user);
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const response = NextResponse.json({ user });
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: user.id,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
