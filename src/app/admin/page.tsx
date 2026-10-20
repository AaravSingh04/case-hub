'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { Competition, Report, User, NotificationLog } from '@/lib/db/types';
import { formatDate, formatDateTime, getDeadlineStatus } from '@/lib/utils';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  Trophy,
  Users,
  FileText,
  AlertTriangle,
  Mail,
  Archive,
  RotateCcw,
  Trash2,
  Edit3,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  Play,
  UploadCloud,
  Compass,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, isAdmin, isAuthenticated, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'competitions' | 'discovery' | 'reports' | 'users' | 'notifications'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters inside Admin
  const [searchComp, setSearchComp] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Competition | null>(null);
  const [cronRunning, setCronRunning] = useState(false);
  const [cronFeedback, setCronFeedback] = useState<string | null>(null);
  const [discoveryRunning, setDiscoveryRunning] = useState(false);
  const [discoveryFeedback, setDiscoveryFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Test Email Diagnostic State
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    messageId?: string;
    config?: { hasApiKey: boolean; from: string; recipient: string };
  } | null>(null);
  const [emailConfigInfo, setEmailConfigInfo] = useState<{
    configured: boolean;
    apiKeyMasked?: string | null;
    from?: string;
    notificationRecipients?: string[];
    isDefaultSender?: boolean;
  } | null>(null);

  const fetchEmailConfig = async () => {
    try {
      const res = await fetch('/api/admin/test-email');
      if (res.ok) {
        const data = await res.json();
        setEmailConfigInfo(data);
      }
    } catch {}
  };

  const handleSendTestEmail = async () => {
    try {
      setTestEmailLoading(true);
      setTestEmailResult(null);
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail: testEmailRecipient.trim() || undefined }),
      });
      const data = await res.json();
      setTestEmailResult(data);
      if (data.success) {
        const notifRes = await fetch('/api/admin/notifications');
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          setNotificationLogs(notifData.logs || []);
        }
      }
    } catch (err: any) {
      setTestEmailResult({ success: false, error: err.message || 'Network error triggering test email' });
    } finally {
      setTestEmailLoading(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, compRes, repRes, userRes, notifRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/competitions'),
        fetch('/api/reports'),
        fetch('/api/admin/users'),
        fetch('/api/admin/notifications'),
      ]);

      if (statsRes.ok) {
        const d = await statsRes.json();
        setStats(d.stats);
      }
      if (compRes.ok) {
        const d = await compRes.json();
        setCompetitions(d.competitions || []);
      }
      if (repRes.ok) {
        const d = await repRes.json();
        setReports(d.reports || []);
      }
      if (userRes.ok) {
        const d = await userRes.json();
        setUsers(d.users || []);
      }
      if (notifRes.ok) {
        const d = await notifRes.json();
        setNotificationLogs(d.logs || []);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchAdminData();
      fetchEmailConfig();
    }
  }, [isAuthenticated, isAdmin]);

  const handleCompetitionAction = async (competitionId: string, action: 'archive' | 'restore' | 'verify') => {
    try {
      const res = await fetch('/api/admin/competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitionId, action }),
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch {
      alert(`Error performing ${action}`);
    }
  };

  const handleDeleteCompetition = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/competitions/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        setCompetitions((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        setDeleteTarget(null);
        fetchAdminData();
      }
    } catch {
      alert('Error deleting competition');
    }
  };

  const handleUpdateReport = async (reportId: string, status: 'reviewed' | 'resolved') => {
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, resolutionNotes: 'Reviewed and handled by faculty administrator' }),
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch {
      alert('Error updating report');
    }
  };

  const handleToggleUserRole = async (targetUser: User) => {
    const newRole = targetUser.role === 'admin' ? 'student' : 'admin';
    if (!confirm(`Change role for ${targetUser.display_name} to ${newRole.toUpperCase()}?`)) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUser.id, role: newRole }),
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch {
      alert('Error updating user role');
    }
  };

  const handleRetryNotification = async (notificationId: string) => {
    try {
      const res = await fetch('/api/admin/notifications/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch {
      alert('Error retrying notification');
    }
  };

  const handleTriggerClosingSoonJob = async () => {
    try {
      setCronRunning(true);
      setCronFeedback(null);
      const res = await fetch('/api/cron/closing-soon', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setCronFeedback(`Scheduler executed: ${data.dispatchedCount} reminders processed (${data.closingSoonFound} closing soon challenges found).`);
        fetchAdminData();
      } else {
        setCronFeedback(`Scheduler failed: ${data.error}`);
      }
    } catch (err: any) {
      setCronFeedback(`Exception: ${err.message}`);
    } finally {
      setCronRunning(false);
    }
  };

  const handleTriggerDiscovery = async () => {
    try {
      setDiscoveryRunning(true);
      setDiscoveryFeedback(null);
      const res = await fetch('/api/cron/discovery?force=true');
      const data = await res.json();
      if (res.ok) {
        setDiscoveryFeedback({
          type: 'success',
          message: `Discovery finished successfully: ${data.itemsFound} found, ${data.itemsPublished} new published, ${data.duplicatesSkipped} duplicates skipped.`,
        });
        fetchAdminData();
      } else {
        setDiscoveryFeedback({
          type: 'error',
          message: `Discovery error: ${data.error || 'Failed to complete discovery'}`,
        });
      }
    } catch (err: any) {
      setDiscoveryFeedback({
        type: 'error',
        message: `Network error during discovery: ${err.message}`,
      });
    } finally {
      setDiscoveryRunning(false);
    }
  };

  if (authLoading) {
    return <div className="max-w-4xl mx-auto px-4 py-20 text-center text-sm text-neutral-muted">Checking administrative authorization...</div>;
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-academic-error mx-auto" />
        <h1 className="font-serif text-2xl font-bold text-navy-deep">Administrator Access Required</h1>
        <p className="text-sm text-neutral-muted">
          This section is restricted to Case Hub platform administrators.
        </p>
        <Link href="/login?redirect=/admin" className="btn-primary inline-flex text-sm px-6 py-2.5">
          Sign In as Admin
        </Link>
      </div>
    );
  }

  const filteredCompetitions = competitions.filter((c) => {
    if (!searchComp) return true;
    const q = searchComp.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.organizer.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      {/* Editorial Header */}
      <div className="pb-6 border-b border-neutral-border flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-brass block mb-1">
            Faculty Governance & Moderation
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-navy-deep">
            Admin Dashboard
          </h1>
          <p className="text-sm text-neutral-muted mt-1">
            Manage competitions, moderate student reports, oversee permissions, and inspect automated notification logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/import" className="btn-secondary text-xs px-4 py-2 flex items-center gap-1.5">
            <UploadCloud className="w-4 h-4 text-brass" />
            <span>Bulk Import</span>
          </Link>
          <button
            onClick={fetchAdminData}
            className="btn-secondary text-xs px-3 py-2 text-neutral-muted hover:text-navy-deep"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-neutral-border space-x-1 sm:space-x-8 overflow-x-auto text-xs sm:text-sm font-medium">
        {[
          { key: 'overview', label: 'Overview & Statistics' },
          { key: 'competitions', label: `Competitions (${competitions.length})` },
          { key: 'discovery', label: `Discovery Engine (${stats?.totalDiscoveredItems ?? 0})` },
          { key: 'reports', label: `Reports (${reports.filter((r) => r.status === 'pending').length} Pending)` },
          { key: 'users', label: `Users (${users.length})` },
          { key: 'notifications', label: `Notification Outbox (${notificationLogs.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`pb-3 px-1 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'border-navy-deep text-navy-deep font-bold'
                : 'border-transparent text-neutral-muted hover:text-navy-deep'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW & STATS */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white border border-neutral-border rounded p-5 shadow-subtle">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-muted">Total Competitions</span>
              <div className="font-serif text-3xl font-bold text-navy-deep mt-1">
                {stats?.totalCompetitions ?? competitions.length}
              </div>
              <span className="text-[11px] text-academic-success mt-1 block">
                {stats?.activeCompetitions ?? competitions.filter((c) => !c.is_archived).length} active catalog listings
              </span>
            </div>

            <div className="bg-white border border-neutral-border rounded p-5 shadow-subtle">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-muted">Closing Soon (&le;7d)</span>
              <div className="font-serif text-3xl font-bold text-academic-error mt-1">
                {stats?.closingSoon ?? 0}
              </div>
              <span className="text-[11px] text-neutral-muted mt-1 block">
                {stats?.upcoming ?? 0} upcoming &gt; 7 days
              </span>
            </div>

            <div className="bg-white border border-neutral-border rounded p-5 shadow-subtle">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-muted">Auto-Discovered</span>
              <div className="font-serif text-3xl font-bold text-navy-deep mt-1">
                {stats?.totalDiscoveredItems ?? 0}
              </div>
              <span className="text-[11px] text-brass mt-1 block">
                Every {stats?.discoveryIntervalDays ?? 3} days via Unstop
              </span>
            </div>

            <div className="bg-white border border-neutral-border rounded p-5 shadow-subtle">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-muted">Registered Users</span>
              <div className="font-serif text-3xl font-bold text-navy-deep mt-1">
                {stats?.registeredUsers ?? users.length}
              </div>
              <span className="text-[11px] text-brass mt-1 block">
                {users.filter((u) => u.role === 'admin').length} faculty admins
              </span>
            </div>
          </div>

          {/* Manual Automation Trigger Card */}
          <div className="bg-white border border-neutral-border rounded p-6 shadow-subtle space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-base font-bold text-navy-deep flex items-center gap-2">
                  <Play className="w-4 h-4 text-brass" />
                  <span>Automated Workflow Dispatcher</span>
                </h3>
                <p className="text-xs text-neutral-muted mt-0.5">
                  Execute scheduled jobs on demand: scan for competitions closing within 48h to alert all registered students, or run Unstop MBA discovery.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleTriggerClosingSoonJob}
                  disabled={cronRunning}
                  className="btn-secondary text-xs px-3.5 py-2 font-medium whitespace-nowrap"
                >
                  {cronRunning ? 'Sending Reminders...' : 'Run 48h Closing Job'}
                </button>
                <button
                  onClick={handleTriggerDiscovery}
                  disabled={discoveryRunning}
                  className="btn-primary text-xs px-4 py-2 font-semibold whitespace-nowrap flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3 h-3 ${discoveryRunning ? 'animate-spin' : ''}`} />
                  <span>{discoveryRunning ? 'Discovering...' : 'Trigger Discovery'}</span>
                </button>
              </div>
            </div>

            {cronFeedback && (
              <div className="p-3 bg-ivory border border-neutral-border rounded text-xs text-navy-deep">
                {cronFeedback}
              </div>
            )}

            {discoveryFeedback && (
              <div className={`p-3 rounded text-xs border ${
                discoveryFeedback.type === 'error'
                  ? 'bg-red-50 border-academic-error/30 text-academic-error'
                  : 'bg-green-50 border-academic-success/30 text-academic-success'
              }`}>
                {discoveryFeedback.message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: COMPETITION MANAGEMENT */}
      {activeTab === 'competitions' && (
        <div className="bg-white border border-neutral-border rounded shadow-subtle p-6 space-y-5">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-neutral-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter competitions by name or organizer..."
                value={searchComp}
                onChange={(e) => setSearchComp(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-neutral-border rounded text-xs text-neutral-text focus:outline-none focus:border-brass"
              />
            </div>
            <span className="text-xs text-neutral-muted">
              Showing {filteredCompetitions.length} competitions
            </span>
          </div>

          <div className="overflow-x-auto border border-neutral-border rounded">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-ivory border-b border-neutral-border text-neutral-muted uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Competition</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Deadline</th>
                  <th className="py-2.5 px-3">Uploader</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-border/60">
                {filteredCompetitions.map((c) => {
                  const status = getDeadlineStatus(c.registration_deadline);
                  return (
                    <tr key={c.id} className="hover:bg-ivory/30">
                      <td className="py-3 px-3 font-semibold text-navy-deep max-w-[200px] truncate">
                        <Link href={`/competitions/${c.id}`} className="hover:text-brass">
                          {c.name}
                        </Link>
                        <span className="block text-[11px] font-normal text-neutral-muted">{c.organizer}</span>
                      </td>

                      <td className="py-3 px-3 text-neutral-text">{c.category}</td>
                      <td className="py-3 px-3 text-neutral-text whitespace-nowrap">{formatDate(c.registration_deadline)}</td>
                      <td className="py-3 px-3 text-neutral-muted">{c.uploader_display_name}</td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {c.is_archived ? (
                            <span className="text-[10px] bg-neutral-warm text-neutral-muted font-bold px-1.5 py-0.5 rounded">Archived</span>
                          ) : (
                            <span className="text-[10px] bg-green-50 text-academic-success font-bold px-1.5 py-0.5 rounded border border-academic-success/30">Live</span>
                          )}
                          {c.verification_status === 'verified' && (
                            <span className="text-[10px] bg-blue-50 text-navy-primary font-bold px-1.5 py-0.5 rounded border border-navy-primary/30">Verified</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {c.verification_status !== 'verified' && (
                            <button
                              onClick={() => handleCompetitionAction(c.id, 'verify')}
                              className="p-1 text-academic-success hover:bg-green-50 rounded"
                              title="Verify Official Source"
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </button>
                          )}
                          <Link
                            href={`/competitions/${c.id}/edit`}
                            className="p-1 text-navy-primary hover:bg-ivory rounded"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>
                          {c.is_archived ? (
                            <button
                              onClick={() => handleCompetitionAction(c.id, 'restore')}
                              className="p-1 text-navy-deep hover:bg-ivory rounded"
                              title="Restore from Archive"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleCompetitionAction(c.id, 'archive')}
                              className="p-1 text-neutral-muted hover:text-navy-deep rounded"
                              title="Archive Listing"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteTarget(c)}
                            className="p-1 text-academic-error hover:bg-red-50 rounded"
                            title="Delete"
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

      {/* TAB: AUTOMATED DISCOVERY ENGINE */}
      {activeTab === 'discovery' && (
        <div className="space-y-6">
          {/* Engine Status & Manual Trigger Header */}
          <div className="bg-white border border-neutral-border rounded p-6 shadow-subtle space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brass block mb-1">
                  Scheduled Automation (Every 3 Days)
                </span>
                <h3 className="font-serif text-xl font-bold text-navy-deep flex items-center gap-2">
                  <Compass className="w-5 h-5 text-navy-primary" />
                  <span>Competition Discovery Engine</span>
                </h3>
                <p className="text-xs text-neutral-muted mt-1 max-w-2xl">
                  Automated service searching authorized online sources (primarily Unstop and top business schools) for genuine MBA competitions.
                  Discovered opportunities are deduplicated, verified, published immediately with attribution, and reported to the administrator.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleTriggerDiscovery}
                  disabled={discoveryRunning}
                  className="btn-primary text-xs px-5 py-2.5 font-semibold whitespace-nowrap flex items-center gap-1.5 shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${discoveryRunning ? 'animate-spin' : ''}`} />
                  <span>{discoveryRunning ? 'Discovering Competitions...' : 'Trigger Discovery Now'}</span>
                </button>
              </div>
            </div>

            {discoveryFeedback && (
              <div className={`p-4 rounded text-xs border ${
                discoveryFeedback.type === 'error'
                  ? 'bg-red-50 border-academic-error/30 text-academic-error'
                  : 'bg-green-50 border-academic-success/30 text-academic-success'
              }`}>
                {discoveryFeedback.message}
              </div>
            )}

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-neutral-border/80">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-neutral-muted block">Discovery Interval</span>
                <span className="font-bold text-navy-deep text-sm">Every {stats?.discoveryIntervalDays ?? 3} Days</span>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-neutral-muted block">Primary Source</span>
                <span className="font-bold text-navy-deep text-sm">Unstop & Online</span>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-neutral-muted block">Total Discovered</span>
                <span className="font-bold text-academic-success text-sm">{stats?.totalDiscoveredItems ?? 0} competitions</span>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-neutral-muted block">Next Scheduled Run</span>
                <span className="font-semibold text-navy-deep text-xs">
                  {stats?.nextScheduledDiscoveryAt ? formatDate(stats.nextScheduledDiscoveryAt) : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Discovery Run Logs History */}
          <div className="bg-white border border-neutral-border rounded shadow-subtle p-6 space-y-4">
            <h4 className="font-serif text-base font-bold text-navy-deep">
              Recent Discovery Execution Logs
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-border text-neutral-muted uppercase tracking-wider">
                    <th className="py-2.5 px-3">Run ID</th>
                    <th className="py-2.5 px-3">Source</th>
                    <th className="py-2.5 px-3">Completed At</th>
                    <th className="py-2.5 px-3">Found</th>
                    <th className="py-2.5 px-3">Published</th>
                    <th className="py-2.5 px-3">Skipped</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-border/60">
                  {(!stats?.recentDiscoveryLogs || stats.recentDiscoveryLogs.length === 0) ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-neutral-muted italic">
                        No discovery execution logs recorded yet. Click &quot;Trigger Discovery Now&quot; above to initiate a run.
                      </td>
                    </tr>
                  ) : (
                    stats.recentDiscoveryLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-ivory/50">
                        <td className="py-3 px-3 font-mono font-medium text-navy-deep">{log.run_id}</td>
                        <td className="py-3 px-3">{log.source}</td>
                        <td className="py-3 px-3 text-neutral-muted">{formatDateTime(log.completed_at)}</td>
                        <td className="py-3 px-3 font-semibold">{log.items_found}</td>
                        <td className="py-3 px-3 font-bold text-academic-success">+{log.items_published}</td>
                        <td className="py-3 px-3 text-neutral-muted">{log.duplicates_skipped}</td>
                        <td className="py-3 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            log.status === 'success'
                              ? 'bg-green-50 text-academic-success border border-academic-success/30'
                              : log.status === 'partial'
                              ? 'bg-yellow-50 text-yellow-800 border border-yellow-300'
                              : 'bg-red-50 text-academic-error border border-academic-error/30'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REPORT MODERATION */}
      {activeTab === 'reports' && (
        <div className="bg-white border border-neutral-border rounded shadow-subtle p-6 space-y-4">
          <h3 className="font-serif text-base font-bold text-navy-deep">
            Student Reports & Content Moderation
          </h3>

          {reports.length === 0 ? (
            <p className="text-xs text-neutral-muted py-8 text-center">
              No reports currently filed. All competition listings are in good standing.
            </p>
          ) : (
            <div className="divide-y divide-neutral-border/60">
              {reports.map((rep) => (
                <div key={rep.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-academic-error bg-red-50 px-2 py-0.5 rounded border border-academic-error/30">
                        {rep.reason}
                      </span>
                      <span className="text-xs font-semibold text-navy-deep">
                        Competition: <Link href={`/competitions/${rep.competition_id}`} className="hover:underline text-navy-primary">{rep.competition_name || rep.competition_id}</Link>
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${rep.status === 'pending' ? 'bg-amber-50 text-academic-warning' : 'bg-green-50 text-academic-success'}`}>
                        {rep.status}
                      </span>
                    </div>
                    {rep.additional_details && (
                      <p className="text-xs text-neutral-text pl-1">{rep.additional_details}</p>
                    )}
                    <p className="text-[11px] text-neutral-muted pl-1">
                      Reported by {rep.reporting_user_name || 'Student'} on {formatDateTime(rep.created_at)}
                    </p>
                  </div>

                  {rep.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateReport(rep.id, 'reviewed')}
                        className="btn-secondary text-xs py-1.5 px-3"
                      >
                        Mark Reviewed
                      </button>
                      <button
                        onClick={() => handleUpdateReport(rep.id, 'resolved')}
                        className="btn-primary text-xs py-1.5 px-3"
                      >
                        Resolve Report
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white border border-neutral-border rounded shadow-subtle p-6 space-y-4">
          <h3 className="font-serif text-base font-bold text-navy-deep">
            Registered Users & Role Management
          </h3>

          <div className="overflow-x-auto border border-neutral-border rounded">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-ivory border-b border-neutral-border text-neutral-muted uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Program</th>
                  <th className="py-2.5 px-3">Current Role</th>
                  <th className="py-2.5 px-3 text-right">Role Assignment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-border/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-ivory/30">
                    <td className="py-3 px-3 font-semibold text-navy-deep">{u.display_name}</td>
                    <td className="py-3 px-3 text-neutral-text font-mono text-[11px]">{u.email}</td>
                    <td className="py-3 px-3 text-neutral-muted">{u.program_of_study || 'Student'}</td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${u.role === 'admin' ? 'bg-navy-primary text-white' : 'bg-ivory text-neutral-text border border-neutral-border'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {u.id !== user?.id && (
                        <button
                          onClick={() => handleToggleUserRole(u)}
                          className="text-xs text-navy-primary hover:text-brass font-medium underline"
                        >
                          {u.role === 'admin' ? 'Demote to Student' : 'Promote to Admin'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: NOTIFICATION LOGS & RETRY */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          {/* Email Delivery Diagnostics & Live Test Dispatch */}
          <div className="bg-white border border-neutral-border rounded p-6 shadow-subtle space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brass block mb-1">
                  Resend Email Infrastructure
                </span>
                <h3 className="font-serif text-xl font-bold text-navy-deep flex items-center gap-2">
                  <Mail className="w-5 h-5 text-navy-primary" />
                  <span>Email Delivery Diagnostics & Test Dispatch</span>
                </h3>
                <p className="text-xs text-neutral-muted mt-1 max-w-2xl">
                  Inspect the live Resend configuration, verified sender identity, and dispatch a real test email to confirm server-side transactional delivery.
                </p>
              </div>

              <button
                onClick={fetchEmailConfig}
                className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 self-start sm:self-auto"
                title="Refresh Configuration"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Status</span>
              </button>
            </div>

            {/* Diagnostics Status Badges */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-3.5 rounded bg-ivory/50 border border-neutral-border space-y-1">
                <div className="text-[11px] font-bold uppercase text-neutral-muted">Resend API Key</div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${emailConfigInfo?.configured ? 'bg-academic-success' : 'bg-academic-error'}`} />
                  <span className="text-xs font-semibold text-navy-deep font-mono">
                    {emailConfigInfo?.configured ? (emailConfigInfo.apiKeyMasked || 'Configured') : 'Missing (RESEND_API_KEY)'}
                  </span>
                </div>
                <div className="text-[10px] text-neutral-muted">
                  {emailConfigInfo?.configured
                    ? 'Server-side key is active'
                    : 'Configure RESEND_API_KEY in Vercel / .env.local'}
                </div>
              </div>

              <div className="p-3.5 rounded bg-ivory/50 border border-neutral-border space-y-1">
                <div className="text-[11px] font-bold uppercase text-neutral-muted">Sender Identity (EMAIL_FROM)</div>
                <div className="text-xs font-semibold text-navy-deep font-mono truncate" title={emailConfigInfo?.from || 'Default'}>
                  {emailConfigInfo?.from || 'Case Hub <onboarding@resend.dev>'}
                </div>
                <div className="text-[10px] text-neutral-muted">
                  {emailConfigInfo?.isDefaultSender
                    ? 'Resend shared domain (testing)'
                    : 'Custom sender domain'}
                </div>
              </div>

              <div className="p-3.5 rounded bg-ivory/50 border border-neutral-border space-y-1">
                <div className="text-[11px] font-bold uppercase text-neutral-muted">Admin Alerts Target</div>
                <div className="text-xs font-semibold text-navy-deep font-mono truncate" title={emailConfigInfo?.notificationRecipients?.join(', ') || 'Not set'}>
                  {emailConfigInfo?.notificationRecipients && emailConfigInfo.notificationRecipients.length > 0
                    ? emailConfigInfo.notificationRecipients.join(', ')
                    : 'ADMIN_NOTIFICATION_EMAILS not set'}
                </div>
                <div className="text-[10px] text-neutral-muted">
                  Receives new competition alerts
                </div>
              </div>
            </div>

            {/* Test Email Dispatch Form */}
            <div className="pt-2 border-t border-neutral-border/60">
              <label className="block text-xs font-bold text-navy-deep mb-1.5">
                Send a Real Test Email via Resend
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder={user?.email || 'Enter recipient email address...'}
                  value={testEmailRecipient}
                  onChange={(e) => setTestEmailRecipient(e.target.value)}
                  className="flex-1 px-3.5 py-2 border border-neutral-border rounded text-xs text-neutral-text focus:outline-none focus:border-brass bg-white"
                />
                <button
                  onClick={handleSendTestEmail}
                  disabled={testEmailLoading}
                  className="btn-primary text-xs px-5 py-2 font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testEmailLoading ? 'animate-spin' : ''}`} />
                  <span>{testEmailLoading ? 'Dispatching via Resend...' : 'Send Test Email'}</span>
                </button>
              </div>

              {testEmailResult && (
                <div className={`mt-3 p-3.5 rounded text-xs border ${
                  testEmailResult.success
                    ? 'bg-green-50 border-academic-success/30 text-academic-success'
                    : 'bg-red-50 border-academic-error/30 text-academic-error'
                }`}>
                  <div className="font-semibold">{testEmailResult.message || testEmailResult.error}</div>
                  {testEmailResult.messageId && (
                    <div className="mt-1 text-[11px] font-mono text-neutral-muted">
                      Resend Message ID: {testEmailResult.messageId}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Email Outbox Log Table */}
          <div className="bg-white border border-neutral-border rounded shadow-subtle p-6 space-y-4">
            <h3 className="font-serif text-base font-bold text-navy-deep">
              Email Notification Outbox & Retry Log
            </h3>
            <p className="text-xs text-neutral-muted">
              Inspect all platform-generated transactional emails, administrative new-upload alerts, closing-soon reminders, and delivery outcomes.
            </p>

          <div className="overflow-x-auto border border-neutral-border rounded">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-ivory border-b border-neutral-border text-neutral-muted uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Template</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-border/60">
                {notificationLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-neutral-muted">
                      No email records logged yet.
                    </td>
                  </tr>
                ) : (
                  notificationLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-ivory/30">
                      <td className="py-2.5 px-3 font-medium text-navy-deep truncate max-w-[150px]">
                        {log.recipient_name}
                        <span className="block text-[10px] text-neutral-muted font-mono">{log.recipient_email}</span>
                      </td>
                      <td className="py-2.5 px-3 text-neutral-text truncate max-w-[200px]">{log.subject}</td>
                      <td className="py-2.5 px-3 text-[11px] text-neutral-muted uppercase">{log.template_type}</td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${log.status === 'sent' ? 'bg-green-50 text-academic-success' : log.status === 'failed' ? 'bg-red-50 text-academic-error' : 'bg-ivory text-neutral-text'}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-neutral-muted whitespace-nowrap text-[11px]">{formatDateTime(log.created_at)}</td>
                      <td className="py-2.5 px-3 text-right">
                        {log.status === 'failed' && (
                          <button
                            onClick={() => handleRetryNotification(log.id)}
                            className="text-xs text-navy-primary hover:underline font-semibold"
                          >
                            Retry
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteCompetition}
        title="Admin Delete Competition"
        message={`Are you sure you want to permanently delete "${deleteTarget?.name}"? This removes the competition from all student dashboards.`}
      />
    </div>
  );
}
