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
  TrendingUp, TrendingDown, Landmark, Receipt, Wallet
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

const SUMMARY_CARDS = [
  { key: 'asset', label: 'Total Assets', icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { key: 'liability', label: 'Total Liabilities', icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/10' },
  { key: 'equity', label: 'Total Equity', icon: Landmark, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { key: 'revenue', label: 'Total Revenue', icon: Wallet, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { key: 'expense', label: 'Total Expenses', icon: Receipt, color: 'text-orange-400', bg: 'bg-orange-500/10' },
] as const;

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
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {SUMMARY_CARDS.map(({ key, label, icon: Icon, color, bg }) => (
            <div key={key} className="bg-card border border-border rounded-xl p-4 relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-14 h-14 ${bg} rounded-bl-[40px] flex items-end justify-start p-2`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
              <h4 className="text-lg font-bold text-foreground mt-1 font-mono">
                {formatINR(summary[key].total)}
              </h4>
              <p className="text-[9px] text-muted-foreground mt-0.5">
                {summary[key].count} accounts
              </p>
            </div>
          ))}
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
              <div key={type} className="border border-border rounded-2xl overflow-hidden bg-card/20">
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
