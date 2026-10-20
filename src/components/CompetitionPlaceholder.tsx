import React from 'react';
import {
  Trophy,
  Compass,
  Target,
  Sparkles,
  Landmark,
  Boxes,
  Terminal,
  BarChart3,
  Layers,
  Rocket,
  Award,
} from 'lucide-react';
import { CompetitionCategory } from '@/lib/db/types';

interface CompetitionPlaceholderProps {
  category: CompetitionCategory | string;
  name?: string;
  organizer?: string;
  className?: string;
  variant?: 'card' | 'banner' | 'detail';
}

export default function CompetitionPlaceholder({
  category,
  name,
  organizer,
  className = '',
  variant = 'card',
}: CompetitionPlaceholderProps) {
  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case 'Consulting':
        return {
          icon: Compass,
          label: 'Consulting Challenge',
          gradient: 'from-[#0A1930] via-[#102747] to-[#1C3557]',
          accent: 'text-brass',
        };
      case 'Business Strategy':
        return {
          icon: Target,
          label: 'Strategy Challenge',
          gradient: 'from-[#0A1930] via-[#102747] to-[#162E4D]',
          accent: 'text-brass',
        };
      case 'Finance':
        return {
          icon: Landmark,
          label: 'Finance Competition',
          gradient: 'from-[#061426] via-[#0D213B] to-[#1B385E]',
          accent: 'text-brass',
        };
      case 'Marketing':
        return {
          icon: Sparkles,
          label: 'Marketing Track',
          gradient: 'from-[#0A1930] via-[#142A4A] to-[#1D3B63]',
          accent: 'text-brass',
        };
      case 'Product Management':
        return {
          icon: Boxes,
          label: 'Product Management',
          gradient: 'from-[#08172B] via-[#112949] to-[#1B3A64]',
          accent: 'text-brass',
        };
      case 'Hackathons':
        return {
          icon: Terminal,
          label: 'Technology & AI Hackathon',
          gradient: 'from-[#051329] via-[#0E2342] to-[#173661]',
          accent: 'text-brass',
        };
      case 'Analytics':
        return {
          icon: BarChart3,
          label: 'Analytics Challenge',
          gradient: 'from-[#08182D] via-[#112949] to-[#1B3B66]',
          accent: 'text-brass',
        };
      case 'Operations':
        return {
          icon: Layers,
          label: 'Operations Challenge',
          gradient: 'from-[#0A1930] via-[#132A4B] to-[#1E3E69]',
          accent: 'text-brass',
        };
      case 'Entrepreneurship':
        return {
          icon: Rocket,
          label: 'Venture & Pitch',
          gradient: 'from-[#0A1930] via-[#122745] to-[#1A375F]',
          accent: 'text-brass',
        };
      case 'Case Competitions':
      default:
        return {
          icon: Trophy,
          label: 'Case Competition',
          gradient: 'from-[#0A1930] via-[#102747] to-[#1C3557]',
          accent: 'text-brass',
        };
    }
  };

  const theme = getCategoryTheme(category || '');
  const IconComponent = theme.icon;

  if (variant === 'detail') {
    return (
      <div
        className={`relative w-full h-64 sm:h-80 bg-gradient-to-br ${theme.gradient} flex flex-col justify-between p-8 sm:p-12 overflow-hidden border-b border-neutral-border ${className}`}
      >
        {/* Subtle geometric pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#AC925B_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.07] pointer-events-none" />

        {/* Top badge */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-semibold text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-brass" />
            <span className="tracking-wide">Case Hub Official Listing</span>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-brass">
            {theme.label}
          </span>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-2 my-auto">
          <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-brass mb-3">
            <IconComponent className="w-6 h-6" />
          </div>
          {name && (
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight line-clamp-2">
              {name}
            </h2>
          )}
          {organizer && (
            <p className="text-xs sm:text-sm text-neutral-border font-medium">
              Organized by {organizer}
            </p>
          )}
        </div>

        {/* Bottom indicator */}
        <div className="relative z-10 text-[11px] text-white/60">
          Official opportunity on Unstop / Organizer Portal
        </div>
      </div>
    );
  }

  // Card variant (default)
  return (
    <div
      className={`relative w-full h-full min-h-[190px] bg-gradient-to-br ${theme.gradient} flex flex-col justify-between p-5 overflow-hidden ${className}`}
    >
      {/* Subtle diamond / grid background */}
      <div className="absolute inset-0 bg-[radial-gradient(#AC925B_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.06] pointer-events-none" />

      {/* Top row */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="w-8 h-8 rounded bg-white/10 border border-white/20 flex items-center justify-center text-brass">
          <IconComponent className="w-4 h-4" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-brass/90">
          {category}
        </span>
      </div>

      {/* Middle brand text */}
      <div className="relative z-10 my-auto py-2">
        <div className="text-[11px] uppercase tracking-wider text-neutral-border/70 font-semibold mb-1">
          {organizer || 'Case Hub Opportunity'}
        </div>
        <div className="font-serif text-sm sm:text-base font-bold text-white leading-snug line-clamp-2">
          {name}
        </div>
      </div>

      {/* Bottom label */}
      <div className="relative z-10 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-neutral-border/60">
        <span>Verified Opportunity</span>
        <span className="font-semibold text-brass">Case Hub</span>
      </div>
    </div>
  );
}
