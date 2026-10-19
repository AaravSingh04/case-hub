'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Competition } from '@/lib/db/types';
import { formatDate, getDaysRemainingText, getDeadlineStatus } from '@/lib/utils';
import { useAuth } from '@/lib/auth/context';
import {
  Bookmark,
  Users,
  MapPin,
  Trophy,
  Calendar,
  ArrowUpRight,
  ShieldCheck,
  Tag,
} from 'lucide-react';

interface CompetitionCardProps {
  competition: Competition;
  initialSaved?: boolean;
  onSaveToggle?: (id: string, saved: boolean) => void;
}

export default function CompetitionCard({
  competition: c,
  initialSaved = false,
  onSaveToggle,
}: CompetitionCardProps) {
  const { isAuthenticated } = useAuth();
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [saving, setSaving] = useState(false);

  const deadlineStatus = getDeadlineStatus(c.registration_deadline);
  const daysInfo = getDaysRemainingText(c.registration_deadline);

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      window.location.href = `/login?redirect=/competitions/${c.id}`;
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/competitions/${c.id}/save`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setIsSaved(data.saved);
        if (onSaveToggle) onSaveToggle(c.id, data.saved);
      }
    } catch (err) {
      console.error('Error toggling save:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="academic-card flex flex-col h-full overflow-hidden group">
      {/* Card Header Poster / Visual */}
      <div className="relative h-48 w-full bg-navy-deep overflow-hidden border-b border-neutral-border">
        {c.poster_url ? (
          <img
            src={c.poster_url}
            alt={`${c.name} poster`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-navy-primary to-navy-deep text-white">
            <span className="font-serif text-xl font-bold tracking-tight text-white/90 line-clamp-2">
              {c.name}
            </span>
            <span className="text-xs uppercase tracking-widest text-brass mt-2 font-semibold">
              {c.category}
            </span>
          </div>
        )}

        {/* Subtle overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        {/* Category Badge & Verification */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          <span className="bg-white/95 backdrop-blur-sm text-navy-deep text-[11px] font-bold px-2.5 py-1 rounded shadow-sm border border-neutral-border">
            {c.category}
          </span>
          {c.verification_status === 'verified' && (
            <span className="bg-academic-success text-white text-[10px] font-semibold px-2 py-1 rounded shadow-sm flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Verified
            </span>
          )}
        </div>

        {/* Save Bookmark Button */}
        <button
          onClick={handleSaveToggle}
          disabled={saving}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all z-10 ${
            isSaved
              ? 'bg-brass text-white shadow-md'
              : 'bg-white/90 text-navy-deep hover:bg-white hover:text-brass shadow-sm'
          }`}
          title={isSaved ? 'Remove from saved' : 'Save competition'}
          aria-label={isSaved ? 'Remove from saved' : 'Save competition'}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>

        {/* Status / Days Remaining Pill */}
        <div className="absolute bottom-3 left-3 z-10">
          <span
            className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded shadow-sm ${
              daysInfo.isClosed
                ? 'bg-neutral-text/90 text-white'
                : daysInfo.isUrgent
                ? 'bg-academic-error text-white font-bold animate-pulse'
                : 'bg-white/95 text-academic-success font-semibold border border-neutral-border'
            }`}
          >
            {daysInfo.text}
          </span>
        </div>

        {/* Mode Tag */}
        <div className="absolute bottom-3 right-3 z-10">
          <span className="bg-navy-deep/80 backdrop-blur-sm text-white text-[11px] font-medium px-2 py-0.5 rounded border border-white/20">
            {c.mode}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex flex-col flex-1">
        {/* Organizer & Attribution */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-muted truncate">
            {c.organizer}
          </p>
          <span className="text-[10px] font-medium text-neutral-muted/80 truncate shrink-0">
            {c.uploader_id === 'system_discovery' || c.uploader_display_name === 'Discovered by Case Hub'
              ? 'Discovered by Case Hub'
              : `Uploaded by ${c.uploader_display_name}`}
          </span>
        </div>

        {/* Competition Name */}
        <h3 className="font-serif text-lg font-bold text-navy-deep leading-snug line-clamp-2 group-hover:text-brass transition-colors mb-2.5">
          <Link href={`/competitions/${c.id}`} className="hover:underline">
            {c.name}
          </Link>
        </h3>

        {/* Short Description */}
        <p className="text-xs text-neutral-text/80 line-clamp-2 leading-relaxed mb-4">
          {c.description}
        </p>

        {/* Quick Meta Grid */}
        <div className="mt-auto pt-3 border-t border-neutral-border/60 space-y-2 text-xs text-neutral-text">
          <div className="flex items-center justify-between">
            <span className="text-neutral-muted flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brass" /> Deadline:
            </span>
            <span className="font-semibold text-navy-deep">
              {formatDate(c.registration_deadline)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-neutral-muted flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-brass" /> Team Size:
            </span>
            <span className="font-medium text-navy-deep">
              {c.min_team_size === c.max_team_size
                ? `${c.min_team_size} members`
                : `${c.min_team_size} – ${c.max_team_size} members`}
            </span>
          </div>

          {c.prize_details && (
            <div className="flex items-center justify-between">
              <span className="text-neutral-muted flex items-center gap-1.5 truncate max-w-[100px]">
                <Trophy className="w-3.5 h-3.5 text-brass" /> Prize:
              </span>
              <span className="font-semibold text-academic-success truncate max-w-[160px] text-right">
                {c.prize_details}
              </span>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="mt-4 pt-3 flex items-center gap-2">
          <Link
            href={`/competitions/${c.id}`}
            className="btn-primary w-full text-xs py-2 font-medium"
          >
            <span>View Details</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
