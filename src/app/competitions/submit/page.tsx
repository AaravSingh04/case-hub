'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { COMPETITION_CATEGORIES, CompetitionCategory, CompetitionMode } from '@/lib/db/types';
import {
  PlusCircle,
  Upload,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  FileText,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export default function SubmitCompetitionPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

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

  // Upload States
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [uploadingBrief, setUploadingBrief] = useState(false);

  // Check duplicate on blur
  const checkDuplicate = async () => {
    if (!name || !organizer || !officialRegistrationUrl) return;
    try {
      const res = await fetch('/api/competitions/duplicate-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, organizer, registrationUrl: officialRegistrationUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.isDuplicate) {
          setDuplicateWarning(
            `A similar competition ("${data.matches[0].name}") is already published. Please verify this is a distinct challenge before submitting.`
          );
        } else {
          setDuplicateWarning(null);
        }
      }
    } catch {
      // silent
    }
  };

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPoster(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'poster');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to upload poster');
        return;
      }
      setPosterUrl(data.url);
    } catch (err) {
      alert('Error uploading poster');
    } finally {
      setUploadingPoster(false);
    }
  };

  const handleBriefUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingBrief(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'brief');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to upload case brief');
        return;
      }
      setCaseBriefUrl(data.url);
    } catch (err) {
      alert('Error uploading case brief');
    } finally {
      setUploadingBrief(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Client validation
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Competition Name is required';
    if (!organizer.trim()) newErrors.organizer = 'Organizer Name is required';
    if (!description.trim() || description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }
    if (!registrationDeadline) newErrors.registrationDeadline = 'Registration deadline is required';
    if (!eligibility.trim()) newErrors.eligibility = 'Eligibility criteria is required';
    if (!officialRegistrationUrl.trim()) newErrors.officialRegistrationUrl = 'Official registration URL is required';
    if (minTeamSize < 1) newErrors.minTeamSize = 'Min team size must be >= 1';
    if (maxTeamSize < minTeamSize) newErrors.maxTeamSize = 'Max team size must be >= min team size';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 150, behavior: 'smooth' });
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/competitions', {
        method: 'POST',
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
        setErrors({ form: data.error || 'Submission failed. Please check the fields.' });
        window.scrollTo({ top: 150, behavior: 'smooth' });
        return;
      }

      setSuccess(data.competition);
      window.scrollTo({ top: 100, behavior: 'smooth' });
    } catch (err: any) {
      setErrors({ form: err.message || 'Network error occurred during submission' });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return <div className="max-w-4xl mx-auto px-4 py-20 text-center text-sm text-neutral-muted">Checking authentication...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-brass mx-auto" />
        <h1 className="font-serif text-2xl font-bold text-navy-deep">Authentication Required</h1>
        <p className="text-sm text-neutral-muted">
          Only verified students and registered users may upload new case competitions.
        </p>
        <Link href="/login?redirect=/competitions/submit" className="btn-primary inline-flex text-sm px-6 py-2.5">
          Sign In to Continue
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Editorial Header */}
      <div className="mb-8 pb-6 border-b border-neutral-border">
        <span className="text-xs font-bold uppercase tracking-widest text-brass block mb-1">
          Instant Publishing
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-navy-deep">
          Submit a Competition
        </h1>
        <p className="text-sm text-neutral-muted mt-1">
          Valid student submissions are published immediately to the Case Hub directory and emailed to faculty administrators.
        </p>
      </div>

      {/* Success Banner */}
      {success && (
        <div className="mb-8 p-6 bg-green-50 border border-academic-success/40 rounded shadow-subtle space-y-4">
          <div className="flex items-center gap-3 text-academic-success">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <div>
              <h3 className="font-serif text-lg font-bold">
                Competition Published Instantly!
              </h3>
              <p className="text-xs text-neutral-text">
                "{success.name}" is now live on the platform for all students to discover.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href={`/competitions/${success.id}`}
              className="btn-primary text-xs py-2 px-4"
            >
              <span>View Published Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => {
                setSuccess(null);
                setName('');
                setOrganizer('');
                setDescription('');
                setRegistrationDeadline('');
                setOfficialRegistrationUrl('');
                setPosterUrl('');
              }}
              className="btn-secondary text-xs py-2 px-4"
            >
              Submit Another Competition
            </button>
          </div>
        </div>
      )}

      {/* Duplicate Warning Alert */}
      {duplicateWarning && (
        <div className="mb-6 p-4 bg-amber-50 border border-academic-warning/40 rounded text-xs text-academic-warning flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <strong>Potential Duplicate Notice:</strong> {duplicateWarning}
          </div>
        </div>
      )}

      {/* Form Error Banner */}
      {errors.form && (
        <div className="mb-6 p-4 bg-red-50 border border-academic-error/40 rounded text-xs text-academic-error flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errors.form}</span>
        </div>
      )}

      {/* Main Submission Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-neutral-border rounded p-6 sm:p-10 shadow-subtle space-y-8">
        {/* Section 1: Core Details */}
        <div className="space-y-4">
          <h2 className="font-serif text-lg font-bold text-navy-deep border-b border-neutral-border/60 pb-2">
            1. Competition Overview
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1.5">
                Competition Name <span className="text-academic-error">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. McKinsey Business Strategy Challenge"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={checkDuplicate}
                className="w-full px-3.5 py-2.5 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass"
              />
              {errors.name && <p className="text-xs text-academic-error mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1.5">
                Organizer / Host Organization <span className="text-academic-error">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. McKinsey & Company, HUL, IIM Ahmedabad"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                onBlur={checkDuplicate}
                className="w-full px-3.5 py-2.5 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass"
              />
              {errors.organizer && <p className="text-xs text-academic-error mt-1">{errors.organizer}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1.5">
              Comprehensive Description & Problem Statement <span className="text-academic-error">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Outline the case prompt, business context, expected deliverables (e.g. 10-slide deck, financial model), and rounds..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass"
            />
            {errors.description && <p className="text-xs text-academic-error mt-1">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1.5">
                Category <span className="text-academic-error">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CompetitionCategory)}
                className="w-full px-3.5 py-2.5 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass bg-ivory/30"
              >
                {COMPETITION_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1.5">
                Industry / Domain (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. FMCG, Energy, Fintech, Healthcare"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Deadlines, Dates & Mode */}
        <div className="space-y-4 pt-2">
          <h2 className="font-serif text-lg font-bold text-navy-deep border-b border-neutral-border/60 pb-2">
            2. Deadlines, Schedule & Format
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1.5">
                Registration Deadline <span className="text-academic-error">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={registrationDeadline}
                onChange={(e) => setRegistrationDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass bg-ivory/30"
              />
              {errors.registrationDeadline && (
                <p className="text-xs text-academic-error mt-1">{errors.registrationDeadline}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1.5">
                Event Start Date (Optional)
              </label>
              <input
                type="date"
                value={eventStartDate}
                onChange={(e) => setEventStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass bg-ivory/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1.5">
                Event End Date (Optional)
              </label>
              <input
                type="date"
                value={eventEndDate}
                onChange={(e) => setEventEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass bg-ivory/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1.5">
                Competition Mode <span className="text-academic-error">*</span>
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as CompetitionMode)}
                className="w-full px-3.5 py-2.5 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass bg-ivory/30"
              >
                <option value="Online">Online</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Offline">Offline / On-Site</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1.5">
                Min Team Size <span className="text-academic-error">*</span>
              </label>
              <input
                type="number"
                min={1}
                required
                value={minTeamSize}
                onChange={(e) => setMinTeamSize(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1.5">
                Max Team Size <span className="text-academic-error">*</span>
              </label>
              <input
                type="number"
                min={1}
                required
                value={maxTeamSize}
                onChange={(e) => setMaxTeamSize(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass"
              />
              {errors.maxTeamSize && (
                <p className="text-xs text-academic-error mt-1">{errors.maxTeamSize}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1.5">
              Eligibility Criteria <span className="text-academic-error">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Open to all MBA students, B-School undergraduates, or engineering cross-teams"
              value={eligibility}
              onChange={(e) => setEligibility(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass"
            />
            {errors.eligibility && (
              <p className="text-xs text-academic-error mt-1">{errors.eligibility}</p>
            )}
          </div>
        </div>

        {/* Section 3: Links & Rewards */}
        <div className="space-y-4 pt-2">
          <h2 className="font-serif text-lg font-bold text-navy-deep border-b border-neutral-border/60 pb-2">
            3. Registration URLs & Rewards
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1.5">
                Official Registration URL <span className="text-academic-error">*</span>
              </label>
              <input
                type="url"
                required
                placeholder="https://unstop.com/competitions/..."
                value={officialRegistrationUrl}
                onChange={(e) => setOfficialRegistrationUrl(e.target.value)}
                onBlur={checkDuplicate}
                className="w-full px-3.5 py-2.5 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass font-mono text-xs"
              />
              {errors.officialRegistrationUrl && (
                <p className="text-xs text-academic-error mt-1">{errors.officialRegistrationUrl}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1.5">
                Official Source / Information Link (Optional)
              </label>
              <input
                type="url"
                placeholder="https://company.com/case-challenge"
                value={officialSourceUrl}
                onChange={(e) => setOfficialSourceUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1.5">
                Prize Details & Recognition (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. ₹5,00,000 Total Prize Pool + PPI Opportunities"
                value={prizeDetails}
                onChange={(e) => setPrizeDetails(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1.5">
                Participation Fee
              </label>
              <input
                type="text"
                placeholder="Free or ₹500 per team"
                value={entryFee}
                onChange={(e) => setEntryFee(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Poster & Attachments (Optional) */}
        <div className="space-y-4 pt-2">
          <h2 className="font-serif text-lg font-bold text-navy-deep border-b border-neutral-border/60 pb-2">
            4. Poster & Case Brief Attachment (Optional)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Poster Upload or URL */}
            <div className="p-4 border border-neutral-border rounded bg-ivory/30 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-muted block">
                Competition Poster (Optional)
              </span>

              {posterUrl ? (
                <div className="relative h-40 w-full rounded border border-neutral-border overflow-hidden">
                  <img src={posterUrl} alt="Poster preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPosterUrl('')}
                    className="absolute top-2 right-2 bg-navy-deep text-white text-[11px] px-2 py-0.5 rounded shadow"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-neutral-border rounded hover:border-brass cursor-pointer bg-white">
                    <ImageIcon className="w-8 h-8 text-neutral-muted mb-1" />
                    <span className="text-xs font-medium text-navy-deep">
                      {uploadingPoster ? 'Uploading poster...' : 'Upload Poster Image'}
                    </span>
                    <span className="text-[10px] text-neutral-muted mt-0.5">JPG, PNG, WEBP up to 10MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePosterUpload}
                      disabled={uploadingPoster}
                      className="hidden"
                    />
                  </label>
                  <div className="text-[11px] text-neutral-muted text-center">or paste image URL:</div>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={posterUrl}
                    onChange={(e) => setPosterUrl(e.target.value)}
                    className="w-full px-3 py-1.5 border border-neutral-border rounded text-xs text-neutral-text focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Case Brief PDF Upload */}
            <div className="p-4 border border-neutral-border rounded bg-ivory/30 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-muted block">
                Official Case Brief / PDF (Optional)
              </span>

              {caseBriefUrl ? (
                <div className="p-3 bg-white border border-neutral-border rounded flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs truncate">
                    <FileText className="w-4 h-4 text-brass shrink-0" />
                    <span className="truncate">Case Brief Attached</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCaseBriefUrl('')}
                    className="text-xs text-academic-error hover:underline ml-2"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-neutral-border rounded hover:border-brass cursor-pointer bg-white">
                    <FileText className="w-8 h-8 text-neutral-muted mb-1" />
                    <span className="text-xs font-medium text-navy-deep">
                      {uploadingBrief ? 'Uploading document...' : 'Upload Case Brief PDF'}
                    </span>
                    <span className="text-[10px] text-neutral-muted mt-0.5">PDF, DOCX up to 25MB</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleBriefUpload}
                      disabled={uploadingBrief}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button & Confirmation Notice */}
        <div className="pt-6 border-t border-neutral-border space-y-4">
          <div className="p-4 bg-ivory/60 rounded border border-neutral-border text-xs text-neutral-muted flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-academic-success shrink-0 mt-0.5" />
            <span>
              <strong>Instant Publication Guarantee:</strong> Submitting this form persists the competition immediately to the Case Hub catalog.
              An automated notification with the details and poster will be sent to the faculty administrators.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Link href="/competitions" className="btn-secondary text-sm px-5 py-2.5">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-sm px-8 py-3 font-semibold shadow-card"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{submitting ? 'Publishing...' : 'Publish Competition'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
