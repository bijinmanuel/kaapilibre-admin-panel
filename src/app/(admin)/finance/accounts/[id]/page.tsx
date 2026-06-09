'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FinanceLayout } from '@/components/finance/FinanceLayout';
import { LoadingState } from '@/components/finance/LoadingState';
import { ErrorState } from '@/components/finance/ErrorState';
import { EmptyState } from '@/components/finance/EmptyState';
import { formatINR } from '@/utils/finance';
import { api } from '@/lib/api';
import {
  ArrowLeft, BookOpen, Hash, TrendingUp, TrendingDown,
  ChevronDown, ChevronRight
} from 'lucide-react';

interface AccountDetail {
  _id: string;
  code: number;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  normal_balance: 'debit' | 'credit';
  current_balance: number;
  opening_balance: number;
  is_active: boolean;
  description?: string;
}

interface LedgerLine {
  account_id: { _id: string; code: number; name: string; type: string } | null;
  debit: number;
  credit: number;
  running_balance: number;
}

interface LedgerEntry {
  _id: string;
  transaction_id: string;
  entry_date: string;
  transaction_type: string;
  description: string;
  lines: LedgerLine[];
  created_by?: { name: string };
  createdAt: string;
}

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const accountId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<AccountDetail | null>(null);
  const [recentLedger, setRecentLedger] = useState<LedgerEntry[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const loadAccountDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await api.get(`/finance/accounts/${accountId}`);
      if (res?.success) {
        setAccount(res.data.account);
        setRecentLedger(res.data.recentLedger || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load account details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accountId) loadAccountDetail();
  }, [accountId]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      asset: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      liability: 'bg-red-500/10 text-red-400 border-red-500/20',
      equity: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      revenue: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      expense: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    };
    return colors[type] || 'bg-secondary text-muted-foreground border-border';
  };

  if (loading) {
    return (
      <FinanceLayout title="Account Detail" description="Loading account information...">
        <LoadingState />
      </FinanceLayout>
    );
  }

  if (error || !account) {
    return (
      <FinanceLayout title="Account Detail" description="">
        <ErrorState message={error || 'Account not found'} onRetry={loadAccountDetail} />
      </FinanceLayout>
    );
  }

  return (
    <FinanceLayout
      title={account.name}
      description={`Account Code: ${account.code} · Type: ${account.type} · Normal Balance: ${account.normal_balance}`}
    >
      {/* Back Button */}
      <button
        onClick={() => router.push('/finance/accounts')}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Chart of Accounts
      </button>

      {/* Account Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Hash className="w-4 h-4 text-muted-foreground" />
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Account Code</p>
          </div>
          <h3 className="text-xl font-bold font-mono text-foreground">{account.code}</h3>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Type / Normal</p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getTypeColor(account.type)}`}>
              {account.type}
            </span>
            <span className="text-xs text-muted-foreground capitalize">{account.normal_balance}</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-muted-foreground" />
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Opening Balance</p>
          </div>
          <h3 className="text-xl font-bold text-foreground font-mono">{formatINR(account.opening_balance)}</h3>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-[#d4a853]/5 rounded-bl-[60px]" />
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-[#d4a853]" />
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Current Balance</p>
          </div>
          <h3 className="text-2xl font-bold text-foreground font-mono">{formatINR(account.current_balance)}</h3>
        </div>
      </div>

      {/* Recent Ledger Entries */}
      <div className="mb-4">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          Recent Ledger Activity
          <span className="text-[10px] text-muted-foreground font-normal">(Last 10 entries)</span>
        </h2>
      </div>

      {recentLedger.length === 0 ? (
        <EmptyState
          title="No ledger activity"
          description="No transactions have been posted to this account yet."
        />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-secondary border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
              <tr>
                <th className="w-8 px-3 py-3"></th>
                <th className="text-left px-4 py-3 font-semibold">Date</th>
                <th className="text-left px-4 py-3 font-semibold">Type</th>
                <th className="text-left px-4 py-3 font-semibold">Description</th>
                <th className="text-right px-4 py-3 font-semibold">Debit</th>
                <th className="text-right px-4 py-3 font-semibold">Credit</th>
                <th className="text-left px-4 py-3 font-semibold">By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground/90">
              {recentLedger.map((entry) => {
                const isExpanded = expandedIds.has(entry._id);
                // Find the line that matches this account
                const matchingLine = entry.lines.find(
                  (l) => l.account_id && l.account_id._id === accountId
                );

                return (
                  <React.Fragment key={entry._id}>
                    <tr
                      onClick={() => toggleExpand(entry._id)}
                      className="hover:bg-secondary/50 transition-colors cursor-pointer"
                    >
                      <td className="px-3 py-3 text-center">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(entry.entry_date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-secondary border border-border text-muted-foreground">
                          {entry.transaction_type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium max-w-[240px] truncate">
                        {entry.description}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono ${matchingLine && matchingLine.debit > 0 ? 'text-emerald-400 font-bold' : 'text-muted-foreground'}`}>
                        {matchingLine && matchingLine.debit > 0 ? formatINR(matchingLine.debit) : '—'}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono ${matchingLine && matchingLine.credit > 0 ? 'text-red-400 font-bold' : 'text-muted-foreground'}`}>
                        {matchingLine && matchingLine.credit > 0 ? formatINR(matchingLine.credit) : '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {entry.created_by?.name || '-'}
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr key={`${entry._id}-lines`} className="bg-secondary/30">
                        <td colSpan={7} className="px-6 py-3">
                          <div className="rounded-lg border border-border overflow-hidden bg-card/50">
                            <table className="w-full text-xs">
                              <thead className="bg-secondary/60 text-muted-foreground uppercase text-[9px] tracking-wider">
                                <tr>
                                  <th className="text-left px-4 py-2 font-semibold">Account</th>
                                  <th className="text-right px-4 py-2 font-semibold">Debit</th>
                                  <th className="text-right px-4 py-2 font-semibold">Credit</th>
                                  <th className="text-right px-4 py-2 font-semibold">Running Bal</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {entry.lines.map((line, idx) => {
                                  const isThisAccount = line.account_id?._id === accountId;
                                  return (
                                    <tr key={idx} className={isThisAccount ? 'bg-[#d4a853]/5' : ''}>
                                      <td className="px-4 py-2 font-medium">
                                        <span className="font-mono text-muted-foreground mr-2">{line.account_id?.code}</span>
                                        {line.account_id?.name}
                                        {isThisAccount && <span className="ml-2 text-[9px] text-[#d4a853] font-bold">← This account</span>}
                                      </td>
                                      <td className={`px-4 py-2 text-right font-mono ${line.debit > 0 ? 'text-emerald-400 font-bold' : 'text-muted-foreground'}`}>
                                        {line.debit > 0 ? formatINR(line.debit) : '—'}
                                      </td>
                                      <td className={`px-4 py-2 text-right font-mono ${line.credit > 0 ? 'text-red-400 font-bold' : 'text-muted-foreground'}`}>
                                        {line.credit > 0 ? formatINR(line.credit) : '—'}
                                      </td>
                                      <td className="px-4 py-2 text-right font-mono">{formatINR(line.running_balance)}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
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
    </FinanceLayout>
  );
}
