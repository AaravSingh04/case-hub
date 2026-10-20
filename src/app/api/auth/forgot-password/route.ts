import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/storage';
import { generateOtp, generateSecureToken, hashOtp } from '@/lib/auth/crypto';
import { sendOtpEmail } from '@/lib/email';

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid email address' },
        { status: 400 }
      );
    }

    const cleanEmail = parsed.data.email.toLowerCase().trim();
    const user = db.getUserByEmail(cleanEmail);

    // Generic safe response to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a verification code has been sent.',
      });
    }

    // Rate limiting: Check cooldown
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

    const otp = generateOtp();
    const salt = generateSecureToken(16);
    const otpHash = hashOtp(otp, salt);
    const now = Date.now();

    db.saveEmailVerification({
      id: `verif_reset_${now}_${Math.random().toString(36).substring(2, 6)}`,
      email: cleanEmail,
      otp_hash: otpHash,
      salt,
      attempts: 0,
      max_attempts: 5,
      resend_available_at: new Date(now + 60 * 1000).toISOString(),
      expires_at: new Date(now + 10 * 60 * 1000).toISOString(),
      created_at: new Date(now).toISOString(),
      full_name: user.display_name,
      program_of_study: user.program_of_study || '',
      year_of_study: user.year_of_study || '',
      verified: false,
    });

    await sendOtpEmail({
      to: cleanEmail,
      recipientName: user.display_name,
      otp,
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[CASE HUB DEV RESET] Reset code for ${cleanEmail} is: ${otp}`);
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a verification code has been sent.',
      resendCooldown: 60,
    });
  } catch (err: any) {
    console.error('Forgot password error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to process password reset request.' },
      { status: 500 }
    );
  }
}
