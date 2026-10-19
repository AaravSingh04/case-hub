'use client';

import React, { useState, useEffect } from 'react';
import { Competition, TeamListing } from '@/lib/db/types';
import { useAuth } from '@/lib/auth/context';
import {
  Users,
  PlusCircle,
  UserPlus,
  LogOut,
  Mail,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

interface TeamFinderSectionProps {
  competition: Competition;
}

export default function TeamFinderSection({ competition: c }: TeamFinderSectionProps) {
  const { user, isAuthenticated } = useAuth();
  const [listings, setListings] = useState<TeamListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form state
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [targetTeamSize, setTargetTeamSize] = useState(c.max_team_size);
  const [contactMethod, setContactMethod] = useState('');

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/teams?competitionId=${c.id}`);
      if (res.ok) {
        const data = await res.json();
        setListings(data.listings || []);
      }
    } catch (err) {
      console.error('Error fetching team listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [c.id]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return;

    try {
      setActionLoading(true);
      setErrorMessage('');
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitionId: c.id,
          headline,
          description,
          targetTeamSize,
          contactMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to create team listing');
        return;
      }

      setSuccessMessage('Team listing created successfully!');
      setModalOpen(false);
      setHeadline('');
      setDescription('');
      setContactMethod('');
      fetchListings();
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinTeam = async (teamListingId: string) => {
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=/competitions/${c.id}`;
      return;
    }

    try {
      setActionLoading(true);
      setErrorMessage('');
      const res = await fetch(`/api/teams/${teamListingId}/join`, { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Could not join team');
        return;
      }

      setSuccessMessage('Joined team successfully!');
      fetchListings();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error joining team');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveTeam = async (teamListingId: string) => {
    if (!isAuthenticated) return;

    try {
      setActionLoading(true);
      setErrorMessage('');
      const res = await fetch(`/api/teams/${teamListingId}/leave`, { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Could not leave team');
        return;
      }

      setSuccessMessage('Left team.');
      fetchListings();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error leaving team');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <section className="bg-white border border-neutral-border rounded p-6 sm:p-8 mt-10 shadow-subtle">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-border gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-brass block mb-1">
            Student Collaboration
          </span>
          <h2 className="font-serif text-2xl font-bold text-navy-deep">
            Team Finder
          </h2>
          <p className="text-xs sm:text-sm text-neutral-muted mt-1">
            Connect with fellow business students forming teams for this challenge ({c.min_team_size === c.max_team_size ? `${c.min_team_size} members required` : `${c.min_team_size} – ${c.max_team_size} members`}).
          </p>
        </div>

        {isAuthenticated ? (
          <button
            onClick={() => {
              setErrorMessage('');
              setSuccessMessage('');
              setModalOpen(true);
            }}
            className="btn-primary text-sm whitespace-nowrap self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Team Listing</span>
          </button>
        ) : (
          <a
            href={`/login?redirect=/competitions/${c.id}`}
            className="btn-secondary text-sm whitespace-nowrap self-start sm:self-auto"
          >
            Sign In to Find Teammates
          </a>
        )}
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="mt-4 p-3 bg-red-50 border border-academic-error/40 text-academic-error rounded text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="mt-4 p-3 bg-green-50 border border-academic-success/40 text-academic-success rounded text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Team Listings List */}
      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="py-8 text-center text-xs text-neutral-muted">
            Loading active teams...
          </div>
        ) : listings.length === 0 ? (
          <div className="py-10 text-center bg-ivory/50 rounded border border-dashed border-neutral-border">
            <Users className="w-8 h-8 text-neutral-muted mx-auto mb-2 opacity-60" />
            <p className="font-serif text-base font-semibold text-navy-deep">
              No teams posted yet
            </p>
            <p className="text-xs text-neutral-muted max-w-sm mx-auto mt-1 mb-4">
              Be the first to post a listing and recruit peers with complementary skill sets across strategy, finance, and marketing.
            </p>
            {isAuthenticated && (
              <button
                onClick={() => setModalOpen(true)}
                className="btn-secondary text-xs"
              >
                Create the First Team
              </button>
            )}
          </div>
        ) : (
          listings.map((team) => {
            const currentCount = team.members?.length || 1;
            const isFull = currentCount >= team.target_team_size;
            const isMember = user && team.members?.some((m) => m.user_id === user.id);
            const isHost = user && team.host_id === user.id;

            return (
              <div
                key={team.id}
                className="border border-neutral-border rounded p-5 hover:border-brass/70 transition-all bg-white"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <h3 className="font-serif text-base font-bold text-navy-deep">
                      {team.headline}
                    </h3>
                    <p className="text-xs text-neutral-muted mt-0.5">
                      Posted by <strong className="text-navy-primary">{team.host_display_name}</strong>
                    </p>
                  </div>

                  {/* Size Indicator Badge */}
                  <div className="flex items-center gap-2 self-start">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded border ${
                        isFull
                          ? 'bg-neutral-warm text-neutral-text border-neutral-border'
                          : 'bg-green-50 text-academic-success border-academic-success/30'
                      }`}
                    >
                      {currentCount} / {team.target_team_size} Members {isFull ? '(Team Full)' : ''}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-neutral-text/90 mt-3 leading-relaxed">
                  {team.description}
                </p>

                {/* Member Avatars */}
                <div className="mt-4 pt-3 border-t border-neutral-border/60 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-neutral-muted uppercase tracking-wider">
                      Members:
                    </span>
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {team.members?.map((m) => (
                        <div
                          key={m.id}
                          title={m.user_display_name}
                          className="w-7 h-7 rounded-full bg-navy-primary text-white border-2 border-white flex items-center justify-center text-[10px] font-bold"
                        >
                          {m.user_avatar ? (
                            <img src={m.user_avatar} alt={m.user_display_name} className="w-full h-full object-cover" />
                          ) : (
                            m.user_display_name.charAt(0)
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {isMember ? (
                      <button
                        onClick={() => handleLeaveTeam(team.id)}
                        disabled={actionLoading}
                        className="text-xs text-academic-error hover:underline flex items-center gap-1 px-3 py-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Leave Team</span>
                      </button>
                    ) : !isFull && (
                      <button
                        onClick={() => handleJoinTeam(team.id)}
                        disabled={actionLoading}
                        className="btn-primary text-xs py-1.5 px-3"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Join Team</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Contact instructions */}
                <div className="mt-3 bg-ivory/60 px-3 py-2 rounded text-[11px] text-neutral-muted flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-brass shrink-0" />
                  <span><strong>Contact:</strong> {team.contact_method}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Team Listing Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-deep/60 backdrop-blur-xs">
          <div className="bg-white border border-neutral-border rounded shadow-elevation max-w-lg w-full p-6 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-border">
              <h3 className="font-serif text-lg font-bold text-navy-deep">
                Create Team Listing
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-neutral-muted hover:text-navy-deep"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1">
                  Listing Headline *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2 strategy analysts seeking 1 financial modeler"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1">
                  Target Team Size *
                </label>
                <input
                  type="number"
                  required
                  min={c.min_team_size}
                  max={c.max_team_size}
                  value={targetTeamSize}
                  onChange={(e) => setTargetTeamSize(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass"
                />
                <p className="text-[11px] text-neutral-muted mt-1">
                  Must be between {c.min_team_size} and {c.max_team_size} members.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1">
                  Team Pitch & Required Skills *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe your current team's background, past case experience, and what specific role you are looking to fill..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1">
                  How Teammates Should Reach You *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WhatsApp, LinkedIn profile, or campus study lounge"
                  value={contactMethod}
                  onChange={(e) => setContactMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass"
                />
              </div>

              <div className="pt-3 border-t border-neutral-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-primary text-xs px-5 py-2"
                >
                  {actionLoading ? 'Publishing...' : 'Publish Team Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
