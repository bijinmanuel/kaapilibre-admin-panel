'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { FinanceLayout } from '@/components/finance/FinanceLayout';
import { EmptyState } from '@/components/finance/EmptyState';
import { LoadingState } from '@/components/finance/LoadingState';
import { ErrorState } from '@/components/finance/ErrorState';
import { DateRangePicker, DateRange } from '@/components/finance/DateRangePicker';
import { formatINR } from '@/utils/finance';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Check, Trash2, Calendar, FileText, IndianRupee, Layers, RefreshCw, AlertTriangle, Loader2, Coffee, ShoppingBag, ArrowRight } from 'lucide-react';

interface RevenueItem {
  _id: string;
  source: 'cafe_order' | 'online_order' | 'manual';
  amount: number;
  entry_date: string;
  description: string;
  is_verified: boolean;
  account_id?: {
    code: number;
    name: string;
  };
  created_by?: {
    name: string;
    email: string;
  };
}

export default function RevenueModulePage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  // Filters
  const [source, setSource] = useState<string>(''); // '' represents 'All'
  const [verified, setVerified] = useState<string>(''); // '' or 'true' or 'false'
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: '', endDate: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revenues, setRevenues] = useState<RevenueItem[]>([]);
  const [sourceTotals, setSourceTotals] = useState({ cafe_order: 0, online_order: 0, manual: 0 });
  const [totalPages, setTotalPages] = useState(1);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);

  // Row loading states
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Confirmation popup state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState<{
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  const confirmAction = (title: string, message: string, onConfirm: () => void | Promise<void>) => {
    setConfirmModalData({
      title,
      message,
      onConfirm: async () => {
        await onConfirm();
        setShowConfirmModal(false);
        setConfirmModalData(null);
      }
    });
    setShowConfirmModal(true);
  };

  // Form Fields
  const [formAmount, setFormAmount] = useState('');
  const [formCreditAccount, setFormCreditAccount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSyncExisting = async () => {
    confirmAction(
      'Sync Historical Orders',
      'Are you sure you want to sync all completed cafe and online orders that are not yet recorded in the finance module? This will auto-post ledger journal entries for all missing payouts.',
      async () => {
        try {
          setSyncing(true);
          const res: any = await api.post('/finance/revenue/sync-existing');
          if (res?.success) {
            toast.success(res.message || 'Historical orders synced successfully!');
            loadRevenues(false);
          }
        } catch (err: any) {
          toast.error(err.message || 'Failed to sync historical orders.');
        } finally {
          setSyncing(false);
        }
      }
    );
  };

  const loadRevenues = async (showPageLoader = true, signal?: AbortSignal) => {
    try {
      if (showPageLoader) {
        setLoading(true);
      }
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
      });

      if (source) params.append('source', source);
      if (verified) params.append('verified', verified);
      if (dateRange.startDate) params.append('from', dateRange.startDate);
      if (dateRange.endDate) params.append('to', dateRange.endDate);
      if (search) params.append('search', search);

      const response: any = await api.get(`/finance/revenue?${params.toString()}`, { signal });
      if (response?.success) {
        setRevenues(response.data || []);
        setTotalPages(response.meta?.totalPages || 1);
        if (response.stats?.sourceTotals) {
          setSourceTotals(response.stats.sourceTotals);
        }
      }
    } catch (err: any) {
      if (axios.isCancel(err) || signal?.aborted) {
        return;
      }
      setError(err.message || 'Failed to fetch revenue records.');
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const loadAccounts = async () => {
    try {
      const response: any = await api.get('/finance/accounts');
      if (response?.success) {
        // Grouped accounts returned. Flatten and get Credit normal balance or revenue/equity type
        const flattened: any[] = [];
        Object.keys(response.data).forEach((type) => {
          response.data[type].forEach((acc: any) => {
            // Manual entries typically credit revenue (4000s) or equity capital (3000s)
            if (acc.normal_balance === 'credit') {
              flattened.push(acc);
            }
          });
        });
        setAccounts(flattened);
        if (flattened.length > 0) {
          setFormCreditAccount(flattened[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load accounts for dropdown:', err);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadRevenues(true, controller.signal);
    return () => {
      controller.abort();
    };
  }, [source, verified, dateRange, page]);

  useEffect(() => {
    if (showAddModal) {
      loadAccounts();
    }
  }, [showAddModal]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadRevenues();
  };

  const handleVerify = (id: string) => {
    toast('Verify this revenue entry?', {
      action: {
        label: 'Confirm',
        onClick: async () => {
          try {
            setVerifyingId(id);
            const res: any = await api.patch(`/finance/revenue/${id}/verify`);
            if (res?.success) {
              toast.success('Revenue entry verified successfully');
              await loadRevenues(false);
            }
          } catch (err: any) {
            toast.error(err.message || 'Verification failed');
          } finally {
            setVerifyingId(null);
          }
        }
      }
    });
  };

  const handleDelete = (id: string) => {
    toast('Delete this manual revenue entry?', {
      description: 'This will void the ledger entry.',
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            setDeletingId(id);
            const res: any = await api.delete(`/finance/revenue/${id}`);
            if (res?.success) {
              toast.success('Revenue entry deleted successfully');
              await loadRevenues(false);
            }
          } catch (err: any) {
            toast.error(err.message || 'Deletion failed');
          } finally {
            setDeletingId(null);
          }
        }
      }
    });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDescription.trim()) {
      toast.error('Description is required');
      return;
    }
    if (!formAmount || isNaN(Number(formAmount)) || Number(formAmount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    try {
      setSubmitting(true);
      const res: any = await api.post('/finance/revenue', {
        amount: Number(formAmount),
        account_id: formCreditAccount,
        entry_date: new Date(formDate),
        description: formDescription,
      });

      if (res?.success) {
        toast.success('Manual revenue entry posted successfully');
        setShowAddModal(false);
        setFormAmount('');
        setFormDescription('');
        setPage(1);
        loadRevenues(false);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit revenue');
    } finally {
      setSubmitting(false);
    }
  };

  const totalAllRevenue = (sourceTotals.cafe_order || 0) + (sourceTotals.online_order || 0) + (sourceTotals.manual || 0);
  const cafePercent = totalAllRevenue > 0 ? Math.round(((sourceTotals.cafe_order || 0) / totalAllRevenue) * 100) : 0;
  const onlinePercent = totalAllRevenue > 0 ? Math.round(((sourceTotals.online_order || 0) / totalAllRevenue) * 100) : 0;
  const manualPercent = totalAllRevenue > 0 ? Math.round(((sourceTotals.manual || 0) / totalAllRevenue) * 100) : 0;

  return (
    <FinanceLayout
      title="Revenue Entries"
      description="Track order-synced sales and record other operational/capital receipts."
    >
      {/* Priority Bento Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6 items-stretch">
        {/* Priority 1: Hero / Big Card (Total Revenue - All Inflows) */}
        <div
          onClick={() => {
            setSource('');
            setPage(1);
          }}
          className={`lg:col-span-5 rounded-2xl border p-5 sm:p-6 shadow-sm flex flex-col justify-between cursor-pointer transition-all group relative overflow-hidden ${
            source === ''
              ? 'border-primary/40 bg-gradient-to-br from-card via-card to-primary/[0.08] shadow-[0_0_20px_rgba(212,168,83,0.06)]'
              : 'border-border bg-card hover:border-primary/40'
          }`}
          title="Click to view all revenue entries"
        >
          {/* Subtle background ambient glow */}
          <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-primary/10 blur-2xl pointer-events-none group-hover:bg-primary/20 transition-all" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs shrink-0"
                  style={{ background: 'rgba(212, 168, 83, 0.18)', color: '#d4a853' }}
                >
                  <IndianRupee className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Total Inflow Revenue
                  </span>
                  <p className="text-[11px] text-muted-foreground">All Channels Combined</p>
                </div>
              </div>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border shrink-0"
                style={{
                  background: 'rgba(212, 168, 83, 0.15)',
                  color: '#d4a853',
                  borderColor: 'rgba(212, 168, 83, 0.3)'
                }}
              >
                {source ? 'Filtered View' : 'Primary Metric'}
              </span>
            </div>

            {/* Giant Hero Number */}
            <div className="my-3">
              <h2 className="text-3xl sm:text-4xl xl:text-[38px] font-extrabold tracking-tight text-foreground leading-none font-mono">
                {formatINR(totalAllRevenue)}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Consolidated revenue generated across cafe POS counter, online web orders, and manual ledger receipts.
            </p>
          </div>

          {/* Sub-breakdown mini pills (3 channels) */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/70 mt-2">
            <div className="bg-background/60 border border-border/60 rounded-lg p-2">
              <div className="flex items-center justify-between gap-1 text-[9px] font-semibold text-amber-500 uppercase tracking-wider">
                <span>Cafe POS</span>
                <span className="font-mono opacity-80">{cafePercent}%</span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-foreground mt-0.5 font-mono truncate">
                {formatINR(sourceTotals.cafe_order)}
              </p>
            </div>

            <div className="bg-background/60 border border-border/60 rounded-lg p-2">
              <div className="flex items-center justify-between gap-1 text-[9px] font-semibold text-blue-400 uppercase tracking-wider">
                <span>Online</span>
                <span className="font-mono opacity-80">{onlinePercent}%</span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-foreground mt-0.5 font-mono truncate">
                {formatINR(sourceTotals.online_order)}
              </p>
            </div>

            <div className="bg-background/60 border border-border/60 rounded-lg p-2">
              <div className="flex items-center justify-between gap-1 text-[9px] font-semibold text-emerald-400 uppercase tracking-wider">
                <span>Manual</span>
                <span className="font-mono opacity-80">{manualPercent}%</span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-foreground mt-0.5 font-mono truncate">
                {formatINR(sourceTotals.manual)}
              </p>
            </div>
          </div>
        </div>

        {/* Priority 2, 3, 4: Remaining 3 Secondary Cards (lg:col-span-7) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-stretch">
          {/* Card 1: Cafe Orders Revenue */}
          <div
            onClick={() => {
              setSource(source === 'cafe_order' ? '' : 'cafe_order');
              setPage(1);
            }}
            className={`rounded-2xl border p-4 sm:p-5 shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] group ${
              source === 'cafe_order'
                ? 'border-amber-500/60 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                : 'border-border bg-card hover:border-amber-500/40'
            }`}
            title="Click to filter by Cafe Orders"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">Cafe Orders</span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <Coffee className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-amber-500 font-mono mt-3">
                {formatINR(sourceTotals.cafe_order)}
              </p>
            </div>
            <div className="pt-3 border-t border-border/60 mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{cafePercent}% share · Counter POS</span>
              <ArrowRight className={`w-3.5 h-3.5 text-amber-500 transition-opacity ${source === 'cafe_order' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
            </div>
          </div>

          {/* Card 2: Online Orders Revenue */}
          <div
            onClick={() => {
              setSource(source === 'online_order' ? '' : 'online_order');
              setPage(1);
            }}
            className={`rounded-2xl border p-4 sm:p-5 shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] group ${
              source === 'online_order'
                ? 'border-blue-500/60 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                : 'border-border bg-card hover:border-blue-500/40'
            }`}
            title="Click to filter by Online Orders"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Online Orders</span>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-blue-400 font-mono mt-3">
                {formatINR(sourceTotals.online_order)}
              </p>
            </div>
            <div className="pt-3 border-t border-border/60 mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{onlinePercent}% share · Web store</span>
              <ArrowRight className={`w-3.5 h-3.5 text-blue-400 transition-opacity ${source === 'online_order' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
            </div>
          </div>

          {/* Card 3: Manual / Other Income */}
          <div
            onClick={() => {
              setSource(source === 'manual' ? '' : 'manual');
              setPage(1);
            }}
            className={`rounded-2xl border p-4 sm:p-5 shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] group ${
              source === 'manual'
                ? 'border-emerald-500/60 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                : 'border-border bg-card hover:border-emerald-500/40'
            }`}
            title="Click to filter by Manual Receipts"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Manual / Other</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-400 font-mono mt-3">
                {formatINR(sourceTotals.manual)}
              </p>
            </div>
            <div className="pt-3 border-t border-border/60 mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{manualPercent}% share · Direct entries</span>
              <ArrowRight className={`w-3.5 h-3.5 text-emerald-400 transition-opacity ${source === 'manual' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Action Bars & Filters */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Source pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold">Source:</span>
            <div className="flex flex-wrap gap-1 bg-black/5 dark:bg-black/40 p-1 rounded-xl border border-border">
              {[
                { id: '', label: 'All Sources' },
                { id: 'cafe_order', label: 'Cafe Sales' },
                { id: 'online_order', label: 'Online Sales' },
                { id: 'manual', label: 'Manual Entry' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSource(p.id);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${source === p.id
                    ? 'shadow-sm font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-black/10 dark:hover:bg-white/5'
                    }`}
                  style={source === p.id ? { backgroundColor: '#d4a853', color: '#1a1713' } : {}}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            {/* Verification Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-semibold">Verification:</span>
              <select
                value={verified}
                onChange={(e) => {
                  setVerified(e.target.value);
                  setPage(1);
                }}
                className="bg-black/5 dark:bg-black/40 border border-border rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-[#d4a853] min-w-[150px]"
              >
                <option value="">All Statuses</option>
                <option value="true">Verified Only</option>
                <option value="false">Unverified Only</option>
              </select>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={handleSyncExisting}
                disabled={syncing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-secondary border border-border hover:bg-secondary/80 disabled:opacity-50 transition-all shadow-md text-foreground"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Historical Orders'}
              </button>
            )}

            {/* Add Revenue Action */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-md"
              style={{ backgroundColor: '#d4a853', color: '#1a1713' }}
            >
              <Plus className="w-4 h-4" /> Add Revenue
            </button>
          </div>
        </div>

        {/* DateRange & Search */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 pt-4 border-t border-border">
          <div className="flex-1">
            <DateRangePicker onChange={setDateRange} />
          </div>
          <form onSubmit={handleSearchSubmit} className="flex gap-2 lg:w-96 items-center">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-black/5 dark:bg-black/40 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-[#d4a853] w-full h-[42px]"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-black/5 dark:bg-white/5 border border-border rounded-xl text-xs font-bold text-foreground hover:bg-black/10 dark:hover:bg-white/10 hover:border-border transition-all h-[42px] shrink-0"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Revenue Table */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadRevenues} />
      ) : revenues.length === 0 ? (
        <EmptyState
          title="No revenues found"
          description="There are no synced order payouts or manual entries matching these filters."
        />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-secondary border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
              <tr>
                <th className="text-left px-5 py-4 font-semibold">Date</th>
                <th className="text-left px-5 py-4 font-semibold">Description</th>
                <th className="text-left px-5 py-4 font-semibold">Source</th>
                <th className="text-left px-5 py-4 font-semibold">Ledger Account</th>
                <th className="text-right px-5 py-4 font-semibold">Amount</th>
                <th className="text-center px-5 py-4 font-semibold">Status</th>
                <th className="text-right px-5 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground/90">
              {revenues.map((item) => (
                <tr key={item._id} className="hover:bg-secondary/50 transition-colors group">
                  <td className="px-5 py-4 text-muted-foreground whitespace-nowrap">
                    {new Date(item.entry_date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-5 py-4 font-medium">
                    {item.description}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${item.source === 'cafe_order'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : item.source === 'online_order'
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-[#d4a853]/10 text-[#d4a853]'
                        }`}
                    >
                      {item.source === 'cafe_order'
                        ? 'Cafe'
                        : item.source === 'online_order'
                          ? 'Online'
                          : 'Manual'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {item.account_id ? `${item.account_id.code} - ${item.account_id.name}` : '-'}
                  </td>
                  <td className="px-5 py-4 text-right font-bold text-foreground">
                    {formatINR(item.amount)}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${item.is_verified
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-yellow-500/10 text-yellow-400'
                        }`}
                    >
                      {item.is_verified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end items-center gap-1.5">
                      {!item.is_verified && isAdmin && (
                        <button
                          onClick={() => handleVerify(item._id)}
                          title="Verify Entry"
                          disabled={verifyingId === item._id || deletingId === item._id}
                          className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50"
                        >
                          {verifyingId === item._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                      {item.source === 'manual' && isAdmin && (
                        <button
                          onClick={() => handleDelete(item._id)}
                          title="Delete & Void Ledger"
                          disabled={verifyingId === item._id || deletingId === item._id}
                          className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                        >
                          {deletingId === item._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Previous
          </button>
          <span className="text-xs text-muted-foreground font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Next
          </button>
        </div>
      )}

      {/* Add Revenue Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-base font-bold text-foreground mb-4">Add Manual Revenue Entry</h3>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Credit Account (Destination Category)
                </label>
                <select
                  value={formCreditAccount}
                  onChange={(e) => setFormCreditAccount(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-[#d4a853]"
                  required
                >
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.code} - {acc.name} ({acc.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="5000.00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-[#d4a853]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Entry Date
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-[#d4a853]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Description / Reference
                </label>
                <textarea
                  placeholder="e.g. Owner capital investment or bank interest"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-[#d4a853] h-20 resize-none"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-border rounded-xl text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2  rounded-xl text-xs font-bold hover:bg-primary/95 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Posting...' : 'Post Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Custom Confirm ──────────────────────────────────────────────── */}
      {showConfirmModal && confirmModalData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4 text-[#d4a853]">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <h3 className="text-sm font-bold text-foreground">{confirmModalData.title}</h3>
            </div>

            <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
              {confirmModalData.message}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => { setShowConfirmModal(false); setConfirmModalData(null); }}
                className="flex-1 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmModalData.onConfirm}
                className="flex-1 py-2 rounded-xl text-xs font-bold transition-all bg-[#d4a853] text-[#000000] dark:text-[#ffffff] hover:bg-[#d4a853]/90"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </FinanceLayout>
  );
}
