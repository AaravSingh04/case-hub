import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-navy-deep text-white border-t border-navy-light/40 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <span className="font-serif text-3xl font-bold tracking-tight text-white">
                Case Hub
              </span>
              <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-brass mt-1">
                Discover. Share. Compete.
              </span>
            </Link>
            <p className="text-sm text-neutral-border/80 max-w-md leading-relaxed font-light">
              The premier competition discovery, publishing, and collaboration platform for business school students.
              Discover business cases, find teammates, and build competitive excellence.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center text-xs font-medium text-brass bg-navy-primary/80 border border-brass/30 px-3 py-1 rounded">
                Connecting ambitious business students with premier case competitions.
              </span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h3 className="font-serif text-base font-semibold text-white tracking-wide mb-4">
              Explore
            </h3>
            <ul className="space-y-2.5 text-sm text-neutral-border/80">
              <li>
                <Link href="/" className="hover:text-brass transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/competitions" className="hover:text-brass transition-colors">
                  Discover Competitions
                </Link>
              </li>
              <li>
                <Link href="/competitions/submit" className="hover:text-brass transition-colors">
                  Submit a Competition
                </Link>
              </li>
            </ul>
          </div>

          {/* Account & Support */}
          <div>
            <h3 className="font-serif text-base font-semibold text-white tracking-wide mb-4">
              Community
            </h3>
            <ul className="space-y-2.5 text-sm text-neutral-border/80">
              <li>
                <Link href="/dashboard" className="hover:text-brass transition-colors">
                  My Dashboard
                </Link>
              </li>
              <li>
                <Link href="/saved" className="hover:text-brass transition-colors">
                  Saved Opportunities
                </Link>
              </li>
              <li>
                <Link href="/competitions" className="hover:text-brass transition-colors">
                  Report an Issue
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-navy-light/40 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-border/60 gap-4">
          <p>© {new Date().getFullYear()} Case Hub. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <span className="hover:text-brass cursor-pointer">Academic Honor Code</span>
            <span className="hover:text-brass cursor-pointer">Privacy Principles</span>
            <span className="hover:text-brass cursor-pointer">Contact Faculty</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
