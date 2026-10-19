'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { CaseResource, RESOURCE_CATEGORIES, ResourceCategory, ResourceType } from '@/lib/db/types';
import {
  BookOpen,
  FileText,
  Download,
  ExternalLink,
  PlusCircle,
  Search,
  Filter,
  Trash2,
  X,
  CheckCircle2,
} from 'lucide-react';

export default function CaseResourcesPage() {
  const { user, isAdmin } = useAuth();
  const [resources, setResources] = useState<CaseResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Admin add resource modal
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ResourceCategory>('Case-solving frameworks');
  const [resourceType, setResourceType] = useState<ResourceType>('framework');
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const query = selectedCategory !== 'all' ? `?category=${encodeURIComponent(selectedCategory)}` : '';
      const res = await fetch(`/api/resources${query}`);
      if (res.ok) {
        const data = await res.json();
        setResources(data.resources || []);
      }
    } catch (err) {
      console.error('Error fetching resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [selectedCategory]);

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          resource_type: resourceType,
          url,
        }),
      });

      if (res.ok) {
        setModalOpen(false);
        setTitle('');
        setDescription('');
        setUrl('');
        fetchResources();
      } else {
        alert('Failed to add resource');
      }
    } catch {
      alert('Error adding resource');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;
    try {
      const res = await fetch(`/api/resources/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setResources((prev) => prev.filter((r) => r.id !== id));
      }
    } catch {
      alert('Failed to delete resource');
    }
  };

  const filtered = resources.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-neutral-border flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-brass block mb-1">
            Academic Knowledge Base
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-navy-deep">
            Case Resources
          </h1>
          <p className="text-sm text-neutral-muted mt-1 max-w-2xl">
            Curated frameworks, market sizing sheets, consulting slide templates, and financial models designed to accelerate your competition prep.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary text-xs px-4 py-2.5 self-start sm:self-auto flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Case Resource</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-neutral-border rounded p-4 mb-8 shadow-subtle flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search frameworks, market sizing, financial modeling..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-ivory/40 border border-neutral-border rounded text-xs text-neutral-text focus:outline-none focus:border-brass"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-muted whitespace-nowrap">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-ivory/40 border border-neutral-border rounded text-xs text-neutral-text font-medium focus:outline-none focus:border-brass"
          >
            <option value="all">All Resource Categories</option>
            {RESOURCE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Resource Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white border border-neutral-border rounded h-60" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-neutral-border rounded p-12 text-center max-w-lg mx-auto my-12 shadow-subtle">
          <BookOpen className="w-12 h-12 text-neutral-muted mx-auto mb-3 opacity-40" />
          <h2 className="font-serif text-xl font-bold text-navy-deep">
            No resources found
          </h2>
          <p className="text-xs text-neutral-muted mt-2">
            Try adjusting your search keywords or category filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((res) => (
            <div
              key={res.id}
              className="academic-card p-6 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brass bg-ivory-dark/60 px-2 py-0.5 rounded border border-neutral-border">
                    {res.category}
                  </span>
                  <span className="text-[10px] uppercase font-semibold text-neutral-muted">
                    {res.resource_type}
                  </span>
                </div>

                <h3 className="font-serif text-base font-bold text-navy-deep group-hover:text-brass transition-colors leading-snug">
                  {res.title}
                </h3>
                <p className="text-xs text-neutral-muted mt-2 leading-relaxed">
                  {res.description}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-neutral-border/60 flex items-center justify-between">
                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary text-xs py-1.5 px-3"
                >
                  <span>{res.resource_type === 'document' ? 'Download Resource' : 'Open Link'}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-brass" />
                </a>

                {isAdmin && (
                  <button
                    onClick={() => handleDeleteResource(res.id)}
                    className="p-1.5 text-academic-error hover:bg-red-50 rounded"
                    title="Delete Resource"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admin Add Resource Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-deep/60 backdrop-blur-xs">
          <div className="bg-white border border-neutral-border rounded shadow-elevation max-w-lg w-full p-6 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-border">
              <h3 className="font-serif text-lg font-bold text-navy-deep">
                Add Case Prep Resource
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-neutral-muted hover:text-navy-deep">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddResource} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1">
                  Resource Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. M&A Accretion/Dilution Financial Model Template"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ResourceCategory)}
                  className="w-full px-3 py-2 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass bg-ivory/30"
                >
                  {RESOURCE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1">
                  Resource Type *
                </label>
                <select
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value as ResourceType)}
                  className="w-full px-3 py-2 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass bg-ivory/30"
                >
                  <option value="framework">Framework</option>
                  <option value="document">Document / PDF</option>
                  <option value="link">Interactive Tool / Article</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1">
                  Resource URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-border rounded text-sm text-neutral-text focus:outline-none focus:border-brass font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Brief description of what students will learn or execute with this resource..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  disabled={submitting}
                  className="btn-primary text-xs px-5 py-2"
                >
                  {submitting ? 'Adding...' : 'Add Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
