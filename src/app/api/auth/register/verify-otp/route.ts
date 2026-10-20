import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/storage';
import { generateSecureToken, hashOtp } from '@/lib/auth/crypto';

const verifyOtpSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  otp: z.string().trim().regex(/^\d{6}$/, 'Verification code must be exactly 6 digits'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = verifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid verification code format' },
        { status: 400 }
      );
    }

    const { email, otp } = parsed.data;
    const cleanEmail = email.toLowerCase().trim();
    const verif = db.getEmailVerificationByEmail(cleanEmail);

    if (!verif) {
      return NextResponse.json(
        { error: 'No verification request found for this email. Please request a code first.' },
        { status: 400 }
      );
    }

    // Check expiry
    if (Date.now() > new Date(verif.expires_at).getTime()) {
      return NextResponse.json(
        { error: 'Your verification code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    // Check maximum attempts rate limit
    if (verif.attempts >= verif.max_attempts) {
      return NextResponse.json(
        { error: 'Too many incorrect attempts. Please request a new verification code.' },
        { status: 429 }
      );
    }

    // Check code match
    const computedHash = hashOtp(otp, verif.salt);
    if (computedHash !== verif.otp_hash) {
      verif.attempts += 1;
      db.saveEmailVerification(verif);
      const remainingAttempts = verif.max_attempts - verif.attempts;
      return NextResponse.json(
        {
          error:
            remainingAttempts > 0
              ? `Invalid verification code. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`
              : 'Too many incorrect attempts. Please request a new code.',
        },
        { status: 400 }
      );
    }

    // Mark verified and issue verification token for Step 4 (Password Setup)
    const verificationToken = generateSecureToken(32);
    verif.verified = true;
    verif.verification_token = verificationToken;
    db.saveEmailVerification(verif);

    return NextResponse.json({
      success: true,
      message: 'Email address verified successfully.',
      verificationToken,
    });
  } catch (err: any) {
    console.error('Error verifying OTP:', err);
    return NextResponse.json(
      { error: err.message || 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
