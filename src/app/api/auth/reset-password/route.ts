import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/storage';
import { hashOtp, hashPassword } from '@/lib/auth/crypto';

const resetPasswordSchema = z
  .object({
    email: z.string().trim().email('Invalid email address'),
    otp: z.string().trim().regex(/^\d{6}$/, 'Verification code must be exactly 6 digits'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Za-z]/, 'Password must contain at least one letter')
      .regex(/\d/, 'Password must contain at least one number'),
    confirmNewPassword: z.string().min(8, 'Confirm password is required'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid data supplied' },
        { status: 400 }
      );
    }

    const { email, otp, newPassword } = parsed.data;
    const cleanEmail = email.toLowerCase().trim();
    const user = db.getUserByEmail(cleanEmail);

    if (!user) {
      return NextResponse.json({ error: 'User account not found.' }, { status: 404 });
    }

    const verif = db.getEmailVerificationByEmail(cleanEmail);
    if (!verif) {
      return NextResponse.json(
        { error: 'No active reset session found. Please request a new code.' },
        { status: 400 }
      );
    }

    if (Date.now() > new Date(verif.expires_at).getTime()) {
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    if (verif.attempts >= verif.max_attempts) {
      return NextResponse.json(
        { error: 'Too many incorrect attempts. Please request a new code.' },
        { status: 429 }
      );
    }

    const computedHash = hashOtp(otp, verif.salt);
    if (computedHash !== verif.otp_hash) {
      verif.attempts += 1;
      db.saveEmailVerification(verif);
      return NextResponse.json(
        { error: 'Invalid verification code. Please check and try again.' },
        { status: 400 }
      );
    }

    // Hash new password and update credentials
    const { hash, salt } = hashPassword(newPassword);
    db.saveAuthCredential({
      user_id: user.id,
      email: cleanEmail,
      password_hash: hash,
      salt,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    db.deleteEmailVerification(cleanEmail);

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You may now sign in with your new password.',
    });
  } catch (err: any) {
    console.error('Reset password error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to reset password.' },
      { status: 500 }
    );
  }
}
