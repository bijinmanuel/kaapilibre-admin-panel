'use client';

import React, { useState, useEffect } from 'react';
import { FinanceLayout } from '@/components/finance/FinanceLayout';
import { EmptyState } from '@/components/finance/EmptyState';
import { LoadingState } from '@/components/finance/LoadingState';
import { ErrorState } from '@/components/finance/ErrorState';
import { DateRangePicker, DateRange } from '@/components/finance/DateRangePicker';
import { RoleGuard } from '@/components/finance/RoleGuard';
import { formatINR } from '@/utils/finance';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  ChevronDown, ChevronRight, Search, RefreshCw, Ban,
  ArrowDownRight, ArrowUpRight, Filter, Eye, X, Loader2
} from 'lucide-react';

interface LedgerLine {
  account_id: {
    _id: string;
    code: number;
    name: string;
    type: string;
  } | null;
  debit: number;
  credit: number;
  running_balance: number;
}

interface LedgerEntry {
  _id: string;
  transaction_id: string;
  entry_date: string;
  transaction_type: string;
  reference_type: string;
  reference_id?: string;
  description: string;
  lines: LedgerLine[];
  created_by?: { _id: string; name: string; email: string };
  is_voided: boolean;
  voided_by?: { name: string };
  voided_at?: string;
  void_reason?: string;
  createdAt: string;
}

const TXN_TYPES = [
  { id: '', label: 'All Types' },
  { id: 'cafe_sale', label: 'Cafe Sale' },
  { id: 'online_sale', label: 'Online Sale' },
  { id: 'expense', label: 'Expense' },
  { id: 'loan_received', label: 'Loan Received' },
  { id: 'loan_repayment', label: 'Loan Repayment' },
  { id: 'account_transfer', label: 'Transfer' },
  { id: 'owner_investment', label: 'Investment' },
  { id: 'owner_drawing', label: 'Drawing' },
  { id: 'adjustment', label: 'Adjustment' },
  { id: 'opening_balance', label: 'Opening Balance' },
];

