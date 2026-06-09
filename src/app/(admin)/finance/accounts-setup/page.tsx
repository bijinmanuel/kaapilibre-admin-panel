'use client';

import { useState, useEffect } from 'react';
import { FinanceLayout } from '@/components/finance/FinanceLayout';
import { EmptyState } from '@/components/finance/EmptyState';
import { LoadingState } from '@/components/finance/LoadingState';
import { ErrorState } from '@/components/finance/ErrorState';
import { RoleGuard } from '@/components/finance/RoleGuard';
import { api } from '@/lib/api';
import { formatINR } from '@/utils/finance';
import { toast } from 'sonner';
import {
  Lock, Save, AlertCircle, ChevronDown, ChevronRight,
  Database, RefreshCw, KeyRound, Check
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

export default function AccountsSetupPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accountsGrouped, setAccountsGrouped] = useState<Record<string, AccountItem[]>>({});
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    asset: false,
    liability: false,
    equity: false,
    revenue: true,
    expense: true,
  });

  // Track updated values: { [accountId]: number }
  const [updatedBalances, setUpdatedBalances] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveSuccessId, setSaveSuccessId] = useState<string | null>(null);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await api.get('/finance/accounts');
      if (res?.success) {
        setAccountsGrouped(res.data || {});
        // Reset local changes
        setUpdatedBalances({});
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch accounts list.');
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

  const handleBalanceChange = (id: string, val: string) => {
    setUpdatedBalances((prev) => ({
      ...prev,
      [id]: val,
    }));
  };

  const handleSaveSingle = async (account: AccountItem) => {
    const valStr = updatedBalances[account._id];
    if (valStr === undefined || valStr.trim() === '') return;

    const val = Number(valStr);
    if (isNaN(val) || val < 0) {
      toast.error('Please enter a valid positive opening balance.');
      return;
    }

    if (!confirm(`Are you sure you want to set the opening balance of ${account.name} to ${formatINR(val)}? This action is permanent and cannot be modified later.`)) {
      return;
    }

    try {
      setSavingId(account._id);
      const res: any = await api.patch(`/finance/accounts/${account._id}`, {
        opening_balance: val,
      });

      if (res?.success) {
        setSaveSuccessId(account._id);
        toast.success('Opening balance saved successfully');
        setTimeout(() => setSaveSuccessId(null), 3000);
        // Reload account details
        loadAccounts();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save opening balance.');
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveAll = async () => {
    const changesCount = Object.keys(updatedBalances).length;
    if (changesCount === 0) {
      toast.error('No changes to save.');
      return;
    }

    if (!confirm(`Are you sure you want to save opening balances for all ${changesCount} modified accounts?`)) {
      return;
    }

    setLoading(true);
    let failedCount = 0;

    for (const [id, valStr] of Object.entries(updatedBalances)) {
      const val = Number(valStr);
      if (isNaN(val) || val < 0) continue;

      try {
        await api.patch(`/finance/accounts/${id}`, {
          opening_balance: val,
        });
      } catch (err) {
        console.error(`Failed to save balance for account ${id}:`, err);
        failedCount++;
      }
    }

    if (failedCount > 0) {
      toast.error(`Saved updates, but ${failedCount} account(s) failed.`);
    } else {
      toast.success('All opening balances saved successfully');
    }

    loadAccounts();
  };

  const hasPendingChanges = Object.keys(updatedBalances).length > 0;

  return (
    <RoleGuard
      allowedRoles={['admin']}
      fallback={
        <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4 text-red-400">
            <KeyRound className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Unauthorized Access</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-[280px] leading-relaxed">
            Only administrators are authorized to configure and set opening balances in the Chart of Accounts.
          </p>
        </div>
      }
    >
      <FinanceLayout
        title="Accounts Setup"
        description="Configure initial Chart of Accounts opening balances (Rule ACC-05: opening balances are set once and locked)."
      >
        <div className="flex justify-between items-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-xs text-yellow-400/90 bg-yellow-500/5 border border-yellow-500/10 rounded-xl px-4 py-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Values can only be set from zero. Locked accounts must be changed using adjustment entries.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAccounts}
              className="p-2 bg-secondary border border-border rounded-xl text-muted-foreground hover:text-foreground transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {hasPendingChanges && (
              <button
                onClick={handleSaveAll}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#d4a853] text-[#1a1713] rounded-xl text-xs font-bold hover:bg-[#d4a853]/90 transition-colors"
              >
                <Save className="w-4 h-4" /> Save All Changes
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={loadAccounts} />
        ) : Object.keys(accountsGrouped).length === 0 ? (
          <EmptyState
            title="Chart of Accounts empty"
            description="The seeder must be run to generate Chart of Accounts rows first."
          />
        ) : (
          <div className="space-y-4">
            {(['asset', 'liability', 'equity', 'revenue', 'expense'] as const).map((type) => {
              const items = accountsGrouped[type] || [];
              if (items.length === 0) return null;

              const isCollapsed = collapsedSections[type];
              const displayTypeName = type.toUpperCase() + 'S';

              return (
                <div key={type} className="border border-border rounded-2xl overflow-hidden bg-card/20">
                  {/* Section header */}
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
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>

                  {/* Section content */}
                  {!isCollapsed && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-secondary/50 border-b border-border text-muted-foreground uppercase text-[9px] tracking-wider">
                          <tr>
                            <th className="text-left px-5 py-3 font-semibold">Code</th>
                            <th className="text-left px-5 py-3 font-semibold">Account Name</th>
                            <th className="text-left px-5 py-3 font-semibold">Normal Balance</th>
                            <th className="text-right px-5 py-3 font-semibold w-40">Opening Balance</th>
                            <th className="text-right px-5 py-3 font-semibold">Current Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-foreground/90">
                          {items.map((account) => {
                            const isSet = account.opening_balance > 0;
                            const currentVal = updatedBalances[account._id] !== undefined
                              ? updatedBalances[account._id]
                              : isSet
                              ? account.opening_balance.toString()
                              : '';

                            return (
                              <tr key={account._id} className="hover:bg-secondary/50 transition-colors">
                                <td className="px-5 py-3 font-mono text-muted-foreground">
                                  {account.code}
                                </td>
                                <td className="px-5 py-3 font-medium">
                                  {account.name}
                                </td>
                                <td className="px-5 py-3 text-muted-foreground capitalize">
                                  {account.normal_balance}
                                </td>
                                <td className="px-5 py-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {isSet ? (
                                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-semibold py-1">
                                        <Lock className="w-3.5 h-3.5 text-muted-foreground/60" />
                                        <span>{formatINR(account.opening_balance)}</span>
                                      </div>
                                    ) : (
                                      <>
                                        <input
                                          type="number"
                                          placeholder="0.00"
                                          value={currentVal}
                                          onChange={(e) => handleBalanceChange(account._id, e.target.value)}
                                          className="bg-secondary border border-border rounded-lg px-2 py-1 text-right text-xs text-foreground focus:outline-none focus:border-[#d4a853] w-28"
                                        />
                                        {updatedBalances[account._id] !== undefined && (
                                          <button
                                            onClick={() => handleSaveSingle(account)}
                                            disabled={savingId === account._id}
                                            className="p-1 rounded bg-[#d4a853]/10 hover:bg-[#d4a853]/25 text-[#d4a853] transition-colors"
                                          >
                                            {savingId === account._id ? (
                                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                            ) : saveSuccessId === account._id ? (
                                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                                            ) : (
                                              <Save className="w-3.5 h-3.5" />
                                            )}
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </td>
                                <td className="px-5 py-3 text-right font-bold text-foreground">
                                  {formatINR(account.current_balance)}
                                </td>
                              </tr>
                            );
                          })}
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
    </RoleGuard>
  );
}
