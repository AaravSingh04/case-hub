'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { COMPETITION_CATEGORIES, CompetitionCategory, CompetitionMode, Competition } from '@/lib/db/types';
import {
  Edit3,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  FileText,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

export default function EditCompetitionPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CompetitionCategory>('Case Competitions');
  const [industry, setIndustry] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [minTeamSize, setMinTeamSize] = useState(1);
  const [maxTeamSize, setMaxTeamSize] = useState(4);
  const [eligibility, setEligibility] = useState('');
  const [mode, setMode] = useState<CompetitionMode>('Online');
  const [location, setLocation] = useState('');
  const [prizeDetails, setPrizeDetails] = useState('');
  const [entryFee, setEntryFee] = useState('Free');
  const [officialRegistrationUrl, setOfficialRegistrationUrl] = useState('');
  const [officialSourceUrl, setOfficialSourceUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [caseBriefUrl, setCaseBriefUrl] = useState('');
  const [additionalResources, setAdditionalResources] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/competitions/${id}`);
        if (!res.ok) {
          setError('Competition not found');
          return;
        }
        const data = await res.json();
        const c: Competition = data.competition;
        setCompetition(c);

        setName(c.name);
        setOrganizer(c.organizer);
        setDescription(c.description);
        setCategory(c.category);
        setIndustry(c.industry || '');
        setRegistrationDeadline(c.registration_deadline ? c.registration_deadline.slice(0, 16) : '');
        setEventStartDate(c.event_start_date ? c.event_start_date.slice(0, 10) : '');
        setEventEndDate(c.event_end_date ? c.event_end_date.slice(0, 10) : '');
        setMinTeamSize(c.min_team_size);
        setMaxTeamSize(c.max_team_size);
        setEligibility(c.eligibility);
        setMode(c.mode);
        setLocation(c.location || '');
        setPrizeDetails(c.prize_details || '');
        setEntryFee(c.entry_fee || 'Free');
        setOfficialRegistrationUrl(c.official_registration_url);
        setOfficialSourceUrl(c.official_source_url || '');
        setPosterUrl(c.poster_url || '');
        setCaseBriefUrl(c.case_brief_url || '');
        setAdditionalResources(c.additional_resources || '');
        setAdditionalNotes(c.additional_notes || '');
      } catch (err: any) {
        setError(err.message || 'Error loading competition');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      setSubmitting(true);
      const res = await fetch(`/api/competitions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          organizer: organizer.trim(),
          description: description.trim(),
          category,
          industry: industry.trim() || undefined,
          registration_deadline: new Date(registrationDeadline).toISOString(),
          event_start_date: eventStartDate ? new Date(eventStartDate).toISOString() : undefined,
          event_end_date: eventEndDate ? new Date(eventEndDate).toISOString() : undefined,
          min_team_size: Number(minTeamSize),
          max_team_size: Number(maxTeamSize),
          eligibility: eligibility.trim(),
          mode,
          location: location.trim() || undefined,
          prize_details: prizeDetails.trim() || undefined,
          entry_fee: entryFee.trim() || 'Free',
          official_registration_url: officialRegistrationUrl.trim(),
          official_source_url: officialSourceUrl.trim() || undefined,
          poster_url: posterUrl.trim() || undefined,
          case_brief_url: caseBriefUrl.trim() || undefined,
          additional_resources: additionalResources.trim() || undefined,
          additional_notes: additionalNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update competition');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/competitions/${id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return <div className="max-w-4xl mx-auto px-4 py-20 text-center text-sm text-neutral-muted">Loading competition details...</div>;
  }

  if (!isAuthenticated || (user?.role !== 'admin' && user?.id !== competition?.uploader_id)) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-academic-error mx-auto" />
        <h1 className="font-serif text-2xl font-bold text-navy-deep">Access Denied</h1>
        <p className="text-sm text-neutral-muted">
          You do not have permission to edit this competition. Only the author or platform administrators can modify it.
        </p>
        <Link href={`/competitions/${id}`} className="btn-secondary inline-flex text-xs px-4 py-2">
          Return to Competition
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="mb-6">
        <Link
          href={`/competitions/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-muted hover:text-navy-deep"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Cancel & Back to Competition</span>
        </Link>
      </div>

      <div className="mb-8 pb-6 border-b border-neutral-border">
        <span className="text-xs font-bold uppercase tracking-widest text-brass block mb-1">
          Opportunity Management
        </span>
        <h1 className="font-serif text-3xl font-bold text-navy-deep">
          Edit Competition
        </h1>
        <p className="text-sm text-neutral-muted mt-1">
          Update event dates, details, or registration URLs. Date modifications will automatically notify students who saved this opportunity.
        </p>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-academic-success/40 text-academic-success rounded text-xs flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Updates saved successfully! Redirecting to competition page...</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-academic-error/40 text-academic-error rounded text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-neutral-border rounded p-6 sm:p-10 shadow-subtle space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1">
                Competition Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1">
                Organizer *
              </label>
              <input
                type="text"
                required
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                className="w-full px-3.5 py-2 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1">
              Description *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1">
                Registration Deadline *
              </label>
              <input
                type="datetime-local"
                required
                value={registrationDeadline}
                onChange={(e) => setRegistrationDeadline(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass bg-ivory/30"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1">
                Event Start Date
              </label>
              <input
                type="date"
                value={eventStartDate}
                onChange={(e) => setEventStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass bg-ivory/30"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1">
                Event End Date
              </label>
              <input
                type="date"
                value={eventEndDate}
                onChange={(e) => setEventEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass bg-ivory/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1">
                Official Registration URL *
              </label>
              <input
                type="url"
                required
                value={officialRegistrationUrl}
                onChange={(e) => setOfficialRegistrationUrl(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1">
                Poster Image URL (Optional)
              </label>
              <input
                type="url"
                value={posterUrl}
                onChange={(e) => setPosterUrl(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-border flex items-center justify-end gap-3">
          <Link href={`/competitions/${id}`} className="btn-secondary text-xs px-4 py-2">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary text-xs px-6 py-2.5 font-semibold"
          >
            {submitting ? 'Saving changes...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
