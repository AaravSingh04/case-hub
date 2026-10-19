'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import {
  Lock,
  Mail,
  User,
  Shield,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setSubmitting(true);
      setError('');
      const success = await login(email.trim());
      if (success) {
        router.push(redirectUrl);
      } else {
        setError('Login failed. Please verify your email.');
      }
    } catch (err: any) {
      setError(err.message || 'Login error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemoLogin = async (userId: string) => {
    try {
      setSubmitting(true);
      setError('');
      const success = await login(userId);
      if (success) {
        router.push(redirectUrl);
      } else {
        setError('Could not switch to selected test account.');
      }
    } catch (err: any) {
      setError(err.message || 'Login error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white border border-neutral-border rounded p-8 sm:p-10 shadow-elevation">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block">
            <span className="font-serif text-3xl font-bold tracking-tight text-navy-deep">
              Case Hub
            </span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.25em] text-brass mt-1">
              Discover. Share. Compete.
            </span>
          </Link>
          <h2 className="font-serif text-xl font-bold text-navy-deep pt-4">
            Sign In to Your Account
          </h2>
          <p className="text-xs text-neutral-muted">
            Access your saved competitions, published challenges, and team rosters.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-academic-error/40 text-academic-error text-xs rounded flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Demo Account Selector */}
        <div className="p-4 bg-ivory rounded border border-neutral-border space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-navy-deep">
            <Sparkles className="w-3.5 h-3.5 text-brass" />
            <span>Select a Test Account:</span>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('usr_student_001')}
              disabled={submitting}
              className="w-full text-left p-2.5 rounded bg-white border border-neutral-border hover:border-brass transition-all flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-navy-deep block">Aarav Mehta</span>
                <span className="text-[11px] text-neutral-muted">MBA Core Strategy • Student</span>
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-ivory text-navy-primary border border-neutral-border">
                Student
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('usr_student_002')}
              disabled={submitting}
              className="w-full text-left p-2.5 rounded bg-white border border-neutral-border hover:border-brass transition-all flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-navy-deep block">Ananya Sen</span>
                <span className="text-[11px] text-neutral-muted">MBA Marketing & Product • Student</span>
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-ivory text-navy-primary border border-neutral-border">
                Student
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('usr_admin_001')}
              disabled={submitting}
              className="w-full text-left p-2.5 rounded bg-white border border-brass/50 hover:border-brass transition-all flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-navy-deep block">Prof. Raghavendra Sharma</span>
                <span className="text-[11px] text-brass font-medium">Faculty Advisor • Administrator</span>
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-navy-primary text-white">
                Admin
              </span>
            </button>
          </div>
        </div>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-neutral-border"></div>
          <span className="flex-shrink mx-4 text-xs uppercase font-bold text-neutral-muted">
            Or Sign In with Email
          </span>
          <div className="flex-grow border-t border-neutral-border"></div>
        </div>

        {/* Custom Email Form */}
        <form onSubmit={handleCustomLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1.5">
              Student or Academic Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="student.name@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass"
              />
            </div>
            <p className="text-[11px] text-neutral-muted mt-1">
              New email addresses will automatically register with default student access.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full text-sm py-2.5 font-semibold shadow-card flex items-center justify-center gap-2"
          >
            <span>{submitting ? 'Authenticating...' : 'Sign In with Email'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-neutral-muted">
          <p>Case Hub — Discover. Share. Compete.</p>
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
      <LoginForm />
    </Suspense>
  );
}
