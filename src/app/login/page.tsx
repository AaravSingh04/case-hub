'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Phone,
  GraduationCap,
  Calendar,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

type AuthMode = 'signin' | 'register' | 'forgot_password';
type RegisterStep = 'details' | 'otp' | 'password';
type ResetStep = 'request' | 'confirm';

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  const { refreshUser } = useAuth();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Sign In State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register State
  const [regStep, setRegStep] = useState<RegisterStep>('details');
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [programOfStudy, setProgramOfStudy] = useState('MBA Core Strategy');
  const [yearOfStudy, setYearOfStudy] = useState('Year 1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Forgot Password State
  const [resetStep, setResetStep] = useState<ResetStep>('request');
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Handle Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail.trim() || !signInPassword) {
      setError('Please provide both your email address and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signInEmail.trim(),
          password: signInPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Authentication failed. Please verify your credentials.');
        return;
      }

      await refreshUser();
      router.push(redirectUrl);
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1 -> 2: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !regEmail.trim()) {
      setError('Full name and a valid university email address are required.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      const res = await fetch('/api/auth/register/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: regEmail.trim(),
          programOfStudy,
          yearOfStudy,
          phoneNumber: phoneNumber.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not send verification code.');
        return;
      }

      setCooldown(data.resendCooldown || 60);
      setSuccessMessage(data.message || `Verification code sent to ${regEmail}.`);
      setRegStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      const res = await fetch('/api/auth/register/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: regEmail.trim(),
          programOfStudy,
          yearOfStudy,
          phoneNumber: phoneNumber.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not resend code.');
        return;
      }

      setCooldown(data.resendCooldown || 60);
      setSuccessMessage(`New code sent to ${regEmail}.`);
    } catch (err: any) {
      setError(err.message || 'Error resending code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      const res = await fetch('/api/auth/register/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regEmail.trim(),
          otp: otp.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Verification failed. Please check the code.');
        return;
      }

      setVerificationToken(data.verificationToken);
      setSuccessMessage('Email verified! Now set a secure password.');
      setRegStep('password');
    } catch (err: any) {
      setError(err.message || 'Failed to verify code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 4 & 5: Set Password and Complete Registration
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword.length < 8) {
      setError('Password must be at least 8 characters with at least one letter and one number.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      const res = await fetch('/api/auth/register/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regEmail.trim(),
          verificationToken,
          password: regPassword,
          confirmPassword: regConfirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed.');
        return;
      }

      await refreshUser();
      router.push(redirectUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to complete registration.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot password request
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setError('Please enter your registered email address.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim() }),
      });

      const data = await res.json();
      setSuccessMessage(data.message || 'If an account exists, a reset code was sent.');
      setResetStep('confirm');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset code.');
    } finally {
      setLoading(false);
    }
  };

  // Confirm password reset
  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetOtp.trim() || resetOtp.trim().length !== 6) {
      setError('Please enter the 6-digit reset code.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail.trim(),
          otp: resetOtp.trim(),
          newPassword,
          confirmNewPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to reset password.');
        return;
      }

      setSuccessMessage('Password reset successfully! Please sign in with your new password.');
      setMode('signin');
      setResetStep('request');
      setSignInEmail(resetEmail);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white border border-neutral-border rounded p-8 sm:p-10 shadow-elevation">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block group">
            <span className="font-serif text-3xl font-bold tracking-tight text-navy-deep group-hover:text-navy-primary transition-colors">
              Case Hub
            </span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.25em] text-brass mt-1">
              Discover. Share. Compete.
            </span>
          </Link>

          {mode === 'signin' && (
            <div className="pt-2">
              <h2 className="font-serif text-xl font-bold text-navy-deep">
                Sign In to Your Account
              </h2>
              <p className="text-xs text-neutral-muted mt-1">
                Enter your credentials to access your saved opportunities, published posts, and team listings.
              </p>
            </div>
          )}

          {mode === 'register' && (
            <div className="pt-2">
              <h2 className="font-serif text-xl font-bold text-navy-deep">
                Create Student Account
              </h2>
              <p className="text-xs text-neutral-muted mt-1">
                {regStep === 'details' && 'Step 1 of 3: Enter your academic details'}
                {regStep === 'otp' && 'Step 2 of 3: Verify your email address'}
                {regStep === 'password' && 'Step 3 of 3: Set your account password'}
              </p>
            </div>
          )}

          {mode === 'forgot_password' && (
            <div className="pt-2">
              <h2 className="font-serif text-xl font-bold text-navy-deep">
                Reset Account Password
              </h2>
              <p className="text-xs text-neutral-muted mt-1">
                {resetStep === 'request'
                  ? 'Enter your registered email to receive a password reset code.'
                  : 'Enter the verification code and choose your new password.'}
              </p>
            </div>
          )}
        </div>

        {/* Mode Switcher Tabs (Sign In / Register) */}
        {mode !== 'forgot_password' && (
          <div className="flex border-b border-neutral-border">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError('');
                setSuccessMessage('');
              }}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all ${
                mode === 'signin'
                  ? 'border-navy-deep text-navy-deep'
                  : 'border-transparent text-neutral-muted hover:text-navy-deep'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setRegStep('details');
                setError('');
                setSuccessMessage('');
              }}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all ${
                mode === 'register'
                  ? 'border-navy-deep text-navy-deep'
                  : 'border-transparent text-neutral-muted hover:text-navy-deep'
              }`}
            >
              Register (New Account)
            </button>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div className="p-3 bg-red-50 border border-academic-error/40 text-academic-error text-xs rounded flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-green-50 border border-academic-success/40 text-academic-success text-xs rounded flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 1: SIGN IN FORM */}
        {/* ========================================================= */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="student@university.edu"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot_password');
                    setResetStep('request');
                    setResetEmail(signInEmail);
                    setError('');
                    setSuccessMessage('');
                  }}
                  className="text-xs text-navy-primary hover:text-brass font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-muted hover:text-navy-deep"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-sm py-2.5 font-semibold shadow-card flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: REGISTER 5-STEP FLOW */}
        {/* ========================================================= */}
        {mode === 'register' && (
          <>
            {/* Step 1: Details */}
            {regStep === 'details' && (
              <form onSubmit={handleSendOtp} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1">
                    Full Name <span className="text-academic-error">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aarav Mehta"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1">
                    Email Address <span className="text-academic-error">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="name@university.edu"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass"
                    />
                  </div>
                  <p className="text-[11px] text-neutral-muted mt-0.5">
                    A real six-digit verification code will be sent to this email.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1">
                      Programme of Study <span className="text-academic-error">*</span>
                    </label>
                    <select
                      value={programOfStudy}
                      onChange={(e) => setProgramOfStudy(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-border rounded text-xs text-neutral-text bg-white focus:outline-none focus:border-brass"
                    >
                      <option value="MBA Core Strategy">MBA Core Strategy</option>
                      <option value="MBA Marketing & Product">MBA Marketing & Product</option>
                      <option value="MBA Finance">MBA Finance</option>
                      <option value="MBA Operations & SCM">MBA Operations & SCM</option>
                      <option value="Executive MBA">Executive MBA</option>
                      <option value="Postgraduate Management">Postgraduate Management</option>
                      <option value="Other Business Degree">Other Business Degree</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1">
                      Year of Study <span className="text-academic-error">*</span>
                    </label>
                    <select
                      value={yearOfStudy}
                      onChange={(e) => setYearOfStudy(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-border rounded text-xs text-neutral-text bg-white focus:outline-none focus:border-brass"
                    >
                      <option value="Year 1">Year 1</option>
                      <option value="Year 2">Year 2</option>
                      <option value="Final Year">Final Year</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1">
                    Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-neutral-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full text-sm py-2.5 font-semibold shadow-card flex items-center justify-center gap-2 mt-4"
                >
                  <span>{loading ? 'Sending Code...' : 'Send Verification Code'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Step 2/3: Verify OTP */}
            {regStep === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-4 bg-ivory rounded border border-neutral-border text-center space-y-1">
                  <ShieldCheck className="w-7 h-7 text-brass mx-auto" />
                  <p className="text-xs font-semibold text-navy-deep">
                    Verification Code Sent
                  </p>
                  <p className="text-xs text-neutral-muted">
                    We sent a 6-digit verification code to:
                  </p>
                  <p className="font-mono text-xs font-bold text-navy-deep">
                    {regEmail}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1.5 text-center">
                    Enter 6-Digit Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full py-3 px-4 border-2 border-neutral-border rounded text-center font-mono text-2xl tracking-[0.4em] text-navy-deep font-bold focus:outline-none focus:border-brass"
                  />
                  <p className="text-[11px] text-neutral-muted text-center mt-1">
                    Code expires in 10 minutes.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="btn-primary w-full text-sm py-2.5 font-semibold shadow-card flex items-center justify-center gap-2"
                >
                  <span>{loading ? 'Verifying...' : 'Verify Code'}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-between text-xs text-neutral-muted pt-2 border-t border-neutral-border">
                  <button
                    type="button"
                    onClick={() => setRegStep('details')}
                    className="hover:text-navy-deep flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Change details</span>
                  </button>

                  <button
                    type="button"
                    disabled={cooldown > 0 || loading}
                    onClick={handleResendOtp}
                    className={`font-semibold ${
                      cooldown > 0
                        ? 'text-neutral-muted cursor-not-allowed'
                        : 'text-navy-primary hover:text-brass'
                    }`}
                  >
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend Code'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 4/5: Set Password */}
            {regStep === 'password' && (
              <form onSubmit={handleCompleteRegistration} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1.5">
                    Create Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="Minimum 8 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass"
                    />
                  </div>
                  <p className="text-[11px] text-neutral-muted mt-1">
                    Must be at least 8 characters with at least one letter and one number.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-neutral-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="Re-enter password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full text-sm py-2.5 font-semibold shadow-card flex items-center justify-center gap-2 mt-2"
                >
                  <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: FORGOT PASSWORD FLOW */}
        {/* ========================================================= */}
        {mode === 'forgot_password' && (
          <>
            {resetStep === 'request' && (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1.5">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="name@university.edu"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full text-sm py-2.5 font-semibold shadow-card flex items-center justify-center gap-2"
                >
                  <span>{loading ? 'Sending Code...' : 'Send Reset Code'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setError('');
                      setSuccessMessage('');
                    }}
                    className="text-xs text-navy-primary hover:text-brass flex items-center justify-center gap-1 mx-auto"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </button>
                </div>
              </form>
            )}

            {resetStep === 'confirm' && (
              <form onSubmit={handleConfirmReset} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1 text-center">
                    6-Digit Reset Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full py-2.5 px-4 border-2 border-neutral-border rounded text-center font-mono text-xl tracking-[0.3em] text-navy-deep font-bold focus:outline-none focus:border-brass"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Re-enter new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full text-sm py-2.5 font-semibold shadow-card flex items-center justify-center gap-2 mt-2"
                >
                  <span>{loading ? 'Updating Password...' : 'Reset Password'}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setError('');
                      setSuccessMessage('');
                    }}
                    className="text-xs text-navy-primary hover:text-brass flex items-center justify-center gap-1 mx-auto"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        <div className="pt-2 text-center text-xs text-neutral-muted border-t border-neutral-border/60">
          <p>Case Hub — Academic Case Competition Platform</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center text-xs text-neutral-muted">
          Loading authentication...
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
