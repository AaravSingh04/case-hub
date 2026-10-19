'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import {
  User,
  Mail,
  Linkedin,
  GraduationCap,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  Shield,
  Upload,
} from 'lucide-react';
import Link from 'next/link';

export default function StudentProfilePage() {
  const { user, isAuthenticated, refreshUser, loading: authLoading } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [programOfStudy, setProgramOfStudy] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [stats, setStats] = useState<any>(null);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setDisplayName(data.user.display_name || '');
            setProgramOfStudy(data.user.program_of_study || '');
            setYearOfStudy(data.user.year_of_study || '');
            setLinkedinUrl(data.user.linkedin_url || '');
            setBio(data.user.bio || '');
            setAvatarUrl(data.user.avatar_url || '');
            setStats(data.stats);
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    }

    if (isAuthenticated) {
      loadProfile();
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    try {
      setSaving(true);
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName,
          program_of_study: programOfStudy,
          year_of_study: yearOfStudy,
          linkedin_url: linkedinUrl,
          bio,
          avatar_url: avatarUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to update profile');
        return;
      }

      await refreshUser();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return <div className="max-w-4xl mx-auto px-4 py-20 text-center text-sm text-neutral-muted">Checking authentication...</div>;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <User className="w-12 h-12 text-brass mx-auto" />
        <h1 className="font-serif text-2xl font-bold text-navy-deep">Student Profile</h1>
        <p className="text-sm text-neutral-muted">Sign in to view and edit your profile information.</p>
        <Link href="/login?redirect=/profile" className="btn-primary inline-flex text-sm px-6 py-2.5">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-neutral-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-brass block mb-1">
            Student Identity
          </span>
          <h1 className="font-serif text-3xl font-bold text-navy-deep">
            My Profile
          </h1>
          <p className="text-sm text-neutral-muted mt-1">
            Manage your personal profile and display information visible across team listings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-ivory border border-neutral-border text-xs font-semibold text-navy-deep">
            <Shield className="w-3.5 h-3.5 text-brass" />
            <span>Role: {user.role === 'admin' ? 'Administrator' : 'Student'}</span>
          </span>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-green-50 border border-academic-success/40 text-academic-success rounded text-xs flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Profile updated successfully!</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-academic-error/40 text-academic-error rounded text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Profile Card & Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Side: Summary Box */}
        <div className="bg-white border border-neutral-border rounded p-6 shadow-subtle space-y-6 self-start">
          <div className="text-center space-y-3">
            <div className="w-20 h-20 rounded-full bg-navy-primary text-white mx-auto flex items-center justify-center font-serif text-3xl font-bold border-2 border-brass overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                displayName.charAt(0)
              )}
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-navy-deep">{displayName || user.display_name}</h2>
              <p className="text-xs text-neutral-muted">{user.email}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-border/80 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-neutral-muted">Competitions Uploaded:</span>
              <span className="font-bold text-navy-deep">{stats?.uploadedCount ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-muted">Opportunities Saved:</span>
              <span className="font-bold text-navy-deep">{stats?.savedCount ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-muted">Member Since:</span>
              <span className="font-medium text-neutral-text">September 2026</span>
            </div>
          </div>
        </div>

        {/* Right Side: Edit Form */}
        <div className="md:col-span-2 bg-white border border-neutral-border rounded p-6 sm:p-8 shadow-subtle">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1.5">
                Display Name *
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1.5">
                Account Email (Protected)
              </label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full px-3.5 py-2.5 border border-neutral-border rounded text-sm text-neutral-muted bg-ivory cursor-not-allowed"
              />
              <p className="text-[11px] text-neutral-muted mt-1">
                Your email is never publicly displayed on competition listings.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1.5">
                  Program of Study
                </label>
                <input
                  type="text"
                  placeholder="e.g. MBA Core Strategy, MBA Marketing"
                  value={programOfStudy}
                  onChange={(e) => setProgramOfStudy(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1.5">
                  Year of Study
                </label>
                <input
                  type="text"
                  placeholder="e.g. Year 1, Year 2, Faculty"
                  value={yearOfStudy}
                  onChange={(e) => setYearOfStudy(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1.5">
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                placeholder="https://linkedin.com/in/yourname"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1.5">
                Avatar Photo URL
              </label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1.5">
                Biography / Case Competitions Focus
              </label>
              <textarea
                rows={3}
                placeholder="Tell peers about your focus areas (e.g. private equity valuation, supply chain consulting, brand hackathons)..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass"
              />
            </div>

            <div className="pt-4 border-t border-neutral-border flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary text-xs px-6 py-2.5 font-semibold"
              >
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
