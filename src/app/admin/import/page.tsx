'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import * as XLSX from 'xlsx';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';

export default function BulkImportPage() {
  const { user, isAdmin, isAuthenticated, loading: authLoading } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setError('');
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data = XLSX.utils.sheet_to_json(ws);

        if (!data || data.length === 0) {
          setError('Spreadsheet appears to be empty.');
          return;
        }

        setParsedRows(data);
      } catch (err: any) {
        setError(`Failed to parse spreadsheet: ${err.message}`);
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Competition Name': 'National Strategy League 2026',
        Organizer: 'HSB Jaipur Consulting Club',
        Description: 'Formulate an omnichannel market entry strategy for a high-growth consumer brand.',
        Category: 'Case Competitions',
        Industry: 'Consulting & Strategy',
        'Registration Deadline': '2026-11-15T18:00:00Z',
        Mode: 'Hybrid',
        'Min Team Size': 2,
        'Max Team Size': 4,
        Eligibility: 'Open to all postgraduate business students',
        'Official Registration URL': 'https://unstop.com/competitions/strategy-league-2026',
        'Prize Details': '₹2,50,000 Total Prize Pool',
        'Entry Fee': 'Free',
        'Poster URL': 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Competitions_Template');
    XLSX.writeFile(wb, 'case_hub_bulk_import_template.xlsx');
  };

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return;

    try {
      setImporting(true);
      setError('');
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: parsedRows }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Bulk import failed');
        return;
      }

      setImportResult(data);
    } catch (err: any) {
      setError(err.message || 'Network error during import');
    } finally {
      setImporting(false);
    }
  };

  if (authLoading) {
    return <div className="max-w-4xl mx-auto px-4 py-20 text-center text-sm text-neutral-muted">Checking authorization...</div>;
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-academic-error mx-auto" />
        <h1 className="font-serif text-2xl font-bold text-navy-deep">Administrator Access Required</h1>
        <p className="text-sm text-neutral-muted">
          Only authorized HSB Jaipur administrators have permission to perform bulk imports.
        </p>
        <Link href="/login?redirect=/admin/import" className="btn-primary inline-flex text-sm px-6 py-2.5">
          Sign In as Admin
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-neutral-border flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-brass block mb-1">
            Administrative Operations
          </span>
          <h1 className="font-serif text-3xl font-bold text-navy-deep">
            Bulk Competition Import
          </h1>
          <p className="text-sm text-neutral-muted mt-1 max-w-2xl">
            Upload CSV or Excel spreadsheets (.xlsx) to batch-publish competitions. Valid records are published immediately.
          </p>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="btn-secondary text-xs px-4 py-2.5 self-start sm:self-auto flex items-center gap-1.5"
        >
          <Download className="w-4 h-4 text-brass" />
          <span>Download Excel Template</span>
        </button>
      </div>

      {/* Upload Zone */}
      <div className="bg-white border border-neutral-border rounded p-6 sm:p-8 shadow-subtle space-y-6">
        <div className="border-2 border-dashed border-neutral-border rounded p-8 text-center hover:border-brass transition-colors bg-ivory/20">
          <FileSpreadsheet className="w-12 h-12 text-neutral-muted mx-auto mb-3" />
          <h3 className="font-serif text-base font-bold text-navy-deep">
            Select Spreadsheet File (.xlsx or .csv)
          </h3>
          <p className="text-xs text-neutral-muted mt-1 mb-4">
            Upload a populated spreadsheet matching the standard Case Hub schema.
          </p>
          <label className="btn-primary text-xs px-5 py-2.5 cursor-pointer inline-flex items-center gap-2">
            <UploadCloud className="w-4 h-4" />
            <span>Choose File</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          {file && (
            <p className="text-xs font-semibold text-navy-deep mt-3">
              Selected: {file.name} ({parsedRows.length} rows detected)
            </p>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-academic-error/40 text-academic-error rounded text-xs flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Import Results Banner */}
        {importResult && (
          <div className="p-6 bg-ivory border border-neutral-border rounded shadow-subtle space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-academic-success shrink-0" />
              <div>
                <h4 className="font-serif text-base font-bold text-navy-deep">
                  Bulk Import Completed
                </h4>
                <p className="text-xs text-neutral-muted">
                  Successfully imported and published <strong className="text-academic-success">{importResult.importedCount}</strong> competition(s).
                  {importResult.errorsCount > 0 && ` Flagged ${importResult.errorsCount} row(s) with validation errors.`}
                </p>
              </div>
            </div>

            {importResult.rowErrors && importResult.rowErrors.length > 0 && (
              <div className="mt-4 p-4 bg-white border border-academic-error/30 rounded text-xs space-y-2">
                <span className="font-bold text-academic-error block">Row Validation Errors:</span>
                <ul className="list-disc pl-5 space-y-1 text-neutral-text">
                  {importResult.rowErrors.map((re: any, i: number) => (
                    <li key={i}>
                      <strong>Row {re.rowNumber} ("{re.name}"):</strong> {re.errors.join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-2">
              <Link href="/competitions" className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5">
                <span>View Directory with Imported Competitions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Parsed Preview Table */}
        {parsedRows.length > 0 && !importResult && (
          <div className="space-y-4 pt-4 border-t border-neutral-border">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-base font-bold text-navy-deep">
                Spreadsheet Preview ({parsedRows.length} Rows)
              </h3>
              <button
                onClick={handleExecuteImport}
                disabled={importing}
                className="btn-primary text-xs px-6 py-2.5 font-semibold"
              >
                {importing ? 'Processing Import...' : `Import & Publish ${parsedRows.length} Competitions`}
              </button>
            </div>

            <div className="overflow-x-auto max-h-96 border border-neutral-border rounded">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-ivory border-b border-neutral-border text-neutral-muted uppercase text-[10px] tracking-wider sticky top-0">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Competition Name</th>
                    <th className="py-2.5 px-3">Organizer</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Deadline</th>
                    <th className="py-2.5 px-3">Mode</th>
                    <th className="py-2.5 px-3">Team Size</th>
                    <th className="py-2.5 px-3">Registration URL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-border/60">
                  {parsedRows.slice(0, 20).map((row, idx) => (
                    <tr key={idx} className="hover:bg-ivory/30">
                      <td className="py-2 px-3 text-neutral-muted">{idx + 1}</td>
                      <td className="py-2 px-3 font-semibold text-navy-deep max-w-[180px] truncate">
                        {row.name || row['Competition Name'] || '—'}
                      </td>
                      <td className="py-2 px-3 text-neutral-text truncate max-w-[120px]">
                        {row.organizer || row['Organizer'] || '—'}
                      </td>
                      <td className="py-2 px-3 text-neutral-text">
                        {row.category || row['Category'] || '—'}
                      </td>
                      <td className="py-2 px-3 text-neutral-text whitespace-nowrap">
                        {row.registration_deadline || row['Registration Deadline'] || '—'}
                      </td>
                      <td className="py-2 px-3 text-neutral-text">
                        {row.mode || row['Mode'] || 'Online'}
                      </td>
                      <td className="py-2 px-3 text-neutral-text">
                        {row.min_team_size || row['Min Team Size'] || 1}–
                        {row.max_team_size || row['Max Team Size'] || 4}
                      </td>
                      <td className="py-2 px-3 text-navy-primary font-mono text-[10px] truncate max-w-[180px]">
                        {row.official_registration_url || row['Official Registration URL'] || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedRows.length > 20 && (
              <p className="text-[11px] text-neutral-muted text-right">
                Showing first 20 rows of {parsedRows.length} total rows.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
