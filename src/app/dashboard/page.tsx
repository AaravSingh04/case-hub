'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { Competition, User } from '@/lib/db/types';
import CompetitionCard from '@/components/CompetitionCard';
import { formatDate, getDaysRemainingText, getDeadlineStatus } from '@/lib/utils';
import {
  LayoutDashboard,
  Bookmark,
  PlusCircle,
  FileText,
  Clock,
  Users,
  Trophy,
  ArrowRight,
  ShieldCheck,
  User as UserIcon,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default function StudentDashboardPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [data, setData] = useState<{
    stats: {
      uploadedCount: number;
      savedCount: number;
      closingSoonCount: number;
      teamsJoinedCount: number;
    };
    upcomingDeadlines: Competition[];
    myPosts: Competition[];
    savedCompetitions: Competition[];
    closingSoonAlerts: Competition[];
    recommended: Competition[];
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const res = await fetch('/api/dashboard');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Error fetching dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated) {
      loadDashboard();
    }
  }, [isAuthenticated]);

  if (authLoading) {
    return <div className="max-w-4xl mx-auto px-4 py-20 text-center text-sm text-neutral-muted">Checking authentication...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <LayoutDashboard className="w-12 h-12 text-brass mx-auto" />
        <h1 className="font-serif text-2xl font-bold text-navy-deep">Student Dashboard</h1>
        <p className="text-sm text-neutral-muted">
          Sign in to access your personal competition portfolio, upcoming deadlines, and team collaborations.
        </p>
        <Link href="/login?redirect=/dashboard" className="btn-primary inline-flex text-sm px-6 py-2.5">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
      {/* Welcome Banner */}
      <div className="bg-white border border-neutral-border rounded p-6 sm:p-8 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-navy-primary text-white flex items-center justify-center font-serif text-2xl font-bold border-2 border-brass shrink-0 overflow-hidden">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.display_name} className="w-full h-full object-cover" />
            ) : (
              user?.display_name?.charAt(0)
            )}
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brass block">
              {user?.program_of_study || 'Student'} • {user?.year_of_study || 'Year 1'}
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy-deep">
              Welcome back, {user?.display_name}
            </h1>
            <p className="text-xs text-neutral-muted mt-0.5">
              Track deadlines, organize team efforts, and submit new case opportunities.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link href="/competitions/submit" className="btn-primary text-xs px-4 py-2.5">
            <PlusCircle className="w-4 h-4" />
            <span>Submit Competition</span>
          </Link>
          <Link href="/profile" className="btn-secondary text-xs px-4 py-2.5">
            <UserIcon className="w-4 h-4 text-neutral-muted" />
            <span>Profile</span>
          </Link>
        </div>
      </div>

      {/* 4 Metric Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white border border-neutral-border rounded p-5 shadow-subtle">
          <div className="flex items-center justify-between text-neutral-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Saved Challenges</span>
            <Bookmark className="w-4 h-4 text-brass" />
          </div>
          <div className="font-serif text-3xl font-bold text-navy-deep">
            {data?.stats?.savedCount ?? 0}
          </div>
          <Link href="/saved" className="text-[11px] font-semibold text-navy-primary hover:text-brass mt-2 block">
            View saved list →
          </Link>
        </div>

        <div className="bg-white border border-neutral-border rounded p-5 shadow-subtle">
          <div className="flex items-center justify-between text-neutral-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Closing Soon</span>
            <Clock className="w-4 h-4 text-academic-error" />
          </div>
          <div className="font-serif text-3xl font-bold text-academic-error">
            {data?.stats?.closingSoonCount ?? 0}
          </div>
          <span className="text-[11px] text-neutral-muted mt-2 block">
            Closing within 7 days
          </span>
        </div>

        <div className="bg-white border border-neutral-border rounded p-5 shadow-subtle">
          <div className="flex items-center justify-between text-neutral-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">My Submissions</span>
            <FileText className="w-4 h-4 text-brass" />
          </div>
          <div className="font-serif text-3xl font-bold text-navy-deep">
            {data?.stats?.uploadedCount ?? 0}
          </div>
          <Link href="/my-posts" className="text-[11px] font-semibold text-navy-primary hover:text-brass mt-2 block">
            Manage your posts →
          </Link>
        </div>

        <div className="bg-white border border-neutral-border rounded p-5 shadow-subtle">
          <div className="flex items-center justify-between text-neutral-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Teams Joined</span>
            <Users className="w-4 h-4 text-brass" />
          </div>
          <div className="font-serif text-3xl font-bold text-navy-deep">
            {data?.stats?.teamsJoinedCount ?? 0}
          </div>
          <span className="text-[11px] text-neutral-muted mt-2 block">
            Active team collaborations
          </span>
        </div>
      </div>

      {/* Two Columns: Upcoming Deadlines & Closing Soon Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Upcoming Deadlines (from saved) */}
        <div className="bg-white border border-neutral-border rounded p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-border pb-3">
            <h2 className="font-serif text-lg font-bold text-navy-deep flex items-center gap-2">
              <Clock className="w-4 h-4 text-brass" />
              <span>Upcoming Deadlines for You</span>
            </h2>
            <Link href="/saved" className="text-xs text-navy-primary hover:text-brass font-medium">
              See all
            </Link>
          </div>

          {!data?.upcomingDeadlines || data.upcomingDeadlines.length === 0 ? (
            <p className="text-xs text-neutral-muted py-6 text-center">
              No saved opportunities with upcoming deadlines. Browse and save competitions to track them here.
            </p>
          ) : (
            <div className="divide-y divide-neutral-border/60">
              {data.upcomingDeadlines.map((c) => {
                const daysInfo = getDaysRemainingText(c.registration_deadline);
                return (
                  <div key={c.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-navy-deep hover:text-brass">
                        <Link href={`/competitions/${c.id}`}>{c.name}</Link>
                      </h3>
                      <p className="text-xs text-neutral-muted mt-0.5">{c.organizer}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-navy-deep block">
                        {formatDate(c.registration_deadline)}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          daysInfo.isUrgent ? 'bg-red-50 text-academic-error' : 'bg-ivory text-neutral-text'
                        }`}
                      >
                        {daysInfo.text}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: My Uploaded Posts Quick Preview */}
        <div className="bg-white border border-neutral-border rounded p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-border pb-3">
            <h2 className="font-serif text-lg font-bold text-navy-deep flex items-center gap-2">
              <FileText className="w-4 h-4 text-brass" />
              <span>My Published Competitions</span>
            </h2>
            <Link href="/my-posts" className="text-xs text-navy-primary hover:text-brass font-medium">
              Manage all ({data?.myPosts?.length || 0})
            </Link>
          </div>

          {!data?.myPosts || data.myPosts.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-xs text-neutral-muted">
                You haven't uploaded any competitions yet.
              </p>
              <Link href="/competitions/submit" className="btn-secondary text-xs px-4 py-2 inline-flex">
                Publish a Competition
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-neutral-border/60">
              {data.myPosts.slice(0, 4).map((c) => (
                <div key={c.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-navy-deep hover:text-brass">
                      <Link href={`/competitions/${c.id}`}>{c.name}</Link>
                    </h3>
                    <p className="text-xs text-neutral-muted">{c.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-green-50 text-academic-success font-semibold px-2 py-0.5 rounded border border-academic-success/30">
                      Live
                    </span>
                    <Link
                      href={`/competitions/${c.id}/edit`}
                      className="text-xs text-navy-primary hover:underline font-medium"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recommended Competitions based on Interests */}
      {data?.recommended && data.recommended.length > 0 && (
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-b border-neutral-border pb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-brass block mb-0.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-brass" /> Personalized For You
              </span>
              <h2 className="font-serif text-2xl font-bold text-navy-deep">
                Recommended Opportunities
              </h2>
            </div>
            <Link href="/competitions" className="text-xs font-semibold text-navy-primary hover:text-brass">
              Browse full directory →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {data.recommended.map((comp) => (
              <CompetitionCard key={comp.id} competition={comp} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
