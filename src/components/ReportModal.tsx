'use client';

import React, { useState } from 'react';
import { REPORT_REASONS, ReportReason } from '@/lib/db/types';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';

interface ReportModalProps {
  competitionId: string;
  competitionName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportModal({
  competitionId,
  competitionName,
  isOpen,
  onClose,
}: ReportModalProps) {
  const { isAuthenticated } = useAuth();
  const [reason, setReason] = useState<ReportReason>('Incorrect information');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=/competitions/${competitionId}`;
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitionId,
          reason,
          additionalDetails,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to submit report');
        return;
      }

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-deep/60 backdrop-blur-xs">
      <div className="bg-white border border-neutral-border rounded shadow-elevation max-w-md w-full p-6 animate-in fade-in">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-border">
          <div className="flex items-center gap-2 text-academic-error">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-serif text-lg font-bold text-navy-deep">
              Report Issue
            </h3>
          </div>
          <button onClick={onClose} className="text-neutral-muted hover:text-navy-deep">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-academic-success mx-auto" />
            <h4 className="font-serif text-base font-bold text-navy-deep">
              Report Submitted
            </h4>
            <p className="text-xs text-neutral-muted">
              Thank you. The HSB faculty and platform moderators have received your report and will review it promptly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <p className="text-xs text-neutral-muted">
              Flagging: <strong className="text-navy-deep">{competitionName}</strong>
            </p>

            {error && (
              <div className="p-2.5 bg-red-50 text-academic-error text-xs rounded border border-academic-error/30">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1">
                Reason for Reporting *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as ReportReason)}
                className="w-full px-3 py-2 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass bg-ivory/30"
              >
                {REPORT_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Explain what is incorrect or attach updated link details..."
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass"
              />
            </div>

            <div className="pt-3 border-t border-neutral-border flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary text-xs px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary text-xs px-4 py-2"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
