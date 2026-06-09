'use client';

import { useState, useEffect } from 'react';
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
  Plus, ArrowRightLeft, RefreshCw, Loader2, X, ArrowRight
} from 'lucide-react';

interface AccountItem {
  _id: string;
  code: number;
  name: string;
  type: string;
  current_balance: number;
  is_active: boolean;
}

interface TransferItem {
  _id: string;
  from_account_id: { _id: string; code: number; name: string; type: string } | null;
  to_account_id: { _id: string; code: number; name: string; type: string } | null;
  amount: number;
  transfer_date: string;
  description?: string;
  created_by?: { name: string; email: string };
  createdAt: string;
}

export default function TransfersPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  // Data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransferred, setTotalTransferred] = useState(0);
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: '', endDate: '' });

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [formFromId, setFormFromId] = useState('');
  const [formToId, setFormToId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDescription, setFormDescription] = useState('');

  const loadTransfers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (dateRange.startDate) params.append('from', dateRange.startDate);
      if (dateRange.endDate) params.append('to', dateRange.endDate);

      const res: any = await api.get(`/finance/transfers?${params.toString()}`);
      if (res?.success) {
        setTransfers(res.data || []);
        setTotalPages(res.meta?.totalPages || 1);
        setTotalTransferred(res.stats?.totalTransferred || 0);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch transfers.');
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const res: any = await api.get('/finance/accounts/setup');
      if (res?.success) {
        setAccounts((res.data || []).filter((a: AccountItem) => a.is_active));
      }
    } catch (err: any) {
      toast.error('Failed to load accounts');
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    loadTransfers();
  }, [dateRange, page]);

  const handleOpenCreate = () => {
    setFormFromId('');
    setFormToId('');
    setFormAmount('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormDescription('');
    setShowCreateModal(true);
    loadAccounts();
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formFromId || !formToId) {
      toast.error('Please select both source and destination accounts.');
      return;
    }
    if (formFromId === formToId) {
      toast.error('Source and destination accounts cannot be the same.');
      return;
    }
    const valAmt = Number(formAmount);
    if (!formAmount || isNaN(valAmt) || valAmt <= 0) {
      toast.error('Please enter a valid positive amount.');
      return;
    }

    try {
      setSubmitting(true);
      const res: any = await api.post('/finance/transfers', {
        from_account_id: formFromId,
        to_account_id: formToId,
        amount: valAmt,
        transfer_date: new Date(formDate),
        description: formDescription,
      });

      if (res?.success) {
        toast.success('Transfer completed and ledger posted');
        setShowCreateModal(false);
        loadTransfers();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create transfer');
    } finally {
      setSubmitting(false);
    }
  };

  const getAccountLabel = (acc: AccountItem) => `${acc.code} — ${acc.name}`;

  return (
    <FinanceLayout
      title="Account Transfers"
      description="Move funds between accounts with full double-entry ledger posting."
    >
      {/* Summary Card */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        <div className="bg-card border border-border rounded-xl p-6 relative overflow-hidden flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Transferred</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{formatINR(totalTransferred)}</h3>
          </div>

          <RoleGuard allowedRoles={['admin']}>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-md"
              style={{ backgroundColor: '#d4a853', color: '#1a1713' }}
            >
              <Plus className="w-4 h-4" /> New Transfer
            </button>
          </RoleGuard>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-semibold">Filter by Date Range</span>
          </div>
          <button
            onClick={loadTransfers}
            className="p-2 bg-secondary border border-border rounded-xl text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        <DateRangePicker onChange={setDateRange} />
      </div>

      {/* Transfers Table */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadTransfers} />
      ) : transfers.length === 0 ? (
        <EmptyState
          title="No transfers found"
          description="No inter-account transfers have been made yet."
        />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-secondary border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
              <tr>
                <th className="text-left px-5 py-4 font-semibold">Date</th>
                <th className="text-left px-5 py-4 font-semibold">From Account</th>
                <th className="w-8 px-2 py-4"></th>
                <th className="text-left px-5 py-4 font-semibold">To Account</th>
                <th className="text-right px-5 py-4 font-semibold">Amount</th>
                <th className="text-left px-5 py-4 font-semibold">Description</th>
                <th className="text-left px-5 py-4 font-semibold">By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground/90">
              {transfers.map((item) => (
                <tr key={item._id} className="hover:bg-secondary/50 transition-colors">
                  <td className="px-5 py-4 text-muted-foreground whitespace-nowrap">
                    {new Date(item.transfer_date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-muted-foreground text-[10px]">
                        {item.from_account_id?.code}
                      </span>
                      <span className="font-medium">{item.from_account_id?.name || '-'}</span>
                    </div>
                  </td>
                  <td className="px-2 py-4 text-center">
                    <ArrowRight className="w-3.5 h-3.5 text-[#d4a853] mx-auto" />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-muted-foreground text-[10px]">
                        {item.to_account_id?.code}
                      </span>
                      <span className="font-medium">{item.to_account_id?.name || '-'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right font-bold text-foreground">
                    {formatINR(item.amount)}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground max-w-[200px] truncate">
                    {item.description || '-'}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground whitespace-nowrap">
                    {item.created_by?.name || '-'}
                  </td>
                </tr>
              ))}
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

      {/* Create Transfer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-[#d4a853]" />
              New Account Transfer
            </h3>

            {loadingAccounts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-[#d4a853] animate-spin" />
              </div>
            ) : (
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    From Account (Source)
                  </label>
                  <select
                    value={formFromId}
                    onChange={(e) => setFormFromId(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-[#d4a853]"
                    required
                  >
                    <option value="">Select source account...</option>
                    {accounts.map((acc) => (
                      <option key={acc._id} value={acc._id}>
                        {getAccountLabel(acc)} ({formatINR(acc.current_balance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    To Account (Destination)
                  </label>
                  <select
                    value={formToId}
                    onChange={(e) => setFormToId(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-[#d4a853]"
                    required
                  >
                    <option value="">Select destination account...</option>
                    {accounts.map((acc) => (
                      <option key={acc._id} value={acc._id}>
                        {getAccountLabel(acc)} ({formatINR(acc.current_balance)})
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
                      placeholder="10000.00"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-[#d4a853]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      Transfer Date
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
                    Description (Optional)
                  </label>
                  <textarea
                    placeholder="e.g. Monthly cash deposit to bank..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-[#d4a853] h-20 resize-none"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-border rounded-xl text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-1.5"
                    style={{ backgroundColor: '#d4a853', color: '#1a1713' }}
                  >
                    {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRightLeft className="w-3 h-3" />}
                    {submitting ? 'Posting...' : 'Execute Transfer'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </FinanceLayout>
  );
}
