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
  LineChart,
  Line,
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
  ChevronRight
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

interface FinanceStatCardProps {
  title: string;
  value: string | React.ReactNode;
  icon: any;
  iconColor?: string;
  description: string;
  isDark?: boolean;
}

function FinanceStatCard({ title, value, icon: Icon, iconColor = '#d4a853', description, isDark }: FinanceStatCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-xl p-4 border border-border bg-gradient-to-br from-card via-card/95 to-card/90 transition-all duration-300 group hover:-translate-y-0.5 flex-1 flex flex-col justify-between ${isDark
        ? 'hover:shadow-[0_8px_25px_rgba(0,0,0,0.4)] shadow-[0_2px_10px_rgba(0,0,0,0.1)]'
        : 'hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] shadow-[0_1px_5px_rgba(0,0,0,0.02)]'
      }`}
      style={{
        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
      }}
    >
      {/* Corner Glow Effect */}
      <div
        className="absolute -right-8 -bottom-8 w-20 h-20 rounded-full blur-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
        style={{ backgroundColor: iconColor }}
      />

      {/* Top Section */}
      <div className="relative z-10 flex items-start justify-between gap-2 mb-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 leading-normal pr-1">{title}</p>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-105 flex-shrink-0"
          style={{
            background: `${iconColor}12`,
            border: `1px solid ${iconColor}20`
          }}
        >
          <Icon className="w-4 h-4" style={{ color: iconColor }} />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="relative z-10 mt-auto">
        <h3 className={`text-base md:text-lg font-bold tracking-tight font-sans ${isDark ? 'text-[#ffffff]' : 'text-[#000000]'
          }`}>
          {value}
        </h3>
        <p className="text-[9px] text-muted-foreground/75 mt-1 leading-normal font-medium">
          {description}
        </p>
      </div>
    </div>
  );
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

      {/* Loan Alerts Section */}
      {loanAlerts.length > 0 && (
        <div className="flex flex-col gap-3 mb-6">
          {loanAlerts.map((alert, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${alert.type === 'danger'
                  ? 'bg-red-500/5 border-red-500/20 text-red-400/90 shadow-[0_0_15px_-3px_rgba(239,68,68,0.05)]'
                  : 'bg-amber-500/5 border-amber-500/20 text-amber-400/90 shadow-[0_0_15px_-3px_rgba(245,158,11,0.05)]'
                }`}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${alert.type === 'danger' ? 'text-red-400' : 'text-amber-400'}`} />
                <span className="text-xs font-medium leading-relaxed">{alert.message}</span>
              </div>
              <Link
                href="/finance/liabilities"
                className={`text-xs font-bold flex items-center gap-1 hover:underline flex-shrink-0 ml-4 ${alert.type === 'danger' ? 'text-red-400' : 'text-amber-400'
                  }`}
              >
                View Loans <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* 8 KPI Cards Slidable Section */}
      <div className="mb-6 p-4 bg-card/40 border border-border/40 rounded-2xl backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 mb-4 px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/90">
            Key Performance Indicators (KPIs)
          </h2>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground">
              {currentSlide + 1} / 2
            </span>
            <button
              onClick={() => setCurrentSlide(0)}
              disabled={currentSlide === 0}
              className="p-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer active:scale-95 disabled:opacity-30 shadow-sm"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentSlide(1)}
              disabled={currentSlide === 1}
              className="p-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer active:scale-95 disabled:opacity-30 shadow-sm"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Slidable Container without scrollbar */}
        <div className="relative overflow-hidden w-full">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {/* Page 1 (First 4 cards) */}
            <div className="w-full flex-shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pr-1">
              <FinanceStatCard
                title={`Total Revenue (${periodLabels[period]})`}
                value={formatINR(kpis?.totalRevenue ?? 0)}
                icon={DollarSign}
                iconColor="#60a5fa"
                description="Total income generated in the selected period."
                isDark={isDark}
              />
              <FinanceStatCard
                title={`Total Expenses (${periodLabels[period]})`}
                value={formatINR(kpis?.totalExpenses ?? 0)}
                icon={CreditCard}
                iconColor="#ef4444"
                description="Total expenditures incurred in the selected period."
                isDark={isDark}
              />
              <FinanceStatCard
                title={`Gross Profit (${periodLabels[period]})`}
                value={formatINR(kpis?.grossProfit ?? 0)}
                icon={TrendingUp}
                iconColor="#34d399"
                description="Earnings after direct production and fulfillment costs."
                isDark={isDark}
              />
              <FinanceStatCard
                title={`Net Profit (${periodLabels[period]})`}
                value={formatINR(kpis?.netProfit ?? 0)}
                icon={TrendingUp}
                iconColor={(kpis?.netProfit ?? 0) >= 0 ? "#10b981" : "#ef4444"}
                description="Bottom-line profit after all operational costs & interest."
                isDark={isDark}
              />
            </div>

            {/* Page 2 (Next 4 cards) */}
            <div className="w-full flex-shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pl-1">
              <FinanceStatCard
                title="Cash Position (Now)"
                value={formatINR(kpis?.cashPosition ?? 0)}
                icon={Wallet}
                iconColor="#d4a853"
                description="Instantly accessible cash and liquid bank balances."
                isDark={isDark}
              />
              <FinanceStatCard
                title="Outstanding Loans"
                value={formatINR(kpis?.outstandingLoans ?? 0)}
                icon={Building2}
                iconColor="#fb923c"
                description="Total active principal liability balance owed to lenders."
                isDark={isDark}
              />
              <FinanceStatCard
                title="Accounts Receivable (AR)"
                value={formatINR(kpis?.accountsReceivable ?? 0)}
                icon={ArrowUpRight}
                iconColor="#60a5fa"
                description="Unpaid customer invoices and export sales outstanding."
                isDark={isDark}
              />
              <FinanceStatCard
                title="Accounts Payable (AP)"
                value={formatINR(kpis?.accountsPayable ?? 0)}
                icon={ArrowDownRight}
                iconColor="#ef4444"
                description="Pending supplier payments and operational claims."
                isDark={isDark}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3 Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Chart 1: Revenue Source Breakdown (Pie/Donut Chart) */}
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-foreground mb-1">Revenue Source Breakdown</h3>
            <p className="text-[10px] text-muted-foreground mb-4 uppercase tracking-wider font-semibold">
              Share for {periodLabels[period]}
            </p>
          </div>
          <div className="h-56 flex items-center justify-center">
            {charts?.pie && charts.pie.some((d: any) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
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

        {/* Chart 2: Monthly Profit Trend (Line Chart) */}
        <div className="bg-card border border-border rounded-2xl p-5 lg:col-span-2 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-foreground mb-1">Monthly Profit Trend</h3>
            <p className="text-[10px] text-muted-foreground mb-4 uppercase tracking-wider font-semibold">
              6-Month Historical Revenue, Expenses & Profit
            </p>
          </div>
          <div className="h-56">
            {charts?.line && charts.line.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.line} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                    tickLine={false}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: any) => [formatINR(value), '']}
                    contentStyle={{ background: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px' }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconSize={8}
                    formatter={(value) => <span className="text-[10px] font-semibold text-muted-foreground capitalize">{value}</span>}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#d4a853" strokeWidth={2.5} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2.5} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground flex flex-col gap-1.5">
                <Info className="w-4 h-4 text-muted-foreground/60" />
                No historical trend data available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart 3 & Balance Sheet Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left: Balance Sheet Preview & Verification */}
        <div className="bg-card border border-border rounded-2xl p-6 lg:col-span-2 flex flex-col justify-between shadow-sm">
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

        {/* Right: Expense Category Distribution (Bar Chart) */}
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-foreground mb-1">Expense Distribution</h3>
            <p className="text-[10px] text-muted-foreground mb-4 uppercase tracking-wider font-semibold">
              Top Categories for {periodLabels[period]}
            </p>
          </div>
          <div className="h-56">
            {charts?.bar && charts.bar.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
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
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground flex flex-col gap-1.5">
                <Info className="w-4 h-4 text-muted-foreground/60" />
                No expenses recorded for this period.
              </div>
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
