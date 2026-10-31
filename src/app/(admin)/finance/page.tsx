'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { FinanceLayout } from '@/components/finance/FinanceLayout';
import { LoadingState } from '@/components/finance/LoadingState';
import { ErrorState } from '@/components/finance/ErrorState';
import { api } from '@/lib/api';
import { formatINR } from '@/utils/finance';
import { useTheme } from 'next-themes';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Settings,
  HelpCircle,
  DollarSign,
  CreditCard,
  Building2,
  RefreshCw,
  Info,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';

interface AccountItem {
  _id: string;
  code: number;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  normal_balance: 'debit' | 'credit';
  opening_balance: number;
  current_balance: number;
  is_active: boolean;
}

interface LoanSummary {
  activeCount: number;
  totalOutstanding: number;
  activeLoans: Array<{
    _id: string;
    lender: string;
    lenderType: string;
    principal: number;
    interest_rate: number;
    term_months: number;
    disbursed_at: string;
    status: string;
  }>;
}

interface LoanAlert {
  loanId: string;
  lenderName: string;
  type: 'danger' | 'warning';
  message: string;
}


export default function FinanceDashboardPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = !mounted || resolvedTheme === 'dark';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accountsGrouped, setAccountsGrouped] = useState<Record<string, AccountItem[]>>({});
  const [kpis, setKpis] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [loanAlerts, setLoanAlerts] = useState<LoanAlert[]>([]);
  const [balanceSheet, setBalanceSheet] = useState<any>(null);
  const [loanSummary, setLoanSummary] = useState<LoanSummary | null>(null);
  const [period, setPeriod] = useState<string>('this_month');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [alertsExpanded, setAlertsExpanded] = useState(false);
  const [alertsDismissed, setAlertsDismissed] = useState(false);

  const [accountsLoaded, setAccountsLoaded] = useState(false);

  const loadData = async (showLoading = true, forceReloadAccounts = false, signal?: AbortSignal) => {
    try {
      if (showLoading) setLoading(true);
      else setIsRefreshing(true);
      setError(null);

      const fetchPromises: Promise<any>[] = [];
      const fetchAccounts = !accountsLoaded || forceReloadAccounts;

      if (fetchAccounts) {
        fetchPromises.push(api.get('/finance/accounts', { signal }));
      } else {
        fetchPromises.push(Promise.resolve(null));
      }

      fetchPromises.push(api.get(`/finance/dashboard/summary?period=${period}`, { signal }));

      const [accountsRes, dashRes] = await Promise.all(fetchPromises);

      if (accountsRes?.success) {
        setAccountsGrouped(accountsRes.data || {});
        setAccountsLoaded(true);
      }
      if (dashRes?.success) {
        setKpis(dashRes.data?.kpis ?? null);
        setCharts(dashRes.data?.charts ?? null);
        setLoanAlerts(dashRes.data?.loanAlerts ?? []);
        setBalanceSheet(dashRes.data?.balanceSheet ?? null);
        setLoanSummary(dashRes.data?.loans ?? null);
      }
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err: any) {
      if (axios.isCancel(err) || signal?.aborted) {
        return;
      }
      setError(err.message || 'Failed to retrieve real-time financial summary.');
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadData(true, false, controller.signal);
    return () => {
      controller.abort();
    };
  }, [period]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadData(false);
    }, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [period]);

  if (loading) return <FinanceLayout title="Finance Dashboard"><LoadingState /></FinanceLayout>;
  if (error) return <FinanceLayout title="Finance Dashboard"><ErrorState message={error} onRetry={() => loadData(true, true)} /></FinanceLayout>;

  // Find all accounts with active/non-zero balances for overview list
  const activeAccounts: AccountItem[] = [];
  Object.values(accountsGrouped).forEach((group) => {
    group.forEach((acc) => {
      if (acc.current_balance > 0 || acc.opening_balance > 0) {
        activeAccounts.push(acc);
      }
    });
  });
  activeAccounts.sort((a, b) => b.current_balance - a.current_balance);

  // Period label translator
  const periodLabels: Record<string, string> = {
    this_month: 'This Month',
    last_month: 'Last Month',
    this_quarter: 'This Quarter',
    this_year: 'This Year'
  };

  // Pie chart colors
  const PIE_COLORS = ['#d4a853', '#60a5fa', '#34d399'];

  const activeIndex = ['this_month', 'last_month', 'this_quarter', 'this_year'].indexOf(period);

  return (
    <FinanceLayout
      title="Finance Overview"
      description="Real-time financial status, liquidity tracking, and ledger balancing metrics."
    >
      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 p-3 px-4 bg-card/75 backdrop-blur-md border border-border rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 w-full md:w-fit">
          <div className="relative flex p-1 bg-secondary dark:bg-[#1e1b16] rounded-xl border border-border/40 w-full md:w-[450px]">
            {/* Sliding sideways background pill */}
            <div
              className={`absolute top-1 bottom-1 transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) border rounded-lg shadow-sm ${isDark
                  ? 'bg-[#221f19]/90 border-[#d4a853]/20 shadow-[0_0_12px_rgba(212,168,83,0.06)]'
                  : 'bg-white border-zinc-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                }`}
              style={{
                left: `calc(4px + ${activeIndex * 25}%)`,
                width: 'calc(25% - 8px)',
              }}
            />
            {/* Period buttons */}
            {['this_month', 'last_month', 'this_quarter', 'this_year'].map((p) => {
              const isActive = period === p;
              return (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`flex-1 py-1.5 text-center text-xs font-bold z-10 transition-colors duration-300 rounded-lg cursor-pointer ${isActive
                      ? (isDark ? 'text-[#ffffff]' : 'text-[#000000]')
                      : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {periodLabels[p]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-3.5">
          {lastUpdated && (
            <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5 bg-secondary/40 px-2.5 py-1 rounded-lg">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Auto-refreshes every 15m · Updated: {lastUpdated}
            </span>
          )}
          <button
            onClick={() => loadData(false, true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-secondary text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#d4a853]' : 'text-muted-foreground'}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Compact, Collapsible & Dismissible Loan Alerts Bar */}
      {loanAlerts.length > 0 && !alertsDismissed && (() => {
        const dangerCount = loanAlerts.filter((a) => a.type === 'danger').length;
        const warningCount = loanAlerts.length - dangerCount;
        const hasDanger = dangerCount > 0;

        return (
          <div
            className={`mb-5 rounded-xl border transition-all overflow-hidden ${
              hasDanger
                ? 'bg-red-500/5 border-red-500/20 text-red-400'
                : 'bg-amber-500/5 border-amber-500/20 text-amber-400'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
              <button
                type="button"
                onClick={() => setAlertsExpanded(!alertsExpanded)}
                className="flex items-center gap-2.5 text-left cursor-pointer group"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="text-xs font-semibold text-foreground">
                  {loanAlerts.length === 1
                    ? loanAlerts[0].message
                    : `${loanAlerts.length} Loan & EMI Alerts (${
                        dangerCount > 0 ? `${dangerCount} overdue` : ''
                      }${dangerCount > 0 && warningCount > 0 ? ', ' : ''}${
                        warningCount > 0 ? `${warningCount} upcoming` : ''
                      })`}
                </span>
                {loanAlerts.length > 1 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground group-hover:text-foreground">
                    {alertsExpanded ? (
                      <>
                        Hide details <ChevronUp className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        Show details <ChevronDown className="w-3.5 h-3.5" />
                      </>
                    )}
                  </span>
                )}
              </button>

              <div className="flex items-center gap-3 ml-auto">
                <Link
                  href="/finance/liabilities"
                  className="text-xs font-bold flex items-center gap-1 hover:underline shrink-0"
                >
                  Manage Loans <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => setAlertsDismissed(true)}
                  title="Dismiss alerts"
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {alertsExpanded && loanAlerts.length > 1 && (
              <div className="border-t border-border/50 px-4 py-2.5 space-y-1.5 max-h-40 overflow-y-auto bg-card/50">
                {loanAlerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 text-xs py-1 border-b border-border/30 last:border-0"
                  >
                    <span
                      className={`truncate ${
                        alert.type === 'danger' ? 'text-red-400' : 'text-amber-400'
                      }`}
                    >
                      • {alert.message}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                      {alert.lenderName}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* 8 KPI Cards Slidable Section with Priority-Based Bento Layout */}
      <div className="mb-6 p-4 bg-card/40 border border-border/40 rounded-2xl backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 mb-4 px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/90">
              Key Performance Indicators
            </h2>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary border border-border text-foreground/80">
              {currentSlide === 0 ? 'Operating Performance' : 'Liquidity & Balances'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground">
              {currentSlide + 1} / 2
            </span>
            <button
              onClick={() => setCurrentSlide(0)}
              disabled={currentSlide === 0}
              className="p-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer active:scale-95 disabled:opacity-30 shadow-sm"
              title="Operating Performance"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentSlide(1)}
              disabled={currentSlide === 1}
              className="p-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer active:scale-95 disabled:opacity-30 shadow-sm"
              title="Liquidity & Balances"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Slidable Container without scrollbar */}
        <div className="relative overflow-hidden w-full">
          <div
            className="flex transition-transform duration-500 ease-in-out items-stretch"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {/* Page 1 (Operating Performance) */}
            <div className="w-full flex-shrink-0 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch pr-1">
              {/* Priority 1: Hero / Big Card (Total Revenue) */}
              <Link
                href="/finance/revenue"
                className="lg:col-span-5 rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/[0.08] p-5 sm:p-6 shadow-sm flex flex-col justify-between cursor-pointer hover:border-primary/60 transition-all group relative overflow-hidden"
                title="Click to view detailed revenue entries"
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
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Total Revenue
                        </span>
                        <p className="text-[11px] text-muted-foreground">Primary Sales & Inflows</p>
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
                      Top Metric · {periodLabels[period]}
                    </span>
                  </div>

                  {/* Giant Hero Number */}
                  <div className="my-3">
                    <h2 className="text-3xl sm:text-4xl xl:text-[40px] font-extrabold tracking-tight text-foreground leading-none font-mono">
                      {formatINR(kpis?.totalRevenue ?? 0)}
                    </h2>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Aggregated revenue recorded across cafe orders, online sales, and manual inflows in {periodLabels[period]}
                  </p>
                </div>

                {/* Sub-breakdown: Gross Profit vs Net Profit pills */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/70 mt-2">
                  <div className="bg-background/60 border border-border/60 rounded-lg p-2.5">
                    <div className="flex items-center justify-between gap-1 text-[10px] font-semibold text-emerald-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Gross Profit</span>
                      </div>
                      {kpis?.totalRevenue ? (
                        <span className="text-[9px] font-mono opacity-80">
                          {((kpis.grossProfit / kpis.totalRevenue) * 100).toFixed(0)}%
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm font-bold text-foreground mt-0.5 font-mono">
                      {formatINR(kpis?.grossProfit ?? 0)}
                    </p>
                  </div>

                  <div className="bg-background/60 border border-border/60 rounded-lg p-2.5">
                    <div className="flex items-center justify-between gap-1 text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: (kpis?.netProfit ?? 0) >= 0 ? '#10b981' : '#ef4444' }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: (kpis?.netProfit ?? 0) >= 0 ? '#10b981' : '#ef4444' }} />
                        <span>Net Profit</span>
                      </div>
                      {kpis?.totalRevenue ? (
                        <span className="text-[9px] font-mono opacity-80">
                          {((kpis.netProfit / kpis.totalRevenue) * 100).toFixed(0)}%
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm font-bold mt-0.5 font-mono"
                      style={{ color: (kpis?.netProfit ?? 0) >= 0 ? '#10b981' : '#ef4444' }}
                    >
                      {formatINR(kpis?.netProfit ?? 0)}
                    </p>
                  </div>
                </div>
              </Link>

              {/* Priority 2, 3, 4: Remaining 3 Secondary Cards */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-stretch">
                {/* Card 2: Total Expenses */}
                <Link
                  href="/finance/expenses"
                  className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] hover:border-red-500/40 group"
                  title="Click to view all expenses"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-red-400">Total Expenses</span>
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                        <CreditCard className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-red-400 font-mono mt-3">
                      {formatINR(kpis?.totalExpenses ?? 0)}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-border/60 mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Approved expenditures</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-red-400" />
                  </div>
                </Link>

                {/* Card 3: Gross Profit */}
                <Link
                  href="/finance/profitability"
                  className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] hover:border-emerald-500/40 group"
                  title="Click to view profitability breakdown"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-400">Gross Profit</span>
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono mt-3">
                      {formatINR(kpis?.grossProfit ?? 0)}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-border/60 mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>After COGS & fulfillment</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400" />
                  </div>
                </Link>

                {/* Card 4: Net Profit */}
                <Link
                  href="/finance/profitability"
                  className={`rounded-2xl border p-4 sm:p-5 shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] group ${
                    (kpis?.netProfit ?? 0) >= 0
                      ? 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50'
                      : 'border-red-500/30 bg-red-500/5 hover:border-red-500/50'
                  }`}
                  title="Click to view profitability details"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${(kpis?.netProfit ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        Net Profit
                      </span>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        (kpis?.netProfit ?? 0) >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        <TrendingUp className="w-4 h-4" />
                      </div>
                    </div>
                    <p className={`text-2xl sm:text-3xl font-bold font-mono mt-3 ${
                      (kpis?.netProfit ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {formatINR(kpis?.netProfit ?? 0)}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-border/60 mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Bottom-line margin</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400" />
                  </div>
                </Link>
              </div>
            </div>

            {/* Page 2 (Liquidity & Balances) */}
            <div className="w-full flex-shrink-0 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch pl-1">
              {/* Priority 1: Hero / Big Card (Cash Position) */}
              <Link
                href="/finance/accounts"
                className="lg:col-span-5 rounded-2xl border border-[#d4a853]/30 bg-gradient-to-br from-card via-card to-[#d4a853]/[0.08] p-5 sm:p-6 shadow-sm flex flex-col justify-between cursor-pointer hover:border-[#d4a853]/60 transition-all group relative overflow-hidden"
                title="Click to view all bank and cash accounts"
              >
                {/* Subtle background ambient glow */}
                <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-[#d4a853]/10 blur-2xl pointer-events-none group-hover:bg-[#d4a853]/20 transition-all" />

                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs shrink-0"
                        style={{ background: 'rgba(212, 168, 83, 0.18)', color: '#d4a853' }}
                      >
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Cash Position
                        </span>
                        <p className="text-[11px] text-muted-foreground">Liquid Capital Available</p>
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
                      Instant Funds
                    </span>
                  </div>

                  {/* Giant Hero Number */}
                  <div className="my-3">
                    <h2 className="text-3xl sm:text-4xl xl:text-[40px] font-extrabold tracking-tight text-[#d4a853] font-mono leading-none">
                      {formatINR(kpis?.cashPosition ?? 0)}
                    </h2>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Total accessible liquid funds across active bank accounts, counter cash tills, and petty cash reserves
                  </p>
                </div>

                {/* Sub-breakdown: AR vs AP pills */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/70 mt-2">
                  <div className="bg-background/60 border border-border/60 rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-blue-400 uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      <span>Receivables (AR)</span>
                    </div>
                    <p className="text-sm font-bold text-foreground mt-0.5 font-mono">
                      {formatINR(kpis?.accountsReceivable ?? 0)}
                    </p>
                  </div>
                  <div className="bg-background/60 border border-border/60 rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-red-400 uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      <span>Payables (AP)</span>
                    </div>
                    <p className="text-sm font-bold text-foreground mt-0.5 font-mono">
                      {formatINR(kpis?.accountsPayable ?? 0)}
                    </p>
                  </div>
                </div>
              </Link>

              {/* Priority 2, 3, 4: Remaining 3 Secondary Cards */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-stretch">
                {/* Card 2: Outstanding Loans */}
                <Link
                  href="/finance/liabilities"
                  className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] hover:border-orange-500/40 group"
                  title="Click to view loan liabilities"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-orange-400">Outstanding Loans</span>
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-orange-400 font-mono mt-3">
                      {formatINR(kpis?.outstandingLoans ?? 0)}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-border/60 mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Principal debt balance</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-orange-400" />
                  </div>
                </Link>

                {/* Card 3: Accounts Receivable */}
                <Link
                  href="/finance/reports"
                  className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] hover:border-blue-500/40 group"
                  title="Click to view customer receivables"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-blue-400">Receivables (AR)</span>
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-400 font-mono mt-3">
                      {formatINR(kpis?.accountsReceivable ?? 0)}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-border/60 mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Unpaid invoices owed</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                  </div>
                </Link>

                {/* Card 4: Accounts Payable */}
                <Link
                  href="/finance/expenses"
                  className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] hover:border-red-500/40 group"
                  title="Click to view supplier payables"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-red-400">Payables (AP)</span>
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                        <ArrowDownRight className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-red-400 font-mono mt-3">
                      {formatINR(kpis?.accountsPayable ?? 0)}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-border/60 mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Supplier obligations</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-red-400" />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Width Monthly Profit Trend (Area Chart) */}
      <div className="w-full min-w-0 bg-card border border-border rounded-2xl p-6 mb-6 flex flex-col justify-between shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base font-bold text-foreground mb-0.5">Monthly Profit Trend</h3>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
              6-Month Historical Revenue, Expenses & Net Profit
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#d4a853' }} />
              Revenue
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              Expenses
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Profit
            </span>
          </div>
        </div>

        <div className="h-[300px] w-full min-w-0">
          {mounted && charts?.line && charts.line.length > 0 ? (
            <ResponsiveContainer width="100%" height={290} minWidth={0} debounce={100}>
              <AreaChart data={charts.line} margin={{ top: 10, right: 16, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="finRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4a853" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#d4a853" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="finExpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="finProfGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} vertical={false} />
                <XAxis
                  dataKey="month"
                  interval={0}
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                  dy={6}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    formatINR(Number(value) || 0),
                    String(name).charAt(0).toUpperCase() + String(name).slice(1),
                  ]}
                  contentStyle={{
                    background: 'var(--card)',
                    borderColor: 'var(--border)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#d4a853"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#finRevGrad)"
                  dot={{ r: 3.5, fill: '#d4a853', strokeWidth: 0 }}
                  activeDot={{ r: 5.5 }}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#finExpGrad)"
                  dot={{ r: 3, fill: '#ef4444', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#finProfGrad)"
                  dot={{ r: 3.5, fill: '#10b981', strokeWidth: 0 }}
                  activeDot={{ r: 5.5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground flex-col gap-1.5">
              <Info className="w-4 h-4 text-muted-foreground/60" />
              No historical trend data available.
            </div>
          )}
        </div>
      </div>

      {/* Revenue Source Breakdown & Expense Distribution Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Chart 1: Revenue Source Breakdown (Pie/Donut Chart) */}
        <div className="min-w-0 bg-card border border-border rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-foreground mb-1">Revenue Source Breakdown</h3>
            <p className="text-[10px] text-muted-foreground mb-4 uppercase tracking-wider font-semibold">
              Share for {periodLabels[period]}
            </p>
          </div>
          <div className="h-56 flex items-center justify-center min-w-0">
            {mounted && charts?.pie && charts.pie.some((d: any) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={220} minWidth={0}>
                <PieChart>
                  <Pie
                    data={charts.pie}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {charts.pie.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [formatINR(value), 'Revenue']}
                    contentStyle={{ background: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconSize={8}
                    formatter={(value) => <span className="text-[10px] font-semibold text-muted-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-muted-foreground flex flex-col items-center gap-1.5">
                <Info className="w-4 h-4 text-muted-foreground/60" />
                No revenue records found for this period.
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Expense Category Distribution (Bar Chart) */}
        <div className="min-w-0 bg-card border border-border rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-foreground mb-1">Expense Distribution</h3>
            <p className="text-[10px] text-muted-foreground mb-4 uppercase tracking-wider font-semibold">
              Top Categories for {periodLabels[period]}
            </p>
          </div>
          <div className="h-56 min-w-0">
            {mounted && charts?.bar && charts.bar.length > 0 ? (
              <ResponsiveContainer width="100%" height={220} minWidth={0}>
                <BarChart data={charts.bar} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} vertical={false} />
                  <XAxis dataKey="category" tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                    tickLine={false}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: any) => [formatINR(value), 'Spent']}
                    contentStyle={{ background: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px' }}
                  />
                  <Bar dataKey="amount" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground flex-col gap-1.5">
                <Info className="w-4 h-4 text-muted-foreground/60" />
                No expenses recorded for this period.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Balance Sheet Summary Preview (Full Width) */}
      <div className="mb-6">
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#d4a853]" />
                Balance Sheet Summary Preview
              </h3>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Real-Time Ledger</span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center text-xs py-1.5 border-b border-border">
                <span className="font-semibold text-foreground/80">TOTAL ASSETS (A)</span>
                <span className="font-bold text-foreground">{formatINR(balanceSheet?.totalAssets ?? 0)}</span>
              </div>
              <div className="flex justify-between items-center text-xs py-1.5 border-b border-border">
                <span className="font-semibold text-foreground/80">TOTAL LIABILITIES (B)</span>
                <span className="font-bold text-foreground">{formatINR(balanceSheet?.totalLiabilities ?? 0)}</span>
              </div>
              <div className="flex justify-between items-center text-xs py-1.5 border-b border-border">
                <span className="font-semibold text-foreground/80">OWNER'S EQUITY (C)</span>
                <span className="font-bold text-foreground">{formatINR(balanceSheet?.totalEquity ?? 0)}</span>
              </div>
              <div className="flex justify-between items-center text-xs py-1.5 border-b border-border">
                <span className="font-semibold text-foreground/80">NET CURRENT EARNINGS (D)</span>
                <span className={`font-bold ${(balanceSheet?.netProfit ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatINR(balanceSheet?.netProfit ?? 0)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs py-2.5 bg-secondary px-3 rounded-xl font-bold border border-border/20">
                <span className="text-[#d4a853]">TOTAL LIABILITIES & EQUITY (B + C + D)</span>
                <span className="text-foreground">{formatINR(balanceSheet?.totalLiabilitiesAndEquity ?? 0)}</span>
              </div>
            </div>
          </div>

          <div className={`p-3.5 rounded-xl border text-[11px] leading-relaxed flex items-start gap-2.5 ${balanceSheet?.ledgerBalanced
              ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400/90'
              : 'bg-red-500/5 border-red-500/10 text-red-400/90'
            }`}>
            {balanceSheet?.ledgerBalanced ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>The double-entry ledger is perfectly in balance. Asset accounts exactly match the combined total of liabilities, owner equity and current-year net income.</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Ledger Imbalance Detected:</strong> Assets do not match Liabilities + Equity. Discrepancy is{' '}
                  {formatINR(balanceSheet?.discrepancy ?? 0)}. Please verify ledger postings, opening balances, or audit logs.
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Operations Panel & Active Accounts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Quick Operations Panel */}
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#d4a853]" />
              Quick Operations
            </h3>

            <div className="space-y-3">
              <Link
                href="/finance/revenue"
                className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/50 hover:bg-secondary border border-border transition-all text-xs group cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground group-hover:text-[#d4a853] transition-colors">Record Manual Income</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Capital injection or other misc revenue</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>

              <Link
                href="/finance/expenses"
                className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/50 hover:bg-secondary border border-border transition-all text-xs group cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground group-hover:text-[#d4a853] transition-colors">Submit Expense Claim</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Submit claims with receipt verification</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>

              <Link
                href="/finance/accounts-setup"
                className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/50 hover:bg-secondary border border-border transition-all text-xs group cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground group-hover:text-[#d4a853] transition-colors">Accounts Setup (COA)</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Initialize or check opening balances</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            </div>
          </div>

          <div className="pt-4 border-t border-border/80 text-[10px] text-muted-foreground flex gap-2 items-start mt-4">
            <HelpCircle className="w-3.5 h-3.5 mt-0.5 text-[#d4a853] flex-shrink-0" />
            <span>Double-entry ledger items are generated automatically upon completing cafe sales or online checkouts.</span>
          </div>
        </div>

        {/* Active Accounts Table (Right Column) */}
        <div className="bg-card border border-border rounded-2xl p-6 lg:col-span-2 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#d4a853]" />
                Active Accounts & Real-Time Balances
              </h3>
              <span className="text-[10px] text-muted-foreground font-semibold bg-secondary px-2 py-0.5 rounded">
                {activeAccounts.length} accounts with balances
              </span>
            </div>

            {activeAccounts.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">No accounts have active or opening balances yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-secondary/60 border-b border-border text-muted-foreground uppercase text-[9px] tracking-wider">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-bold">Code</th>
                      <th className="text-left px-4 py-2.5 font-bold">Account Name</th>
                      <th className="text-left px-4 py-2.5 font-bold">Type</th>
                      <th className="text-right px-4 py-2.5 font-bold">Current Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-foreground/90">
                    {activeAccounts.slice(0, 5).map((acc) => (
                      <tr key={acc._id} className="hover:bg-secondary/40 transition-colors">
                        <td className="px-4 py-2 font-mono text-muted-foreground">{acc.code}</td>
                        <td className="px-4 py-2 font-medium">{acc.name}</td>
                        <td className="px-4 py-2">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-secondary text-muted-foreground">
                            {acc.type}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right font-bold text-foreground">{formatINR(acc.current_balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {activeAccounts.length > 5 && (
            <div className="mt-4 flex justify-end">
              <Link
                href="/finance/accounts"
                className="text-xs font-semibold text-[#d4a853] hover:text-[#d4a853]/80 transition-colors flex items-center gap-1 cursor-pointer"
              >
                View All Accounts ({activeAccounts.length}) <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </FinanceLayout>
  );
}
