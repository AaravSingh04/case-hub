'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { Competition } from '@/lib/db/types';
import { formatDate, getDeadlineStatus } from '@/lib/utils';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import Link from 'next/link';
import {
  FileText,
  PlusCircle,
  Edit3,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

export default function MyPostsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Competition | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/my-posts');
      if (res.ok) {
        const data = await res.json();
        setPosts(data.myPosts || []);
      }
    } catch (err) {
      console.error('Error fetching my posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPosts();
    }
  }, [isAuthenticated]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/competitions/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        alert('Failed to delete competition');
      }
    } catch (err) {
      alert('Error deleting competition');
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading) {
    return <div className="max-w-4xl mx-auto px-4 py-20 text-center text-sm text-neutral-muted">Checking authentication...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <FileText className="w-12 h-12 text-brass mx-auto" />
        <h1 className="font-serif text-2xl font-bold text-navy-deep">My Uploaded Posts</h1>
        <p className="text-sm text-neutral-muted">
          Sign in to view and manage competitions you have contributed to the platform.
        </p>
        <Link href="/login?redirect=/my-posts" className="btn-primary inline-flex text-sm px-6 py-2.5">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-neutral-border flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-brass block mb-1">
            Author Management
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-navy-deep">
            My Uploaded Posts
          </h1>
          <p className="text-sm text-neutral-muted mt-1">
            Competitions published by your account. You can edit schedules, update registration URLs, or remove listings.
          </p>
        </div>

        <Link href="/competitions/submit" className="btn-primary text-xs px-4 py-2.5 self-start sm:self-auto">
          <PlusCircle className="w-4 h-4" />
          <span>Upload Competition</span>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white border border-neutral-border rounded h-24" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white border border-neutral-border rounded p-12 text-center max-w-lg mx-auto my-12 shadow-subtle">
          <FileText className="w-12 h-12 text-neutral-muted mx-auto mb-3 opacity-40" />
          <h2 className="font-serif text-xl font-bold text-navy-deep">
            You haven't uploaded any competitions yet.
          </h2>
          <p className="text-xs sm:text-sm text-neutral-muted mt-2 mb-6">
            Found a consulting challenge, marketing tournament, or hackathon? Share it with the business student community.
          </p>
          <Link href="/competitions/submit" className="btn-primary inline-flex text-xs px-5 py-2.5">
            <PlusCircle className="w-4 h-4" />
            <span>Upload Competition</span>
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-neutral-border rounded shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-ivory border-b border-neutral-border text-neutral-muted uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-bold">Competition</th>
                  <th className="py-3 px-4 font-bold">Category</th>
                  <th className="py-3 px-4 font-bold">Deadline</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold">Date Created</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-border/60">
                {posts.map((comp) => {
                  const status = getDeadlineStatus(comp.registration_deadline);
                  return (
                    <tr key={comp.id} className="hover:bg-ivory/40 transition-colors">
                      {/* Name & Poster */}
                      <td className="py-3.5 px-4 font-medium text-navy-deep">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-navy-primary text-white flex items-center justify-center overflow-hidden shrink-0 border border-neutral-border">
                            {comp.poster_url ? (
                              <img src={comp.poster_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              comp.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <Link href={`/competitions/${comp.id}`} className="font-semibold hover:text-brass text-sm block">
                              {comp.name}
                            </Link>
                            <span className="text-[11px] text-neutral-muted">{comp.organizer}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-neutral-text font-medium">
                        {comp.category}
                      </td>

                      {/* Deadline */}
                      <td className="py-3.5 px-4 text-neutral-text">
                        <span className="font-semibold">{formatDate(comp.registration_deadline)}</span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            status === 'closed'
                              ? 'bg-neutral-warm text-neutral-text'
                              : status === 'closing_soon'
                              ? 'bg-red-50 text-academic-error border border-academic-error/30'
                              : 'bg-green-50 text-academic-success border border-academic-success/30'
                          }`}
                        >
                          {status === 'closing_soon' ? 'Closing Soon' : status}
                        </span>
                      </td>

                      {/* Date Created */}
                      <td className="py-3.5 px-4 text-neutral-muted">
                        {formatDate(comp.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/competitions/${comp.id}`}
                            className="p-1.5 text-neutral-muted hover:text-navy-deep rounded hover:bg-ivory"
                            title="View Public Page"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/competitions/${comp.id}/edit`}
                            className="p-1.5 text-navy-primary hover:text-brass rounded hover:bg-ivory"
                            title="Edit Details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setDeleteTarget(comp)}
                            className="p-1.5 text-academic-error hover:text-red-700 rounded hover:bg-red-50"
                            title="Delete Competition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Competition"
        message={`Are you sure you want to permanently delete "${deleteTarget?.name}"? It will be removed from the public directory.`}
        isDeleting={isDeleting}
      />
    </div>
  );
}
