'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FinanceLayout } from '@/components/finance/FinanceLayout';
import { EmptyState } from '@/components/finance/EmptyState';
import { LoadingState } from '@/components/finance/LoadingState';
import { ErrorState } from '@/components/finance/ErrorState';
import { api } from '@/lib/api';
import { formatINR } from '@/utils/finance';
import {
  ChevronDown, ChevronRight, RefreshCw, Search,
  TrendingUp, TrendingDown, Landmark, Receipt, Wallet, ArrowRight
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

interface SummaryData {
  asset: { total: number; count: number };
  liability: { total: number; count: number };
  equity: { total: number; count: number };
  revenue: { total: number; count: number };
  expense: { total: number; count: number };
}

export default function AccountsListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accountsGrouped, setAccountsGrouped] = useState<Record<string, AccountItem[]>>({});
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [search, setSearch] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    asset: false,
    liability: false,
    equity: false,
    revenue: false,
    expense: false,
  });

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const [accountsRes, summaryRes]: any[] = await Promise.all([
        api.get('/finance/accounts'),
        api.get('/finance/accounts/summary'),
      ]);
      if (accountsRes?.success) {
        setAccountsGrouped(accountsRes.data || {});
      }
      if (summaryRes?.success) {
        setSummary(summaryRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch Chart of Accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const toggleSection = (type: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  // Filter accounts based on search query
  const getFilteredGroupedAccounts = () => {
    if (!search.trim()) return accountsGrouped;
    const query = search.toLowerCase();
    const filtered: Record<string, AccountItem[]> = {};

    Object.keys(accountsGrouped).forEach((type) => {
      filtered[type] = accountsGrouped[type].filter(
        (acc) =>
          acc.name.toLowerCase().includes(query) ||
          acc.code.toString().includes(query) ||
          acc.normal_balance.toLowerCase().includes(query)
      );
    });

    return filtered;
  };

  const filteredAccounts = getFilteredGroupedAccounts();
  const hasAccounts = Object.values(filteredAccounts).some((group) => group.length > 0);

  return (
    <FinanceLayout
      title="Chart of Accounts"
      description="List of official accounting head ledgers, normal balance definitions, and live aggregated balances."
    >
      {/* Priority Bento Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6 items-stretch">
          {/* Priority 1: Hero / Big Card (Total Assets) */}
          <div
            onClick={() => {
              setCollapsedSections((prev) => ({ ...prev, asset: false }));
              document.getElementById('section-asset')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="lg:col-span-5 rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/[0.08] p-5 sm:p-6 shadow-sm flex flex-col justify-between cursor-pointer hover:border-primary/60 transition-all group relative overflow-hidden"
            title="Click to jump to Asset ledgers"
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
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Total Assets
                    </span>
                    <p className="text-[11px] text-muted-foreground">Enterprise Resources & Cash</p>
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
                  Primary Metric · {summary.asset.count} Accounts
                </span>
              </div>

              {/* Giant Hero Number */}
              <div className="my-3">
                <h2 className="text-3xl sm:text-4xl xl:text-[38px] font-extrabold tracking-tight text-foreground leading-none font-mono">
                  {formatINR(summary.asset.total)}
                </h2>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Consolidated balance of active bank accounts, counter registers, petty cash, inventory, and trade receivables.
              </p>
            </div>

            {/* Sub-breakdown: Total Equity vs Total Liabilities */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/70 mt-2">
              <div className="bg-background/60 border border-border/60 rounded-lg p-2.5">
                <div className="flex items-center justify-between gap-1 text-[10px] font-semibold text-purple-400 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span>Total Equity</span>
                  </div>
                  <span className="text-[9px] font-mono opacity-80">
                    {summary.equity.count} accs
                  </span>
                </div>
                <p className="text-sm font-bold text-foreground mt-0.5 font-mono">
                  {formatINR(summary.equity.total)}
                </p>
              </div>

              <div className="bg-background/60 border border-border/60 rounded-lg p-2.5">
                <div className="flex items-center justify-between gap-1 text-[10px] font-semibold text-red-400 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    <span>Total Liabilities</span>
                  </div>
                  <span className="text-[9px] font-mono opacity-80">
                    {summary.liability.count} accs
                  </span>
                </div>
                <p className="text-sm font-bold text-foreground mt-0.5 font-mono">
                  {formatINR(summary.liability.total)}
                </p>
              </div>
            </div>
          </div>

          {/* Priority 2, 3, 4, 5: 4 Secondary Cards in 2x2 Grid (lg:col-span-7) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-stretch">
            {/* Card 1: Total Liabilities */}
            <div
              onClick={() => {
                setCollapsedSections((prev) => ({ ...prev, liability: false }));
                document.getElementById('section-liability')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] hover:border-red-500/40 group"
              title="Click to view liability ledgers"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Total Liabilities</span>
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-red-400 font-mono mt-2.5">
                  {formatINR(summary.liability.total)}
                </p>
              </div>
              <div className="pt-2.5 border-t border-border/60 mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{summary.liability.count} accounts · Loans & payables</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-red-400" />
              </div>
            </div>

            {/* Card 2: Total Equity */}
            <div
              onClick={() => {
                setCollapsedSections((prev) => ({ ...prev, equity: false }));
                document.getElementById('section-equity')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] hover:border-purple-500/40 group"
              title="Click to view equity ledgers"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Total Equity</span>
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                    <Landmark className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-purple-400 font-mono mt-2.5">
                  {formatINR(summary.equity.total)}
                </p>
              </div>
              <div className="pt-2.5 border-t border-border/60 mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{summary.equity.count} accounts · Capital & reserves</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-purple-400" />
              </div>
            </div>

            {/* Card 3: Total Revenue */}
            <div
              onClick={() => {
                setCollapsedSections((prev) => ({ ...prev, revenue: false }));
                document.getElementById('section-revenue')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] hover:border-emerald-500/40 group"
              title="Click to view revenue ledgers"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Total Revenue</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-emerald-400 font-mono mt-2.5">
                  {formatINR(summary.revenue.total)}
                </p>
              </div>
              <div className="pt-2.5 border-t border-border/60 mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{summary.revenue.count} accounts · Sales & earnings</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400" />
              </div>
            </div>

            {/* Card 4: Total Expenses */}
            <div
              onClick={() => {
                setCollapsedSections((prev) => ({ ...prev, expense: false }));
                document.getElementById('section-expense')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] hover:border-orange-500/40 group"
              title="Click to view expense ledgers"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider">Total Expenses</span>
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                    <Receipt className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-orange-400 font-mono mt-2.5">
                  {formatINR(summary.expense.total)}
                </p>
              </div>
              <div className="pt-2.5 border-t border-border/60 mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{summary.expense.count} accounts · Operating costs</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-orange-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        {/* Search bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search account name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-secondary border border-border rounded-xl pl-9 pr-4 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-[#d4a853]"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAccounts}
            className="p-2 bg-secondary border border-border rounded-xl text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Refresh Account Balances"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Balances</span>
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadAccounts} />
      ) : !hasAccounts ? (
        <EmptyState
          title="No accounts found"
          description={search ? "No accounts matched your search criteria." : "Chart of Accounts is empty."}
        />
      ) : (
        <div className="space-y-4">
          {(['asset', 'liability', 'equity', 'revenue', 'expense'] as const).map((type) => {
            const items = filteredAccounts[type] || [];
            if (items.length === 0) return null;

            const isCollapsed = collapsedSections[type];
            const displayTypeName = type.toUpperCase() + 'S';
            const groupSum = items.reduce((sum, item) => sum + item.current_balance, 0);

            return (
              <div key={type} id={`section-${type}`} className="border border-border rounded-2xl overflow-hidden bg-card/20 scroll-mt-6">
                {/* Header */}
                <button
                  onClick={() => toggleSection(type)}
                  className="w-full flex items-center justify-between px-5 py-4 bg-secondary hover:bg-secondary/80 transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-1.5 h-4 bg-[#d4a853] rounded" />
                    <h4 className="text-xs font-bold tracking-wider text-foreground">
                      {displayTypeName} ({items.length} accounts)
                    </h4>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold text-foreground pr-2">
                    <span className="text-muted-foreground font-normal text-[10px] uppercase">Aggregate Balance:</span>
                    <span>{formatINR(groupSum)}</span>
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-muted-foreground ml-1" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />
                    )}
                  </div>
                </button>

                {/* Account list table */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-secondary/50 border-b border-border text-muted-foreground uppercase text-[9px] tracking-wider">
                        <tr>
                          <th className="text-left px-5 py-3 font-semibold">Code</th>
                          <th className="text-left px-5 py-3 font-semibold">Account Name</th>
                          <th className="text-left px-5 py-3 font-semibold">Normal Balance</th>
                          <th className="text-right px-5 py-3 font-semibold">Opening Balance</th>
                          <th className="text-right px-5 py-3 font-semibold">Current Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-foreground/90">
                        {items.map((account) => (
                          <tr
                            key={account._id}
                            onClick={() => router.push(`/finance/accounts/${account._id}`)}
                            className="hover:bg-secondary/50 transition-colors cursor-pointer group"
                          >
                            <td className="px-5 py-3 font-mono text-muted-foreground">
                              {account.code}
                            </td>
                            <td className="px-5 py-3 font-medium">
                              <span className="group-hover:text-[#d4a853] transition-colors">
                                {account.name}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-muted-foreground capitalize">
                              {account.normal_balance}
                            </td>
                            <td className="px-5 py-3 text-right font-mono text-muted-foreground">
                              {formatINR(account.opening_balance)}
                            </td>
                            <td className="px-5 py-3 text-right font-bold text-foreground">
                              {formatINR(account.current_balance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </FinanceLayout>
  );
}
