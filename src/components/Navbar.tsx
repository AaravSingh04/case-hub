'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import {
  Compass,
  PlusCircle,
  Bookmark,
  LayoutDashboard,
  User,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  FileText,
  UploadCloud,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, isAdmin, logout, login } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const navLinks = [
    { label: 'Discover', href: '/competitions', icon: Compass },
  ];

  const studentLinks = [
    { label: 'Submit Competition', href: '/competitions/submit', icon: PlusCircle },
    { label: 'Saved', href: '/saved', icon: Bookmark },
    { label: 'My Dashboard', href: '/dashboard', icon: LayoutDashboard },
  ];

  const adminLinks = [
    { label: 'Admin Dashboard', href: '/admin', icon: ShieldAlert },
    { label: 'Bulk Import', href: '/admin/import', icon: UploadCloud },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-neutral-border shadow-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Wordmark */}
          <Link href="/" className="flex flex-col group">
            <span className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-navy-deep group-hover:text-navy-primary transition-colors">
              Case Hub
            </span>
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-brass">
              Discover. Share. Compete.
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              href="/"
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                isActive('/') && pathname === '/'
                  ? 'text-navy-deep font-semibold bg-ivory-dark/40'
                  : 'text-neutral-text hover:text-navy-deep hover:bg-ivory'
              }`}
            >
              Home
            </Link>

            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    active
                      ? 'text-navy-deep font-semibold bg-ivory-dark/40'
                      : 'text-neutral-text hover:text-navy-deep hover:bg-ivory'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            {isAuthenticated && (
              <>
                <div className="h-4 w-px bg-neutral-border mx-1" />
                {studentLinks.map((link) => {
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                        active
                          ? 'text-navy-deep font-semibold bg-ivory-dark/40'
                          : 'text-neutral-text hover:text-navy-deep hover:bg-ivory'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </>
            )}

            {isAdmin && (
              <>
                <div className="h-4 w-px bg-neutral-border mx-1" />
                {adminLinks.map((link) => {
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${
                        active
                          ? 'text-academic-warning font-semibold bg-ivory-dark/40'
                          : 'text-academic-warning hover:bg-ivory'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>

          {/* Desktop Right Side / User Account */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded border border-neutral-border hover:border-brass transition-all bg-ivory/50"
                  aria-expanded={userDropdownOpen}
                >
                  <div className="w-8 h-8 rounded-full bg-navy-primary text-white flex items-center justify-center font-serif text-sm font-semibold overflow-hidden border border-brass/50">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.display_name} className="w-full h-full object-cover" />
                    ) : (
                      user.display_name.charAt(0)
                    )}
                  </div>
                  <div className="text-left hidden lg:block">
                    <div className="text-xs font-semibold text-navy-deep leading-tight truncate max-w-[130px]">
                      {user.display_name}
                    </div>
                    <div className="text-[10px] text-brass uppercase font-bold tracking-wider">
                      {user.role}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-neutral-muted" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-64 bg-white border border-neutral-border rounded shadow-elevation py-2 z-50"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-3 border-b border-neutral-border bg-ivory/40">
                      <p className="text-xs text-neutral-muted">Signed in as</p>
                      <p className="text-sm font-semibold text-navy-deep truncate">{user.display_name}</p>
                      <p className="text-xs text-neutral-muted truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-navy-primary text-white">
                        {user.role === 'admin' ? 'Administrator' : 'Student'}
                      </span>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-text hover:bg-ivory hover:text-navy-deep"
                      >
                        <User className="w-4 h-4 text-neutral-muted" />
                        My Profile
                      </Link>
                      <Link
                        href="/my-posts"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-text hover:bg-ivory hover:text-navy-deep"
                      >
                        <FileText className="w-4 h-4 text-neutral-muted" />
                        My Uploaded Posts
                      </Link>
                      <Link
                        href="/saved"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-text hover:bg-ivory hover:text-navy-deep"
                      >
                        <Bookmark className="w-4 h-4 text-neutral-muted" />
                        Saved Opportunities
                      </Link>
                    </div>



                    <div className="border-t border-neutral-border pt-1">
                      <button
                        onClick={async () => {
                          await logout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-academic-error hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="btn-secondary text-sm px-4 py-2"
                >
                  Sign In
                </Link>
                <Link
                  href="/competitions/submit"
                  className="btn-primary text-sm px-4 py-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  Submit Competition
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded text-navy-deep hover:bg-ivory transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-border bg-white px-4 pt-3 pb-6 space-y-3">
          <div className="space-y-1">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded text-base font-medium text-neutral-text hover:bg-ivory"
            >
              Home
            </Link>
            <Link
              href="/competitions"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded text-base font-medium text-neutral-text hover:bg-ivory"
            >
              Discover Competitions
            </Link>


            {isAuthenticated ? (
              <>
                <div className="border-t border-neutral-border my-2" />
                <Link
                  href="/competitions/submit"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded text-base font-medium text-navy-deep font-semibold bg-ivory"
                >
                  Submit a Competition
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded text-base font-medium text-neutral-text hover:bg-ivory"
                >
                  My Dashboard
                </Link>
                <Link
                  href="/saved"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded text-base font-medium text-neutral-text hover:bg-ivory"
                >
                  Saved Competitions
                </Link>
                <Link
                  href="/my-posts"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded text-base font-medium text-neutral-text hover:bg-ivory"
                >
                  My Uploaded Posts
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded text-base font-medium text-neutral-text hover:bg-ivory"
                >
                  Profile ({user?.display_name})
                </Link>

                {isAdmin && (
                  <>
                    <div className="border-t border-neutral-border my-2" />
                    <p className="px-3 text-xs font-bold uppercase tracking-wider text-brass">Admin Tools</p>
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded text-base font-medium text-navy-primary hover:bg-ivory"
                    >
                      Admin Dashboard
                    </Link>
                    <Link
                      href="/admin/import"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded text-base font-medium text-navy-primary hover:bg-ivory"
                    >
                      Bulk Import
                    </Link>
                  </>
                )}

                <div className="border-t border-neutral-border my-2" />
                <button
                  onClick={async () => {
                    await logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded text-base font-medium text-academic-error hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="pt-2 space-y-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-primary w-full text-center"
                >
                  Sign In / Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
