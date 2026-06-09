'use client';

import { useState, useEffect } from 'react';
import { FinanceLayout } from '@/components/finance/FinanceLayout';
import { LoadingState } from '@/components/finance/LoadingState';
import { ErrorState } from '@/components/finance/ErrorState';
import { formatINR } from '@/utils/finance';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Plus, X, ChevronDown, ChevronRight, Loader2,
  Building2, Users, User, TrendingDown, AlertTriangle,
  CheckCircle2, Clock, DollarSign, Calendar, CreditCard,
  ArrowDownLeft, RefreshCw, Eye
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Lender {
  _id: string;
  name: string;
  type: 'bank' | 'private' | 'owner';
  contact_name?: string;
  contact_phone?: string;
  notes?: string;
  is_active: boolean;
}

interface Loan {
  _id: string;
  lender_id: Lender | string;
  principal: number;
  interest_rate: number;
  term_months: number;
  disbursed_at: string;
  account_id: { _id: string; code: number; name: string } | string;
  status: 'active' | 'closed';
  notes?: string;
}

interface LoanRepayment {
  _id: string;
  loan_id: string;
  payment_date: string;
  principal_paid: number;
  interest_paid: number;
  total_paid: number;
  notes?: string;
}

interface LoanDetail {
  loan: Loan;
  repayments: LoanRepayment[];
  summary: {
    principal: number;
    totalPaid: number;
    principalPaid: number;
    interestPaid: number;
    remainingBalance: number;
    repaymentCount: number;
  };
}

interface AccountItem {
  _id: string;
  code: number;
  name: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const lenderIcon = (type: string) => {
  if (type === 'bank') return Building2;
  if (type === 'private') return Users;
  return User;
};

const lenderBadge = (type: string) => {
  if (type === 'bank') return { label: 'Bank', className: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' };
  if (type === 'private') return { label: 'Private', className: 'bg-purple-500/10 text-purple-400 border border-purple-500/20' };
  return { label: 'Owner', className: 'bg-[#d4a853]/10 text-[#d4a853] border border-[#d4a853]/20' };
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function LiabilitiesPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  // Data state
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // UI state
  const [activeTab, setActiveTab] = useState<'loans' | 'lenders'>('loans');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('active');
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [loanDetail, setLoanDetail] = useState<LoanDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Lender form modal
  const [showLenderModal, setShowLenderModal] = useState(false);
  const [lenderForm, setLenderForm] = useState({ name: '', type: 'bank' as 'bank' | 'private' | 'owner', contact_name: '', contact_phone: '', notes: '' });
  const [savingLender, setSavingLender] = useState(false);

  // Loan form modal
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [loanForm, setLoanForm] = useState({
    lender_id: '', principal: '', interest_rate: '', term_months: '',
    disbursed_at: new Date().toISOString().split('T')[0], account_id: '', notes: ''
  });
  const [savingLoan, setSavingLoan] = useState(false);

  // Repayment form modal
  const [showRepaymentModal, setShowRepaymentModal] = useState(false);
  const [repaymentLoanId, setRepaymentLoanId] = useState<string | null>(null);
  const [repaymentForm, setRepaymentForm] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    principal_paid: '', interest_paid: '', account_id: '', notes: ''
  });
  const [savingRepayment, setSavingRepayment] = useState(false);

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