export default function LedgerPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  // Filters
  const [txnType, setTxnType] = useState('');
  const [showVoided, setShowVoided] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: '', endDate: '' });
  const [page, setPage] = useState(1);

  // Data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ totalDebits: 0, totalCredits: 0, entryCount: 0 });

  // Expanded rows
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Void modal
  const [voidTargetId, setVoidTargetId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [voiding, setVoiding] = useState(false);

  const loadEntries = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (txnType) params.append('transaction_type', txnType);
      if (showVoided) params.append('voided', 'true');
      if (searchQuery) params.append('search', searchQuery);
      if (dateRange.startDate) params.append('from', dateRange.startDate);
      if (dateRange.endDate) params.append('to', dateRange.endDate);

      const res: any = await api.get(`/finance/ledger?${params.toString()}`);
      if (res?.success) {
        setEntries(res.data || []);
        setTotalPages(res.meta?.totalPages || 1);
        setStats({
          totalDebits: res.stats?.totalDebits || 0,
          totalCredits: res.stats?.totalCredits || 0,
          entryCount: res.stats?.entryCount || 0,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch ledger entries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [txnType, showVoided, dateRange, page]);

  const handleSearch = () => {
    setPage(1);
    loadEntries();
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleVoidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidReason.trim() || !voidTargetId) return;

    try {
      setVoiding(true);
      const res: any = await api.patch(`/finance/ledger/${voidTargetId}/void`, {
        void_reason: voidReason,
      });
      if (res?.success) {
        toast.success('Ledger entry voided and balances reversed');
        setVoidTargetId(null);
        setVoidReason('');
        loadEntries();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to void entry');
    } finally {
      setVoiding(false);
    }
  };

  const getTxnColor = (type: string) => {
    const colors: Record<string, string> = {
      cafe_sale: 'bg-emerald-500/10 text-emerald-400',
      online_sale: 'bg-blue-500/10 text-blue-400',
      expense: 'bg-red-500/10 text-red-400',
      loan_received: 'bg-purple-500/10 text-purple-400',
      loan_repayment: 'bg-orange-500/10 text-orange-400',
      account_transfer: 'bg-cyan-500/10 text-cyan-400',
      owner_investment: 'bg-[#d4a853]/10 text-[#d4a853]',
      owner_drawing: 'bg-pink-500/10 text-pink-400',
      adjustment: 'bg-yellow-500/10 text-yellow-400',
      opening_balance: 'bg-indigo-500/10 text-indigo-400',
    };
    return colors[type] || 'bg-secondary text-muted-foreground';
  };

  const getEntryTotal = (lines: LedgerLine[]) => {
    return lines.reduce((sum, l) => sum + l.debit, 0);
  };

  return (
    <FinanceLayout
      title="General Ledger"
      description="Complete chronological double-entry journal of all financial transactions."
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Debits</p>
          <h3 className="text-xl font-bold text-foreground mt-1 flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            {formatINR(stats.totalDebits)}
          </h3>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Credits</p>
          <h3 className="text-xl font-bold text-foreground mt-1 flex items-center gap-2">
            <ArrowDownRight className="w-4 h-4 text-red-400" />
            {formatINR(stats.totalCredits)}
          </h3>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Journal Entries</p>
          <h3 className="text-xl font-bold text-foreground mt-1">{stats.entryCount}</h3>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Transaction Type */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={txnType}
              onChange={(e) => { setTxnType(e.target.value); setPage(1); }}
              className="bg-black/5 dark:bg-black/40 border border-border rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-[#d4a853] min-w-[180px]"
            >
              {TXN_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="bg-secondary border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-[#d4a853] w-56"
              />
            </div>

            {/* Voided Toggle */}
            <button
              onClick={() => { setShowVoided(!showVoided); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                showVoided
                  ? 'border-red-500/30 bg-red-500/10 text-red-400'
                  : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              <Ban className="w-3 h-3 inline mr-1" />
              {showVoided ? 'Voided Only' : 'Show Voided'}
            </button>

            {/* Refresh */}
            <button
              onClick={loadEntries}
              className="p-2 bg-secondary border border-border rounded-xl text-muted-foreground hover:text-foreground transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <DateRangePicker onChange={setDateRange} />
        </div>
      </div>

      {/* Ledger Table */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadEntries} />
      ) : entries.length === 0 ? (
        <EmptyState
          title="No ledger entries found"
          description="There are no journal entries matching your current filters."
        />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-secondary border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
              <tr>
                <th className="w-8 px-3 py-4"></th>
                <th className="text-left px-4 py-4 font-semibold">Date</th>
                <th className="text-left px-4 py-4 font-semibold">Type</th>
                <th className="text-left px-4 py-4 font-semibold">Description</th>
                <th className="text-right px-4 py-4 font-semibold">Total</th>
                <th className="text-left px-4 py-4 font-semibold">By</th>
                <th className="text-center px-4 py-4 font-semibold">Status</th>
                <th className="text-right px-4 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground/90">
              {entries.map((entry) => {
                const isExpanded = expandedIds.has(entry._id);
                const total = getEntryTotal(entry.lines);

                return (
                  <React.Fragment key={entry._id}>
                    {/* Main Row */}
                    <tr
                      onClick={() => toggleExpand(entry._id)}
                      className={`hover:bg-secondary/50 transition-colors cursor-pointer group ${
                        entry.is_voided ? 'opacity-60' : ''
                      }`}
                    >
                      <td className="px-3 py-4 text-center">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </td>
                      <td className={`px-4 py-4 text-muted-foreground whitespace-nowrap ${entry.is_voided ? 'line-through' : ''}`}>
                        {new Date(entry.entry_date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getTxnColor(entry.transaction_type)}`}>
                          {entry.transaction_type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className={`px-4 py-4 font-medium max-w-[260px] truncate ${entry.is_voided ? 'line-through' : ''}`}>
                        {entry.description}
                        {entry.is_voided && entry.void_reason && (
                          <p className="text-[10px] text-red-400 font-normal mt-0.5 no-underline" style={{ textDecoration: 'none' }}>
                            Void: {entry.void_reason}
                          </p>
                        )}
                      </td>
                      <td className={`px-4 py-4 text-right font-bold ${entry.is_voided ? 'line-through' : ''}`}>
                        {formatINR(total)}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">
                        {entry.created_by?.name || '-'}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {entry.is_voided ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400">
                            <Ban className="w-3 h-3" /> VOIDED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end items-center gap-1.5">
                          <button
                            onClick={() => toggleExpand(entry._id)}
                            title="View lines"
                            className="p-1 rounded bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {isAdmin && !entry.is_voided && (
                            <button
                              onClick={() => setVoidTargetId(entry._id)}
                              title="Void this entry"
                              className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Detail Row */}
                    {isExpanded && (
                      <tr className="bg-secondary/30">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="rounded-xl border border-border overflow-hidden bg-card/50">
                            <table className="w-full text-xs">
                              <thead className="bg-secondary/60 text-muted-foreground uppercase text-[9px] tracking-wider">
                                <tr>
                                  <th className="text-left px-4 py-2.5 font-semibold">Account Code</th>
                                  <th className="text-left px-4 py-2.5 font-semibold">Account Name</th>
                                  <th className="text-right px-4 py-2.5 font-semibold">Debit</th>
                                  <th className="text-right px-4 py-2.5 font-semibold">Credit</th>
                                  <th className="text-right px-4 py-2.5 font-semibold">Running Balance</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {entry.lines.map((line, idx) => (
                                  <tr key={idx} className="hover:bg-secondary/40 transition-colors">
                                    <td className="px-4 py-2.5 font-mono text-muted-foreground">
                                      {line.account_id?.code || '-'}
                                    </td>
                                    <td className="px-4 py-2.5 font-medium">
                                      {line.account_id?.name || 'Unknown'}
                                      <span className="ml-2 text-[9px] text-muted-foreground capitalize">
                                        ({line.account_id?.type || '-'})
                                      </span>
                                    </td>
                                    <td className={`px-4 py-2.5 text-right font-mono ${line.debit > 0 ? 'text-emerald-400 font-bold' : 'text-muted-foreground'}`}>
                                      {line.debit > 0 ? formatINR(line.debit) : '—'}
                                    </td>
                                    <td className={`px-4 py-2.5 text-right font-mono ${line.credit > 0 ? 'text-red-400 font-bold' : 'text-muted-foreground'}`}>
                                      {line.credit > 0 ? formatINR(line.credit) : '—'}
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-mono text-foreground">
                                      {formatINR(line.running_balance)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-4 text-[10px] text-muted-foreground">
                            <span>Txn ID: <code className="font-mono text-foreground/70">{entry.transaction_id?.slice(-8)}</code></span>
                            <span>Ref: <code className="font-mono text-foreground/70">{entry.reference_type}</code></span>
                            <span>Posted: {new Date(entry.createdAt).toLocaleString('en-IN')}</span>
                            {entry.is_voided && entry.voided_by && (
                              <span className="text-red-400">
                                Voided by {entry.voided_by.name} on {new Date(entry.voided_at!).toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-muted-foreground font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* Void Confirmation Modal */}
      {voidTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
            <h3 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
              <Ban className="w-4 h-4 text-red-400" />
              Void Ledger Entry
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              This action will reverse all account balance changes. This cannot be undone.
            </p>

            <form onSubmit={handleVoidSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Reason for Voiding *
                </label>
                <textarea
                  placeholder="e.g. Duplicate entry, incorrect amount..."
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-red-400 h-24 resize-none"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { setVoidTargetId(null); setVoidReason(''); }}
                  className="px-4 py-2 border border-border rounded-xl text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={voiding || !voidReason.trim()}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 transition-colors disabled:opacity-40 flex items-center gap-1.5"
                >
                  {voiding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />}
                  {voiding ? 'Voiding...' : 'Void Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </FinanceLayout>
  );
}
