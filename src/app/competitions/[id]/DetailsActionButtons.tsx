'use client';

import React, { useState } from 'react';
import { Competition } from '@/lib/db/types';
import { useAuth } from '@/lib/auth/context';
import ReportModal from '@/components/ReportModal';
import ShareModal from '@/components/ShareModal';
import Link from 'next/link';
import {
  ExternalLink,
  Bookmark,
  Share2,
  AlertTriangle,
  Edit3,
  Check,
} from 'lucide-react';

interface DetailsActionButtonsProps {
  competition: Competition;
  initialSaved: boolean;
  canEdit: boolean;
}

export default function DetailsActionButtons({
  competition: c,
  initialSaved,
  canEdit,
}: DetailsActionButtonsProps) {
  const { isAuthenticated } = useAuth();
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [saving, setSaving] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const handleSaveToggle = async () => {
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
      }
    } catch (err) {
      console.error('Save toggle error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 pt-2">
        {/* CRITICAL OFFICIAL REGISTRATION ACTION */}
        <a
          href={c.official_registration_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary text-sm px-6 py-3 font-semibold shadow-card"
        >
          <span>Register on Official Website</span>
          <ExternalLink className="w-4 h-4 text-brass" />
        </a>

        {/* Save Bookmark Action */}
        <button
          onClick={handleSaveToggle}
          disabled={saving}
          className={`btn-secondary text-sm px-4 py-3 font-medium transition-all ${
            isSaved ? 'border-brass bg-ivory text-navy-deep font-semibold' : ''
          }`}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'text-brass fill-current' : 'text-neutral-muted'}`} />
          <span>{isSaved ? 'Saved to Your List' : 'Save Competition'}</span>
        </button>

        {/* Share Action */}
        <button
          onClick={() => setShareModalOpen(true)}
          className="btn-secondary text-sm px-4 py-3 font-medium"
        >
          <Share2 className="w-4 h-4 text-neutral-muted" />
          <span>Share</span>
        </button>

        {/* Report Action */}
        <button
          onClick={() => setReportModalOpen(true)}
          className="text-xs text-neutral-muted hover:text-academic-error px-3 py-2 flex items-center gap-1.5 transition-colors"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Report Incorrect Info</span>
        </button>

        {/* Edit Action (if owner or admin) */}
        {canEdit && (
          <Link
            href={`/competitions/${c.id}/edit`}
            className="ml-auto btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5 border-brass/50 text-navy-primary font-medium"
          >
            <Edit3 className="w-3.5 h-3.5 text-brass" />
            <span>Edit Competition</span>
          </Link>
        )}
      </div>

      {/* Share Modal */}
      <ShareModal
        competitionId={c.id}
        competitionName={c.name}
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />

      {/* Report Modal */}
      <ReportModal
        competitionId={c.id}
        competitionName={c.name}
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />
    </>
  );
}
