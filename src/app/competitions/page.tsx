'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import CompetitionCard from '@/components/CompetitionCard';
import CompetitionFilters, { FiltersState } from '@/components/CompetitionFilters';
import { Competition } from '@/lib/db/types';
import { useSearchParams, useRouter } from 'next/navigation';
import { Compass, PlusCircle, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

function DiscoverCompetitionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters state initialized from URL search params
  const [filters, setFilters] = useState<FiltersState & { page: number }>({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || 'all',
    deadlineStatus: searchParams.get('deadlineStatus') || 'all',
    mode: searchParams.get('mode') || 'all',
    teamSize: searchParams.get('teamSize') || 'all',
    participationFee: searchParams.get('participationFee') || 'all',
    sort: searchParams.get('sort') || 'newest',
    page: parseInt(searchParams.get('page') || '1', 10),
  });

  const fetchCompetitions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.category !== 'all') params.set('category', filters.category);
      if (filters.deadlineStatus !== 'all') params.set('deadlineStatus', filters.deadlineStatus);
      if (filters.mode !== 'all') params.set('mode', filters.mode);
      if (filters.teamSize !== 'all') params.set('teamSize', filters.teamSize);
      if (filters.participationFee !== 'all') params.set('participationFee', filters.participationFee);
      if (filters.sort) params.set('sort', filters.sort);
      params.set('page', filters.page.toString());
      params.set('limit', '9');

      const res = await fetch(`/api/competitions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCompetitions(data.competitions || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching competitions:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions]);

  const handleFiltersChange = (newFilters: FiltersState) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      category: 'all',
      deadlineStatus: 'all',
      mode: 'all',
      teamSize: 'all',
      participationFee: 'all',
      sort: 'newest',
      page: 1,
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setFilters((prev) => ({ ...prev, page: newPage }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Editorial Page Header */}
      <div className="mb-8 pb-6 border-b border-neutral-border flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-brass block mb-1">
            Curated Directory
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-navy-deep">
            Discover Competitions
          </h1>
          <p className="text-sm text-neutral-muted mt-1 max-w-2xl">
            Explore active case competitions, consulting challenges, and hackathons open to MBA and business students.
          </p>
        </div>

        <Link
          href="/competitions/submit"
          className="btn-primary text-sm whitespace-nowrap self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Submit a Competition</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <CompetitionFilters
        filters={filters}
        onChange={handleFiltersChange}
        onReset={handleResetFilters}
        totalResults={total}
      />

      {/* Competitions Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white border border-neutral-border rounded h-96" />
          ))}
        </div>
      ) : competitions.length === 0 ? (
        <div className="bg-white border border-neutral-border rounded p-12 text-center max-w-xl mx-auto my-12 shadow-subtle">
          <Compass className="w-12 h-12 text-brass mx-auto mb-3" />
          <h2 className="font-serif text-xl font-bold text-navy-deep">
            {filters.search || filters.category || filters.deadlineStatus !== 'all'
              ? 'No matching competitions found'
              : 'No competitions available yet. Be the first to share an opportunity.'}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-muted mt-2 mb-6">
            {filters.search || filters.category || filters.deadlineStatus !== 'all'
              ? "We couldn't find any opportunities matching your active search and filter criteria."
              : 'Contribute upcoming business challenges, consulting hackathons, or pitch competitions with the community.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            {(filters.search || filters.category || filters.deadlineStatus !== 'all') && (
              <button
                onClick={handleResetFilters}
                className="btn-secondary text-xs px-4 py-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
            <Link
              href="/competitions/submit"
              className="btn-primary text-xs px-4 py-2"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Submit a Competition</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {competitions.map((comp) => (
            <CompetitionCard key={comp.id} competition={comp} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-12 pt-6 border-t border-neutral-border flex items-center justify-between">
          <button
            onClick={() => handlePageChange(filters.page - 1)}
            disabled={filters.page <= 1}
            className="btn-secondary text-xs px-3.5 py-2 disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="text-xs font-semibold text-neutral-muted">
            Page <span className="text-navy-deep">{filters.page}</span> of{' '}
            <span className="text-navy-deep">{totalPages}</span>
          </div>

          <button
            onClick={() => handlePageChange(filters.page + 1)}
            disabled={filters.page >= totalPages}
            className="btn-secondary text-xs px-3.5 py-2 disabled:opacity-40 disabled:pointer-events-none"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function DiscoverCompetitionsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center text-sm text-neutral-muted">
          Loading competition catalog...
        </div>
      }
    >
      <DiscoverCompetitionsContent />
    </Suspense>
  );
}
