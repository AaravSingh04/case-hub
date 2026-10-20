import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/storage';
import { User, UserRole } from '@/lib/db/types';
import { hashPassword } from '@/lib/auth/crypto';
import { isAuthorizedAdminEmail, SESSION_COOKIE_NAME } from '@/lib/auth/server';

const completeRegistrationSchema = z
  .object({
    email: z.string().trim().email('Invalid email address'),
    verificationToken: z.string().trim().min(20, 'Invalid verification token'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Za-z]/, 'Password must contain at least one letter')
      .regex(/\d/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(8, 'Confirm password is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = completeRegistrationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid password or verification token' },
        { status: 400 }
      );
    }

    const { email, verificationToken, password } = parsed.data;
    const cleanEmail = email.toLowerCase().trim();

    // Verify token exists and email matches
    const verif = db.getEmailVerificationByToken(verificationToken);
    if (!verif || verif.email.toLowerCase() !== cleanEmail || !verif.verified) {
      return NextResponse.json(
        { error: 'Invalid or expired verification session. Please verify your email again.' },
        { status: 403 }
      );
    }

    // Determine secure role via server-side check (students CANNOT elevate themselves to admin!)
    const isAdmin = isAuthorizedAdminEmail(cleanEmail);
    const role: UserRole = isAdmin ? 'admin' : 'student';

    // Hash password with salt
    const { hash, salt } = hashPassword(password);

    // Existing user record or generate new user ID
    const existingUser = db.getUserByEmail(cleanEmail);
    const userId = existingUser?.id || `usr_student_${Date.now()}`;

    const user: User = {
      id: userId,
      email: cleanEmail,
      display_name: verif.full_name,
      phone_number: verif.phone_number || undefined,
      program_of_study: verif.program_of_study,
      year_of_study: verif.year_of_study,
      email_verified: true, // Marked verified by trusted server process
      role,
      created_at: existingUser?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Persist verified user record
    db.createUser(user);

    // Persist password credentials
    db.saveAuthCredential({
      user_id: userId,
      email: cleanEmail,
      password_hash: hash,
      salt,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Cleanup used verification record
    db.deleteEmailVerification(cleanEmail);

    // Issue authenticated session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Account created and verified successfully.',
      user,
    });

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
    console.error('Error completing registration:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to complete registration.' },
      { status: 500 }
    );
  }
}
