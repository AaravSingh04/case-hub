import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db/storage';
import { getCurrentUserServer } from '@/lib/auth/server';
import { formatDate, formatDateTime, getDeadlineStatus, getDaysRemainingText } from '@/lib/utils';
import TeamFinderSection from '@/components/TeamFinderSection';
import DetailsActionButtons from './DetailsActionButtons';
import {
  Calendar,
  Users,
  Trophy,
  MapPin,
  ExternalLink,
  ShieldCheck,
  FileText,
  Clock,
  Tag,
  Building2,
  CheckCircle2,
  Info,
  DollarSign,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export default async function CompetitionDetailPage({ params }: Props) {
  const { id } = params;
  const competition = db.getCompetitionById(id);

  if (!competition) {
    notFound();
  }

  const currentUser = await getCurrentUserServer();
  const isSavedInitial = currentUser ? db.isCompetitionSaved(currentUser.id, id) : false;
  const canEdit = Boolean(currentUser && (currentUser.role === 'admin' || currentUser.id === competition.uploader_id));

  const daysInfo = getDaysRemainingText(competition.registration_deadline);
  const deadlineStatus = getDeadlineStatus(competition.registration_deadline);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Back link */}
      <div className="mb-6">
        <Link
          href="/competitions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-muted hover:text-navy-deep transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to all competitions</span>
        </Link>
      </div>

      {/* Main Editorial Header Card */}
      <div className="bg-white border border-neutral-border rounded shadow-subtle overflow-hidden">
        {/* Poster Presentation */}
        {competition.poster_url && (
          <div className="relative h-72 sm:h-96 w-full bg-navy-deep border-b border-neutral-border">
            <img
              src={competition.poster_url}
              alt={`${competition.name} Poster`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />
            <div className="absolute bottom-4 left-4 sm:left-6 flex flex-wrap gap-2">
              <span className="bg-white/95 text-navy-deep text-xs font-bold px-3 py-1 rounded shadow-sm">
                {competition.category}
              </span>
              {competition.mode && (
                <span className="bg-navy-deep/90 text-white text-xs font-medium px-3 py-1 rounded border border-white/20">
                  {competition.mode}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="p-6 sm:p-10 space-y-6">
          {/* Category, Status & Verification Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {!competition.poster_url && (
                <span className="bg-ivory border border-neutral-border text-navy-deep text-xs font-bold px-3 py-1 rounded">
                  {competition.category}
                </span>
              )}
              {competition.verification_status === 'verified' && (
                <span className="bg-green-50 text-academic-success border border-academic-success/30 text-xs font-semibold px-2.5 py-1 rounded flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verified Opportunity</span>
                </span>
              )}
            </div>

            {/* Days Remaining Banner */}
            <span
              className={`inline-flex items-center text-xs font-bold px-3 py-1.5 rounded ${
                daysInfo.isClosed
                  ? 'bg-neutral-warm text-neutral-text'
                  : daysInfo.isUrgent
                  ? 'bg-red-50 text-academic-error border border-academic-error/40 animate-pulse'
                  : 'bg-green-50 text-academic-success border border-academic-success/30'
              }`}
            >
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              {daysInfo.text}
            </span>
          </div>

          {/* Organizer */}
          <div>
            <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-brass">
              {competition.organizer}
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-navy-deep mt-1 leading-tight">
              {competition.name}
            </h1>
          </div>

          {/* Action Buttons Bar (Register on Official Website + Save + Share + Report + Edit) */}
          <DetailsActionButtons
            competition={competition}
            initialSaved={isSavedInitial}
            canEdit={canEdit}
          />

          <hr className="border-neutral-border/80" />

          {/* Two Column Layout: Description & Meta */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Description & Specifics */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="font-serif text-xl font-bold text-navy-deep mb-3">
                  Overview & Case Brief
                </h2>
                <div className="text-sm text-neutral-text leading-relaxed whitespace-pre-line font-normal">
                  {competition.description}
                </div>
              </div>

              {/* Eligibility */}
              <div className="p-4 bg-ivory/60 rounded border border-neutral-border space-y-1">
                <h3 className="font-serif text-sm font-bold text-navy-deep flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brass" /> Eligibility Criteria
                </h3>
                <p className="text-xs text-neutral-text leading-relaxed">
                  {competition.eligibility}
                </p>
              </div>

              {/* Prize & Rewards */}
              {competition.prize_details && (
                <div className="p-4 bg-green-50/50 rounded border border-academic-success/20 space-y-1">
                  <h3 className="font-serif text-sm font-bold text-academic-success flex items-center gap-1.5">
                    <Trophy className="w-4 h-4" /> Rewards & Recognition
                  </h3>
                  <p className="text-xs text-neutral-text leading-relaxed">
                    {competition.prize_details}
                  </p>
                </div>
              )}

              {/* Additional Resources / Case Brief attachment */}
              {(competition.case_brief_url || competition.additional_resources || competition.additional_notes) && (
                <div className="space-y-3 pt-2">
                  <h3 className="font-serif text-sm font-bold text-navy-deep">
                    Documents & Resources
                  </h3>

                  {competition.case_brief_url && (
                    <div className="flex items-center justify-between p-3 bg-white border border-neutral-border rounded">
                      <div className="flex items-center gap-2 text-xs">
                        <FileText className="w-4 h-4 text-brass" />
                        <span className="font-medium text-navy-deep">Official Case Brief / Brochure</span>
                      </div>
                      <a
                        href={competition.case_brief_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary text-xs py-1 px-3"
                      >
                        Download PDF
                      </a>
                    </div>
                  )}

                  {competition.additional_resources && (
                    <div className="text-xs text-neutral-muted leading-relaxed">
                      <strong>Additional References:</strong> {competition.additional_resources}
                    </div>
                  )}

                  {competition.additional_notes && (
                    <div className="text-xs text-neutral-muted leading-relaxed">
                      <strong>Special Guidelines:</strong> {competition.additional_notes}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right 1 Col: Key Fact Sheet */}
            <div className="space-y-4">
              <div className="bg-ivory/80 border border-neutral-border rounded p-5 space-y-4">
                <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-navy-deep border-b border-neutral-border/80 pb-2">
                  Key Competition Facts
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-neutral-muted block">Registration Deadline:</span>
                    <span className="font-bold text-navy-deep text-sm">
                      {formatDate(competition.registration_deadline)}
                    </span>
                  </div>

                  {competition.event_start_date && (
                    <div>
                      <span className="text-neutral-muted block">Event Schedule:</span>
                      <span className="font-semibold text-navy-deep">
                        {formatDate(competition.event_start_date)}{' '}
                        {competition.event_end_date ? `– ${formatDate(competition.event_end_date)}` : ''}
                      </span>
                    </div>
                  )}

                  <div>
                    <span className="text-neutral-muted block">Permitted Team Size:</span>
                    <span className="font-semibold text-navy-deep">
                      {competition.min_team_size === competition.max_team_size
                        ? `${competition.min_team_size} members`
                        : `${competition.min_team_size} – ${competition.max_team_size} members`}
                    </span>
                  </div>

                  <div>
                    <span className="text-neutral-muted block">Mode & Location:</span>
                    <span className="font-semibold text-navy-deep">
                      {competition.mode} {competition.location ? `(${competition.location})` : ''}
                    </span>
                  </div>

                  <div>
                    <span className="text-neutral-muted block">Participation Fee:</span>
                    <span className="font-semibold text-navy-deep">
                      {competition.entry_fee || 'Free'}
                    </span>
                  </div>

                  {competition.industry && (
                    <div>
                      <span className="text-neutral-muted block">Sector / Industry:</span>
                      <span className="font-semibold text-navy-deep">
                        {competition.industry}
                      </span>
                    </div>
                  )}

                  {competition.official_source_url && (
                    <div className="pt-2 border-t border-neutral-border/60">
                      <span className="text-neutral-muted block">Official Source URL:</span>
                      <a
                        href={competition.official_source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-navy-primary hover:text-brass truncate block font-medium underline mt-0.5"
                      >
                        {competition.official_source_url}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Submission Provenance */}
              <div className="p-4 bg-white border border-neutral-border rounded text-[11px] text-neutral-muted space-y-1">
                <div>
                  {competition.uploader_id === 'system_discovery' || competition.uploader_display_name === 'Discovered by Case Hub' ? (
                    <span>
                      Attribution: <strong className="text-navy-deep">Discovered by Case Hub</strong>
                      {competition.discovery_source ? ` (${competition.discovery_source})` : ''}
                    </span>
                  ) : (
                    <span>
                      Attribution: <strong className="text-navy-deep">Uploaded by {competition.uploader_display_name}</strong>
                    </span>
                  )}
                </div>
                <div>Published on: {formatDateTime(competition.created_at)}</div>
                {competition.verified_at && (
                  <div className="text-academic-success font-medium">
                    Verified by {competition.verified_by} on {formatDate(competition.verified_at)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Team Finder Section */}
      <TeamFinderSection competition={competition} />
    </div>
  );
}
