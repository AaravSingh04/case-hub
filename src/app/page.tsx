import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db/storage';
import CompetitionCard from '@/components/CompetitionCard';
import { COMPETITION_CATEGORIES } from '@/lib/db/types';
import { getDeadlineStatus } from '@/lib/utils';
import {
  Compass,
  PlusCircle,
  ArrowRight,
  Users,
  Trophy,
  BookOpen,
  Sparkles,
  Calendar,
  CheckCircle2,
  FileText,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const allActive = db.getCompetitions({ limit: 50 }).competitions;
  const teamListings = db.getTeamListings('comp_mck_strat_2026').concat(db.getTeamListings('comp_hul_lime_2026'));
  const resources = db.getCaseResources().slice(0, 3);

  // Group by status
  const upcoming = allActive.filter(
    (c) => getDeadlineStatus(c.registration_deadline) === 'upcoming'
  ).slice(0, 3);

  const closingSoon = allActive.filter(
    (c) => getDeadlineStatus(c.registration_deadline) === 'closing_soon'
  ).slice(0, 3);

  const recentlyAdded = [...allActive]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  const featured = allActive.filter((c) => c.verification_status === 'verified').slice(0, 3);

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative bg-gradient-to-b from-white via-ivory to-ivory-warm border-b border-neutral-border pt-16 sm:pt-24 pb-16 sm:pb-24 overflow-hidden">
        {/* Subtle decorative background lines */}
        <div className="absolute inset-0 bg-[radial-gradient(#102747_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Academic badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-neutral-border text-xs font-semibold text-navy-deep shadow-subtle">
              <span className="w-2 h-2 rounded-full bg-brass" />
              <span>Premier Competition & Collaboration Platform for MBA Students</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-navy-deep leading-[1.15]">
              Discover Opportunities. <br className="hidden sm:inline" />
              <span className="italic font-normal text-navy-primary">Build Your Edge.</span>
            </h1>

            {/* Supporting Description */}
            <p className="text-base sm:text-lg text-neutral-text/90 leading-relaxed max-w-2xl mx-auto font-normal">
              Find case competitions, explore real-world business challenges, connect with teammates,
              and take your ideas to the next level.
            </p>

            {/* Primary Calls to Action */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link
                href="/competitions"
                className="btn-primary w-full sm:w-auto px-7 py-3 text-base font-semibold shadow-card"
              >
                <Compass className="w-4 h-4 text-brass" />
                <span>Explore Competitions</span>
              </Link>
              <Link
                href="/competitions/submit"
                className="btn-secondary w-full sm:w-auto px-7 py-3 text-base font-medium"
              >
                <PlusCircle className="w-4 h-4 text-navy-deep" />
                <span>Submit a Competition</span>
              </Link>
            </div>

            {/* Trust Metrics Bar */}
            <div className="pt-10 grid grid-cols-3 border-t border-neutral-border/80 max-w-xl mx-auto text-center gap-4">
              <div>
                <div className="font-serif text-2xl font-bold text-navy-deep">{allActive.length}+</div>
                <div className="text-[11px] text-neutral-muted uppercase tracking-wider font-semibold">Active Opportunities</div>
              </div>
              <div>
                <div className="font-serif text-2xl font-bold text-navy-deep">₹25L+</div>
                <div className="text-[11px] text-neutral-muted uppercase tracking-wider font-semibold">Total Prize Pools</div>
              </div>
              <div>
                <div className="font-serif text-2xl font-bold text-navy-deep">Instant</div>
                <div className="text-[11px] text-neutral-muted uppercase tracking-wider font-semibold">Student Publishing</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Empty State */}
      {allActive.length === 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="academic-card p-12 text-center space-y-4">
            <Compass className="w-12 h-12 text-brass mx-auto" />
            <h3 className="font-serif text-2xl font-bold text-navy-deep">
              No competitions available yet. Be the first to share an opportunity.
            </h3>
            <p className="text-sm text-neutral-muted max-w-md mx-auto">
              Contribute upcoming business challenges, consulting hackathons, or pitch competitions with the community.
            </p>
            <div className="pt-2">
              <Link href="/competitions/submit" className="btn-primary text-sm px-6 py-2.5">
                Submit a Competition
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 2. FEATURED COMPETITIONS */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 pb-3 border-b border-neutral-border">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-brass block mb-1">
                Curated Opportunities
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy-deep">
                Featured Competitions
              </h2>
            </div>
            <Link
              href="/competitions"
              className="text-xs sm:text-sm font-semibold text-navy-primary hover:text-brass flex items-center gap-1 group"
            >
              <span>View all competitions</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((comp) => (
              <CompetitionCard key={comp.id} competition={comp} />
            ))}
          </div>
        </section>
      )}

      {/* 3. CLOSING SOON (URGENT OPPORTUNITIES) */}
      {closingSoon.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border-l-4 border-academic-error border-y border-r border-neutral-border rounded p-6 sm:p-8 shadow-subtle mb-6">
            <div className="flex items-center gap-2 text-academic-error text-xs font-bold uppercase tracking-wider mb-1">
              <Clock className="w-4 h-4 animate-pulse" />
              <span>Urgent Deadlines</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy-deep">
              Closing Soon
            </h2>
            <p className="text-xs sm:text-sm text-neutral-muted mt-1 max-w-2xl">
              Registration for these challenges closes within seven days. Ensure your team submits all executive deliverables on time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {closingSoon.map((comp) => (
              <CompetitionCard key={comp.id} competition={comp} />
            ))}
          </div>
        </section>
      )}

      {/* 4. UPCOMING COMPETITIONS */}
      {upcoming.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 pb-3 border-b border-neutral-border">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-brass block mb-1">
                Horizon & Registrations Open
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy-deep">
                Upcoming Competitions
              </h2>
            </div>
            <Link
              href="/competitions?deadlineStatus=upcoming"
              className="text-xs sm:text-sm font-semibold text-navy-primary hover:text-brass flex items-center gap-1 group"
            >
              <span>Explore upcoming</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcoming.map((comp) => (
              <CompetitionCard key={comp.id} competition={comp} />
            ))}
          </div>
        </section>
      )}

      {/* 5. EXPLORE BY CATEGORY */}
      <section className="bg-ivory-warm/60 py-16 border-y border-neutral-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-brass block mb-1">
              Curated Fields of Study
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy-deep">
              Explore by Category
            </h2>
            <p className="text-xs sm:text-sm text-neutral-muted mt-2">
              From flagship management consulting tournaments to marketing campaigns and fintech hackathons.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {COMPETITION_CATEGORIES.map((cat) => {
              const count = allActive.filter((c) => c.category === cat).length;
              return (
                <Link
                  key={cat}
                  href={`/competitions?category=${encodeURIComponent(cat)}`}
                  className="bg-white border border-neutral-border p-4 rounded hover:border-brass hover:shadow-subtle transition-all group flex flex-col justify-between"
                >
                  <span className="font-serif text-sm font-bold text-navy-deep group-hover:text-brass transition-colors">
                    {cat}
                  </span>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-muted">
                    <span>{count} challenge{count === 1 ? '' : 's'}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-brass" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. FIND YOUR TEAM (TEAM FINDER SPOTLIGHT) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-navy-deep text-white rounded p-8 sm:p-12 shadow-card relative overflow-hidden">
          <div className="max-w-2xl relative z-10 space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-brass block">
              Peer Collaboration
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white leading-tight">
              Build a Complementary Case Team
            </h2>
            <p className="text-sm sm:text-base text-neutral-border/90 leading-relaxed font-light">
              Don’t tackle complex corporate turnarounds alone. Connect with fellow business students across financial modeling, market strategy, slide design, and presentation delivery.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                href="/competitions"
                className="btn-brass text-sm py-2.5 px-5 font-semibold"
              >
                <Users className="w-4 h-4" />
                <span>Browse Teams Looking for Members</span>
              </Link>
            </div>
          </div>

          {/* Decorative Team Badges */}
          <div className="hidden lg:block absolute right-12 top-1/2 -translate-y-1/2 w-80 space-y-3 opacity-95">
            {teamListings.slice(0, 2).map((team) => (
              <div key={team.id} className="bg-navy-primary/90 border border-brass/30 p-4 rounded text-xs">
                <div className="flex items-center justify-between font-semibold text-brass mb-1">
                  <span>{team.host_display_name}</span>
                  <span className="text-[10px] bg-navy-secondary px-2 py-0.5 rounded text-white">
                    {team.target_team_size} members
                  </span>
                </div>
                <p className="text-white/80 line-clamp-2">{team.headline}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. CASE RESOURCES SPOTLIGHT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 pb-3 border-b border-neutral-border">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-brass block mb-1">
              Academic Excellence
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy-deep">
              Case Preparation Library
            </h2>
          </div>
          <Link
            href="/resources"
            className="text-xs sm:text-sm font-semibold text-navy-primary hover:text-brass flex items-center gap-1 group"
          >
            <span>View all resources</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {resources.map((res) => (
            <div
              key={res.id}
              className="academic-card p-6 flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-brass bg-ivory-dark/60 px-2 py-0.5 rounded border border-neutral-border">
                  {res.category}
                </span>
                <h3 className="font-serif text-base font-bold text-navy-deep mt-3 mb-2 leading-snug">
                  {res.title}
                </h3>
                <p className="text-xs text-neutral-muted leading-relaxed line-clamp-3">
                  {res.description}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-neutral-border/60">
                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-navy-primary hover:text-brass flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5 text-brass" />
                  <span>Access Resource</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-brass block mb-1">
            Structured Workflow
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy-deep">
            How Case Hub Works
          </h2>
          <p className="text-xs sm:text-sm text-neutral-muted mt-2">
            A frictionless platform built specifically to support high-impact business school participation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Discover & Track',
              desc: 'Filter verified case challenges by sector, team size, mode, and deadlines. Save opportunities to your student dashboard.',
              icon: Compass,
            },
            {
              step: '02',
              title: 'Form Your Team',
              desc: 'Use the integrated Team Finder to recruit peers with complementary consulting, analytical, or marketing expertise.',
              icon: Users,
            },
            {
              step: '03',
              title: 'Instant Publishing',
              desc: 'Found a competition not listed? Submit it in seconds. Valid submissions publish immediately without bureaucratic queues.',
              icon: PlusCircle,
            },
            {
              step: '04',
              title: 'Prepare & Win',
              desc: 'Leverage consulting frameworks, market sizing sheets, and slide templates from the Case Resources repository.',
              icon: Trophy,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="bg-white border border-neutral-border rounded p-6 shadow-subtle relative"
              >
                <span className="font-serif text-3xl font-bold text-neutral-border/60 block mb-3">
                  {item.step}
                </span>
                <div className="w-8 h-8 rounded bg-ivory flex items-center justify-center text-navy-deep mb-3 border border-neutral-border">
                  <Icon className="w-4 h-4 text-brass" />
                </div>
                <h3 className="font-serif text-base font-bold text-navy-deep mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-neutral-muted leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 9. SUBMIT A COMPETITION CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-ivory-warm via-white to-ivory border border-neutral-border rounded p-8 sm:p-12 text-center shadow-card">
          <div className="max-w-2xl mx-auto space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-brass block">
              Community Contribution
            </span>
            <h2 className="font-serif text-3xl font-bold text-navy-deep">
              Know of an Upcoming Case Competition?
            </h2>
            <p className="text-sm text-neutral-text/90 leading-relaxed font-light">
              Help fellow business students discover premier national and global challenges.
              Submissions publish instantly to the catalog upon form completion.
            </p>
            <div className="pt-2">
              <Link
                href="/competitions/submit"
                className="btn-primary text-sm px-6 py-3 font-semibold"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Submit a Competition Now</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
