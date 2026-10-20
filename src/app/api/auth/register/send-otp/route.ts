import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/storage';
import { generateOtp, generateSecureToken, hashOtp } from '@/lib/auth/crypto';
import { sendOtpEmail } from '@/lib/email';

const sendOtpSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  email: z.string().trim().email('Please enter a valid email address'),
  programOfStudy: z.string().trim().min(2, 'Programme of study is required'),
  yearOfStudy: z.string().trim().min(1, 'Year of study is required'),
  phoneNumber: z.string().trim().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = sendOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input data' },
        { status: 400 }
      );
    }

    const { fullName, email, programOfStudy, yearOfStudy, phoneNumber } = parsed.data;
    const cleanEmail = email.toLowerCase().trim();

    // Check if account already exists with verified status and credentials
    const existingUser = db.getUserByEmail(cleanEmail);
    const existingCred = db.getAuthCredentialByEmail(cleanEmail);
    if (existingUser && existingUser.email_verified && existingCred) {
      return NextResponse.json(
        { error: 'An account with this email address already exists. Please sign in.' },
        { status: 400 }
      );
    }

    // Rate limiting: Check resend cooldown
    const existingVerif = db.getEmailVerificationByEmail(cleanEmail);
    if (existingVerif) {
      const cooldownRemainingMs = new Date(existingVerif.resend_available_at).getTime() - Date.now();
      if (cooldownRemainingMs > 0) {
        const secondsLeft = Math.ceil(cooldownRemainingMs / 1000);
        return NextResponse.json(
          { error: `Please wait ${secondsLeft} second${secondsLeft === 1 ? '' : 's'} before requesting another code.` },
          { status: 429 }
        );
      }
    }

    // Generate real 6-digit OTP
    const otp = generateOtp();
    const salt = generateSecureToken(16);
    const otpHash = hashOtp(otp, salt);
    const now = Date.now();

    // Verification record expires in 10 minutes, resend cooldown is 60 seconds
    const verificationRecord = {
      id: `verif_${now}_${Math.random().toString(36).substring(2, 6)}`,
      email: cleanEmail,
      otp_hash: otpHash,
      salt,
      attempts: 0,
      max_attempts: 5,
      resend_available_at: new Date(now + 60 * 1000).toISOString(),
      expires_at: new Date(now + 10 * 60 * 1000).toISOString(),
      created_at: new Date(now).toISOString(),
      full_name: fullName,
      program_of_study: programOfStudy,
      year_of_study: yearOfStudy,
      phone_number: phoneNumber || undefined,
      verified: false,
    };

    db.saveEmailVerification(verificationRecord);

    // Send email via configured provider
    const sendResult = await sendOtpEmail({
      to: cleanEmail,
      recipientName: fullName,
      otp,
    });

    if (!sendResult.success) {
      console.error(`[Auth] Failed to dispatch OTP email to ${cleanEmail}:`, sendResult.error);
      db.deleteEmailVerification(cleanEmail);
      return NextResponse.json(
        { error: sendResult.error || 'Failed to dispatch verification email. Please check server email configuration.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${cleanEmail}. Please check your inbox and spam folder.`,
      resendCooldown: 60,
    });
  } catch (err: any) {
    console.error('Error sending registration OTP:', err);
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred while sending verification code.' },
      { status: 500 }
    );
  }
}