  const loadAll = async (showSkeleton = false) => {
    try {
      if (showSkeleton) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      const [lendersRes, loansRes, accountsRes]: any = await Promise.all([
        api.get('/finance/lenders?active=true'),
        api.get(`/finance/loans?${statusFilter !== 'all' ? `status=${statusFilter}` : ''}&limit=100`),
        api.get('/finance/accounts'),
      ]);

      if (lendersRes?.success) setLenders(lendersRes.data || []);

      if (loansRes?.success) {
        setLoans(loansRes.data || []);
        setTotalOutstanding(loansRes.stats?.totalOutstanding ?? 0);
      }

      if (accountsRes?.success) {
        // Flatten grouped accounts to a flat list
        const flat: AccountItem[] = [];
        Object.values(accountsRes.data || {}).forEach((group: any) => {
          group.forEach((acc: any) => flat.push(acc));
        });
        setAccounts(flat.filter(a => a.code < 3000)); // Only asset accounts for receiving / paying
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load liabilities data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAll(isInitialLoad);
    if (isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [statusFilter]);

  const openLoanDetail = async (loanId: string) => {
    if (selectedLoanId === loanId) {
      setSelectedLoanId(null);
      setLoanDetail(null);
      return;
    }
    setSelectedLoanId(loanId);
    setLoadingDetail(true);
    try {
      const res: any = await api.get(`/finance/loans/${loanId}`);
      if (res?.success) setLoanDetail(res.data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load loan detail');
    } finally {
      setLoadingDetail(false);
    }
  };

  // ── Create Lender ──────────────────────────────────────────────────────────
  const handleCreateLender = async () => {
    if (!lenderForm.name.trim()) { toast.error('Lender name is required'); return; }
    setSavingLender(true);
    try {
      await api.post('/finance/lenders', lenderForm);
      toast.success('Lender created successfully');
      setShowLenderModal(false);
      setLenderForm({ name: '', type: 'bank', contact_name: '', contact_phone: '', notes: '' });
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create lender');
    } finally {
      setSavingLender(false);
    }
  };

  // ── Create Loan ────────────────────────────────────────────────────────────
  const handleCreateLoan = async () => {
    const { lender_id, principal, interest_rate, term_months, disbursed_at, account_id } = loanForm;
    if (!lender_id || !principal || !interest_rate || !term_months || !disbursed_at || !account_id) {
      toast.error('All required fields must be filled');
      return;
    }
    setSavingLoan(true);
    try {
      await api.post('/finance/loans', {
        lender_id,
        principal: Number(principal),
        interest_rate: Number(interest_rate),
        term_months: Number(term_months),
        disbursed_at,
        account_id,
        notes: loanForm.notes,
      });
      toast.success('Loan recorded and ledger posted!');
      setShowLoanModal(false);
      setLoanForm({ lender_id: '', principal: '', interest_rate: '', term_months: '', disbursed_at: new Date().toISOString().split('T')[0], account_id: '', notes: '' });
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create loan');
    } finally {
      setSavingLoan(false);
    }
  };

  // ── Create Repayment ───────────────────────────────────────────────────────
  const handleCreateRepayment = async () => {
    const { payment_date, principal_paid, interest_paid, account_id } = repaymentForm;
    if (!payment_date || !account_id || (Number(principal_paid) === 0 && Number(interest_paid) === 0)) {
      toast.error('Payment date, account, and at least one payment amount are required');
      return;
    }
    setSavingRepayment(true);
    try {
      await api.post(`/finance/loans/${repaymentLoanId}/repayments`, {
        payment_date,
        principal_paid: Number(principal_paid) || 0,
        interest_paid: Number(interest_paid) || 0,
        account_id,
        notes: repaymentForm.notes,
      });
      toast.success('Repayment recorded and ledger posted!');
      setShowRepaymentModal(false);
      setRepaymentForm({ payment_date: new Date().toISOString().split('T')[0], principal_paid: '', interest_paid: '', account_id: '', notes: '' });
      if (repaymentLoanId) openLoanDetail(repaymentLoanId);
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || 'Failed to record repayment');
    } finally {
      setSavingRepayment(false);
    }
  };

  // ── Close Loan ─────────────────────────────────────────────────────────────
  const handleCloseLoan = async (loanId: string) => {
    confirmAction(
      'Close Loan Liability',
      'Are you sure you want to mark this loan as fully closed? This action represents that the principal and all outstanding interest have been settled. This cannot be undone.',
      async () => {
        try {
          await api.patch(`/finance/loans/${loanId}/close`, {});
          toast.success('Loan has been closed successfully');
          await loadAll();
          if (selectedLoanId === loanId) { setSelectedLoanId(null); setLoanDetail(null); }
        } catch (err: any) {
          toast.error(err.message || 'Failed to close loan');
        }
      }
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  if (loading) return <FinanceLayout title="Liabilities & Loans"><LoadingState /></FinanceLayout>;
  if (error) return <FinanceLayout title="Liabilities & Loans"><ErrorState message={error} onRetry={loadAll} /></FinanceLayout>;

  const activeLoans = loans.filter(l => l.status === 'active');
  const closedLoans = loans.filter(l => l.status === 'closed');
  const totalInterestEstimate = activeLoans.reduce((s, l) => {
    const monthly = (l.principal * l.interest_rate) / (12 * 100);
    return s + (monthly * l.term_months);
  }, 0);

  return (
    <FinanceLayout
      title="Liabilities & Loans"
      description="Track lenders, active loans, repayment schedules, and interest obligations."
    >
      {/* ── KPI Row ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Outstanding */}
        <div className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Outstanding</p>
          <h3 className="text-xl font-bold text-red-400 mt-1.5">{formatINR(totalOutstanding)}</h3>
          <p className="text-[10px] text-muted-foreground mt-2">{activeLoans.length} active loan{activeLoans.length !== 1 ? 's' : ''}</p>
          <div className="absolute right-4 top-4 text-red-400/50"><TrendingDown className="w-10 h-10" /></div>
        </div>
        {/* Interest estimate */}
        <div className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Est. Total Interest</p>
          <h3 className="text-xl font-bold text-orange-400 mt-1.5">{formatINR(totalInterestEstimate)}</h3>
          <p className="text-[10px] text-muted-foreground mt-2">Over loan terms</p>
          <div className="absolute right-4 top-4 text-orange-400/50"><DollarSign className="w-10 h-10" /></div>
        </div>
        {/* Lenders */}
        <div className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Active Lenders</p>
          <h3 className="text-xl font-bold text-foreground mt-1.5">{lenders.length}</h3>
          <p className="text-[10px] text-muted-foreground mt-2">Banks, private, owner</p>
          <div className="absolute right-4 top-4 text-[#d4a853]/50"><Building2 className="w-10 h-10" /></div>
        </div>
        {/* Closed loans */}
        <div className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Closed Loans</p>
          <h3 className="text-xl font-bold text-emerald-400 mt-1.5">{closedLoans.length}</h3>
          <p className="text-[10px] text-muted-foreground mt-2">Fully repaid</p>
          <div className="absolute right-4 top-4 text-emerald-400/50"><CheckCircle2 className="w-10 h-10" /></div>
        </div>
      </div>

      {/* ── Tab Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex gap-1 bg-secondary p-1 rounded-xl items-center">
          {(['loans', 'lenders'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${activeTab === tab
                ? 'bg-[#d4a853]'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-[#000000] dark:hover:text-[#ffffff]'
                }`}
            >
              {tab === 'loans' ? `Loans (${loans.length})` : `Lenders (${lenders.length})`}
            </button>
          ))}
          {refreshing && (
            <div className="flex items-center justify-center px-2" title="Updating data...">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#d4a853]" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'loans' && (
            <div className="flex gap-1 bg-secondary p-1 rounded-xl">
              {(['active', 'all', 'closed'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all capitalize ${statusFilter === s
                    ? 'bg-[#d4a853] shadow'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {isAdmin && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowLenderModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground border border-border transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add Lender
              </button>
              <button
                onClick={() => setShowLoanModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={{ background: '#d4a853', color: '#1a1713' }}
              >
                <Plus className="w-3.5 h-3.5" /> New Loan
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── LOANS TAB ───────────────────────────────────────────────────────── */}
      {activeTab === 'loans' && (
        <div className="space-y-3">
          {loans.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <TrendingDown className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No loans found</p>
              {isAdmin && <p className="text-[11px] text-muted-foreground/60 mt-1">Click "New Loan" to record a loan from a lender.</p>}
            </div>
          ) : loans.map(loan => {
            const lender = typeof loan.lender_id === 'object' ? loan.lender_id as Lender : null;
            const LenderIcon = lenderIcon(lender?.type ?? 'bank');
            const badge = lenderBadge(lender?.type ?? 'bank');
            const isExpanded = selectedLoanId === loan._id;

            return (
              <div key={loan._id} className="bg-card border border-border rounded-2xl overflow-hidden">
                {/* Loan Header Row */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/50 transition-colors"
                  onClick={() => openLoanDetail(loan._id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(212,168,83,0.12)' }}>
                      <LenderIcon className="w-4 h-4 text-[#d4a853]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{lender?.name ?? 'Unknown Lender'}</p>
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${badge.className}`}>
                          {badge.label}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${loan.status === 'active'
                          ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                          {loan.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {loan.interest_rate}% p.a. · {loan.term_months} months · {new Date(loan.disbursed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{formatINR(loan.principal)}</p>
                      <p className="text-[10px] text-muted-foreground">Principal</p>
                    </div>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-border p-4 bg-secondary/30">
                    {loadingDetail && !loanDetail ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-5 h-5 animate-spin text-[#d4a853]" />
                      </div>
                    ) : loanDetail && loanDetail.loan._id === loan._id ? (
                      <>
                        {/* Summary Bars */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                          {[
                            { label: 'Total Paid', value: loanDetail.summary.totalPaid, color: 'text-emerald-400' },
                            { label: 'Principal Paid', value: loanDetail.summary.principalPaid, color: 'text-blue-400' },
                            { label: 'Interest Paid', value: loanDetail.summary.interestPaid, color: 'text-orange-400' },
                            { label: 'Remaining', value: loanDetail.summary.remainingBalance, color: 'text-red-400' },
                          ].map(item => (
                            <div key={item.label} className="bg-card border border-border rounded-xl p-3">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                              <p className={`text-sm font-bold mt-1 ${item.color}`}>{formatINR(item.value)}</p>
                            </div>
                          ))}
                        </div>

                        {/* Progress bar */}
                        {(() => {
                          const pct = loanDetail.summary.principal > 0
                            ? Math.min(100, (loanDetail.summary.principalPaid / loanDetail.summary.principal) * 100)
                            : 0;
                          return (
                            <div className="mb-4">
                              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                                <span>Repayment Progress</span>
                                <span>{pct.toFixed(1)}%</span>
                              </div>
                              <div className="h-2 bg-border rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#d4a853,#f0c87a)' }}
                                />
                              </div>
                            </div>
                          );
                        })()}

                        {/* Repayments Table */}
                        {loanDetail.repayments.length > 0 && (
                          <div className="mb-4">
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Repayment History ({loanDetail.repayments.length})</p>
                            <div className="overflow-x-auto rounded-xl border border-border">
                              <table className="w-full text-xs">
                                <thead className="bg-secondary text-muted-foreground uppercase text-[10px] tracking-wider">
                                  <tr>
                                    <th className="text-left px-3 py-2.5">Date</th>
                                    <th className="text-right px-3 py-2.5">Principal</th>
                                    <th className="text-right px-3 py-2.5">Interest</th>
                                    <th className="text-right px-3 py-2.5">Total</th>
                                    <th className="text-left px-3 py-2.5">Notes</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                  {loanDetail.repayments.map(r => (
                                    <tr key={r._id} className="hover:bg-secondary/40 transition-colors">
                                      <td className="px-3 py-2 text-muted-foreground">
                                        {new Date(r.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                      </td>
                                      <td className="px-3 py-2 text-right text-blue-400 font-mono">{formatINR(r.principal_paid)}</td>
                                      <td className="px-3 py-2 text-right text-orange-400 font-mono">{formatINR(r.interest_paid)}</td>
                                      <td className="px-3 py-2 text-right font-bold text-foreground font-mono">{formatINR(r.total_paid)}</td>
                                      <td className="px-3 py-2 text-muted-foreground">{r.notes ?? '—'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        {isAdmin && loan.status === 'active' && (
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => { setRepaymentLoanId(loan._id); setShowRepaymentModal(true); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                              style={{ background: '#d4a853', color: '#1a1713' }}
                            >
                              <ArrowDownLeft className="w-3.5 h-3.5" /> Record Repayment
                            </button>
                            <button
                              onClick={() => handleCloseLoan(loan._id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Closed
                            </button>
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── LENDERS TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'lenders' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lenders.length === 0 ? (
            <div className="md:col-span-3 bg-card border border-border rounded-2xl p-12 text-center">
              <Building2 className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No lenders yet</p>
              {isAdmin && <p className="text-[11px] text-muted-foreground/60 mt-1">Add lenders first, then record loans against them.</p>}
            </div>
          ) : lenders.map(lender => {
            const LIcon = lenderIcon(lender.type);
            const badge = lenderBadge(lender.type);
            const lenderLoans = loans.filter(l =>
              typeof l.lender_id === 'object' && (l.lender_id as Lender)._id === lender._id
            );
            const total = lenderLoans.reduce((s, l) => s + l.principal, 0);
            return (
              <div key={lender._id} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(212,168,83,0.12)' }}>
                    <LIcon className="w-5 h-5 text-[#d4a853]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{lender.name}</p>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                </div>
                <div className="space-y-1 text-[11px] text-muted-foreground">
                  {lender.contact_name && <p>👤 {lender.contact_name}</p>}
                  {lender.contact_phone && <p>📞 {lender.contact_phone}</p>}
                  {lender.notes && <p className="text-[10px] italic">"{lender.notes}"</p>}
                </div>
                {lenderLoans.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border text-[11px]">
                    <div className="flex justify-between text-muted-foreground">
                      <span>{lenderLoans.length} loan{lenderLoans.length !== 1 ? 's' : ''}</span>
                      <span className="font-bold text-foreground">{formatINR(total)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL: Add Lender ────────────────────────────────────────────────── */}
      {showLenderModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-foreground">Add New Lender</h3>
              <button onClick={() => setShowLenderModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Lender Name *</label>
                <input
                  value={lenderForm.name}
                  onChange={e => setLenderForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. HDFC Bank, Mr. Sharma..."
                  className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[#d4a853]/50"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Lender Type *</label>
                <select
                  value={lenderForm.type}
                  onChange={e => setLenderForm(p => ({ ...p, type: e.target.value as any }))}
                  className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[#d4a853]/50"
                >
                  <option value="bank">Bank</option>
                  <option value="private">Private</option>
                  <option value="owner">Owner</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Contact Name</label>
                  <input
                    value={lenderForm.contact_name}
                    onChange={e => setLenderForm(p => ({ ...p, contact_name: e.target.value }))}
                    placeholder="Contact person"
                    className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[#d4a853]/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Contact Phone</label>
                  <input
                    value={lenderForm.contact_phone}
                    onChange={e => setLenderForm(p => ({ ...p, contact_phone: e.target.value }))}
                    placeholder="Phone number"
                    className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[#d4a853]/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Notes</label>
                <textarea
                  value={lenderForm.notes}
                  onChange={e => setLenderForm(p => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  placeholder="Optional notes..."
                  className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[#d4a853]/50 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowLenderModal(false)} className="flex-1 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
              <button
                onClick={handleCreateLender}
                disabled={savingLender}
                className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: '#d4a853', color: '#1a1713' }}
              >
                {savingLender ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Lender
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: New Loan ───────────────────────────────────────────────────── */}
      {showLoanModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-foreground">Record New Loan</h3>
              <button onClick={() => setShowLoanModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 text-[11px] text-blue-400/80 mb-4">
              This will automatically create a double-entry ledger posting: <strong>Debit</strong> the destination cash/bank account and <strong>Credit</strong> Loans Payable (2011).
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Lender *</label>
                <select
                  value={loanForm.lender_id}
                  onChange={e => setLoanForm(p => ({ ...p, lender_id: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[#d4a853]/50"
                >
                  <option value="">Select lender...</option>
                  {lenders.map(l => <option key={l._id} value={l._id}>{l.name} ({l.type})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Principal Amount (₹) *</label>
                  <input
                    type="number"
                    value={loanForm.principal}
                    onChange={e => setLoanForm(p => ({ ...p, principal: e.target.value }))}
                    placeholder="e.g. 500000"
                    min="1"
                    className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[#d4a853]/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Annual Interest Rate (%) *</label>
                  <input
                    type="number"
                    value={loanForm.interest_rate}
                    onChange={e => setLoanForm(p => ({ ...p, interest_rate: e.target.value }))}
                    placeholder="e.g. 12.5"
                    min="0"
                    step="0.1"
                    className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[#d4a853]/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Term (Months) *</label>
                  <input
                    type="number"
                    value={loanForm.term_months}
                    onChange={e => setLoanForm(p => ({ ...p, term_months: e.target.value }))}
                    placeholder="e.g. 24"
                    min="1"
                    className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[#d4a853]/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Disbursement Date *</label>
                  <input
                    type="date"
                    value={loanForm.disbursed_at}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={e => setLoanForm(p => ({ ...p, disbursed_at: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[#d4a853]/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Credited To Account *</label>
                <select
                  value={loanForm.account_id}
                  onChange={e => setLoanForm(p => ({ ...p, account_id: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[#d4a853]/50"
                >
                  <option value="">Select account where loan was received...</option>
                  {accounts.filter(a => a.code < 2000).map(a => <option key={a._id} value={a._id}>{a.code} — {a.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Notes</label>
                <textarea
                  value={loanForm.notes}
                  onChange={e => setLoanForm(p => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  placeholder="Loan purpose, agreement reference, etc."
                  className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[#d4a853]/50 resize-none"
                />
              </div>

              {/* Live EMI estimate */}
              {loanForm.principal && loanForm.interest_rate && loanForm.term_months && (
                <div className="p-3 rounded-xl bg-[#d4a853]/5 border border-[#d4a853]/20 text-[11px]">
                  <p className="text-[#d4a853] font-semibold mb-1">Estimated Monthly EMI</p>
                  {(() => {
                    const P = Number(loanForm.principal);
                    const r = Number(loanForm.interest_rate) / 100 / 12;
                    const n = Number(loanForm.term_months);
                    const emi = r > 0
                      ? (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
                      : P / n;
                    const totalPay = emi * n;
                    const totalInterest = totalPay - P;
                    return (
                      <div className="flex gap-6 text-muted-foreground">
                        <div><span className="text-foreground font-bold">{formatINR(emi)}</span>/month</div>
                        <div>Total Interest: <span className="text-orange-400 font-bold">{formatINR(totalInterest)}</span></div>
                        <div>Total: <span className="text-foreground font-bold">{formatINR(totalPay)}</span></div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowLoanModal(false)} className="flex-1 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
              <button
                onClick={handleCreateLoan}
                disabled={savingLoan}
                className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: '#d4a853', color: '#1a1713' }}
              >
                {savingLoan ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                Record Loan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Record Repayment ────────────────────────────────────────────── */}
      {showRepaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-foreground">Record Repayment</h3>
              <button onClick={() => setShowRepaymentModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 text-[11px] text-blue-400/80 mb-4">
              Ledger: <strong>Debit</strong> Loans Payable (principal) + Interest Expense (interest). <strong>Credit</strong> the source cash/bank account.
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Payment Date *</label>
                <input
                  type="date"
                  value={repaymentForm.payment_date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => setRepaymentForm(p => ({ ...p, payment_date: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[#d4a853]/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Principal Paid (₹)</label>
                  <input
                    type="number"
                    value={repaymentForm.principal_paid}
                    onChange={e => setRepaymentForm(p => ({ ...p, principal_paid: e.target.value }))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[#d4a853]/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Interest Paid (₹)</label>
                  <input
                    type="number"
                    value={repaymentForm.interest_paid}
                    onChange={e => setRepaymentForm(p => ({ ...p, interest_paid: e.target.value }))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[#d4a853]/50"
                  />
                </div>
              </div>

              {repaymentForm.principal_paid && repaymentForm.interest_paid && (
                <div className="px-3 py-2 bg-[#d4a853]/5 border border-[#d4a853]/20 rounded-xl text-[11px] flex justify-between">
                  <span className="text-muted-foreground">Total Payment</span>
                  <span className="font-bold text-[#d4a853]">
                    {formatINR((Number(repaymentForm.principal_paid) || 0) + (Number(repaymentForm.interest_paid) || 0))}
                  </span>
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Paid From Account *</label>
                <select
                  value={repaymentForm.account_id}
                  onChange={e => setRepaymentForm(p => ({ ...p, account_id: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[#d4a853]/50"
                >
                  <option value="">Select source account...</option>
                  {accounts.filter(a => a.code < 2000).map(a => <option key={a._id} value={a._id}>{a.code} — {a.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Notes</label>
                <input
                  value={repaymentForm.notes}
                  onChange={e => setRepaymentForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Optional reference or note..."
                  className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[#d4a853]/50"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowRepaymentModal(false)} className="flex-1 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
              <button
                onClick={handleCreateRepayment}
                disabled={savingRepayment}
                className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: '#d4a853', color: '#1a1713' }}
              >
                {savingRepayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDownLeft className="w-4 h-4" />}
                Post Repayment
              </button>
            </div>
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
                className="flex-1 py-2 rounded-xl text-xs font-bold transition-all bg-[#d4a853] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
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
