'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { Competition } from '@/lib/db/types';
import CompetitionCard from '@/components/CompetitionCard';
import { Bookmark, Compass, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SavedCompetitionsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [savedCompetitions, setSavedCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/saved');
      if (res.ok) {
        const data = await res.json();
        setSavedCompetitions(data.savedCompetitions || []);
      }
    } catch (err) {
      console.error('Error fetching saved:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSaved();
    }
  }, [isAuthenticated]);

  const handleSaveToggle = (id: string, saved: boolean) => {
    if (!saved) {
      setSavedCompetitions((prev) => prev.filter((c) => c.id !== id));
    }
  };

  if (authLoading) {
    return <div className="max-w-4xl mx-auto px-4 py-20 text-center text-sm text-neutral-muted">Checking authentication...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <Bookmark className="w-12 h-12 text-brass mx-auto" />
        <h1 className="font-serif text-2xl font-bold text-navy-deep">Saved Competitions</h1>
        <p className="text-sm text-neutral-muted">
          Sign in with your student credentials to track deadlines and access your saved opportunities.
        </p>
        <Link href="/login?redirect=/saved" className="btn-primary inline-flex text-sm px-6 py-2.5">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Editorial Header */}
      <div className="mb-8 pb-6 border-b border-neutral-border flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-brass block mb-1">
            Personal Portfolio
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-navy-deep">
            Saved Competitions
          </h1>
          <p className="text-sm text-neutral-muted mt-1">
            Opportunities you are tracking. You will automatically receive email notifications if registration deadlines or event dates change.
          </p>
        </div>

        <Link href="/competitions" className="btn-secondary text-xs px-4 py-2 self-start sm:self-auto flex items-center gap-1.5">
          <Compass className="w-4 h-4 text-brass" />
          <span>Browse More</span>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white border border-neutral-border rounded h-80" />
          ))}
        </div>
      ) : savedCompetitions.length === 0 ? (
        <div className="bg-white border border-neutral-border rounded p-12 text-center max-w-lg mx-auto my-12 shadow-subtle">
          <Bookmark className="w-12 h-12 text-neutral-muted mx-auto mb-3 opacity-40" />
          <h2 className="font-serif text-xl font-bold text-navy-deep">
            You haven't saved any competitions yet
          </h2>
          <p className="text-xs sm:text-sm text-neutral-muted mt-2 mb-6">
            Bookmark case challenges, consulting tournaments, and hackathons to receive deadline change updates and stay organized.
          </p>
          <Link href="/competitions" className="btn-primary inline-flex text-xs px-5 py-2.5">
            <span>Explore Opportunities</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedCompetitions.map((comp) => (
            <CompetitionCard
              key={comp.id}
              competition={comp}
              initialSaved={true}
              onSaveToggle={handleSaveToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
