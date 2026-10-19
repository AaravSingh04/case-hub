'use client';

import React, { useState } from 'react';
import { COMPETITION_CATEGORIES } from '@/lib/db/types';
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  Calendar,
  Filter,
  Check,
  ChevronDown,
} from 'lucide-react';

export interface FiltersState {
  search: string;
  category: string;
  deadlineStatus: string;
  mode: string;
  teamSize: string;
  participationFee: string;
  sort: string;
  page?: number;
}

interface CompetitionFiltersProps {
  filters: FiltersState;
  onChange: (newFilters: FiltersState) => void;
  onReset: () => void;
  totalResults: number;
}

export default function CompetitionFilters({
  filters,
  onChange,
  onReset,
  totalResults,
}: CompetitionFiltersProps) {
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const activeCount = [
    filters.search ? 1 : 0,
    filters.category !== 'all' ? 1 : 0,
    filters.deadlineStatus !== 'all' ? 1 : 0,
    filters.mode !== 'all' ? 1 : 0,
    filters.teamSize !== 'all' ? 1 : 0,
    filters.participationFee !== 'all' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const handleFieldChange = (field: keyof FiltersState, value: string) => {
    onChange({
      ...filters,
      [field]: value,
    });
  };

  return (
    <div className="bg-white border border-neutral-border rounded p-4 sm:p-6 mb-8 shadow-subtle">
      {/* Top Search & Primary Sort Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by competition name, organizer, industry, keywords..."
            value={filters.search}
            onChange={(e) => handleFieldChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-ivory/50 border border-neutral-border rounded text-sm text-neutral-text placeholder:text-neutral-muted focus:outline-none focus:border-brass focus:bg-white transition-all"
          />
          {filters.search && (
            <button
              onClick={() => handleFieldChange('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-muted hover:text-navy-deep"
            >
              Clear
            </button>
          )}
        </div>

        {/* Sort & Mobile Toggle */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-muted whitespace-nowrap hidden sm:inline">
              Sort by:
            </span>
            <select
              value={filters.sort}
              onChange={(e) => handleFieldChange('sort', e.target.value)}
              className="px-3 py-2.5 bg-ivory/50 border border-neutral-border rounded text-sm text-neutral-text font-medium focus:outline-none focus:border-brass"
            >
              <option value="newest">Recently Added</option>
              <option value="deadline_soonest">Deadline: Soonest First</option>
              <option value="alphabetical">Alphabetical (A–Z)</option>
            </select>
          </div>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setMobileExpanded(!mobileExpanded)}
            className="md:hidden flex items-center gap-2 px-3.5 py-2.5 border border-neutral-border rounded text-sm font-medium bg-ivory"
          >
            <SlidersHorizontal className="w-4 h-4 text-brass" />
            <span>Filters</span>
            {activeCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-navy-primary text-white text-[10px] font-bold flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter Options Grid */}
      <div className={`mt-5 pt-5 border-t border-neutral-border/80 ${mobileExpanded ? 'block' : 'hidden md:block'}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1.5">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFieldChange('category', e.target.value)}
              className="w-full px-3 py-2 bg-ivory/40 border border-neutral-border rounded text-xs font-medium text-neutral-text focus:outline-none focus:border-brass"
            >
              <option value="all">All Categories</option>
              {COMPETITION_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Deadline Status */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1.5">
              Deadline Status
            </label>
            <select
              value={filters.deadlineStatus}
              onChange={(e) => handleFieldChange('deadlineStatus', e.target.value)}
              className="w-full px-3 py-2 bg-ivory/40 border border-neutral-border rounded text-xs font-medium text-neutral-text focus:outline-none focus:border-brass"
            >
              <option value="all">All Deadlines</option>
              <option value="upcoming">Upcoming (&gt; 7 days)</option>
              <option value="closing_soon">Closing Soon (≤ 7 days)</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Competition Mode */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1.5">
              Mode
            </label>
            <select
              value={filters.mode}
              onChange={(e) => handleFieldChange('mode', e.target.value)}
              className="w-full px-3 py-2 bg-ivory/40 border border-neutral-border rounded text-xs font-medium text-neutral-text focus:outline-none focus:border-brass"
            >
              <option value="all">Any Mode</option>
              <option value="online">Online</option>
              <option value="hybrid">Hybrid</option>
              <option value="offline">Offline / On-Campus</option>
            </select>
          </div>

          {/* Team Size */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1.5">
              Target Team Size
            </label>
            <select
              value={filters.teamSize}
              onChange={(e) => handleFieldChange('teamSize', e.target.value)}
              className="w-full px-3 py-2 bg-ivory/40 border border-neutral-border rounded text-xs font-medium text-neutral-text focus:outline-none focus:border-brass"
            >
              <option value="all">Any Size</option>
              <option value="1">Solo (1 Member)</option>
              <option value="2">2 Members</option>
              <option value="3">3 Members</option>
              <option value="4">4 Members</option>
              <option value="5">5+ Members</option>
            </select>
          </div>

          {/* Participation Fee */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1.5">
              Participation Fee
            </label>
            <select
              value={filters.participationFee}
              onChange={(e) => handleFieldChange('participationFee', e.target.value)}
              className="w-full px-3 py-2 bg-ivory/40 border border-neutral-border rounded text-xs font-medium text-neutral-text focus:outline-none focus:border-brass"
            >
              <option value="all">All Participation Fees</option>
              <option value="free">Free Only</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>

        {/* Results Counter & Reset Filter Pill */}
        <div className="mt-4 pt-3 border-t border-neutral-border/60 flex items-center justify-between text-xs text-neutral-muted">
          <span>
            Showing <strong className="text-navy-deep">{totalResults}</strong> competition{totalResults === 1 ? '' : 's'}
          </span>

          {activeCount > 0 && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 text-xs text-brass hover:text-brass-dark font-medium underline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset all filters ({activeCount})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
