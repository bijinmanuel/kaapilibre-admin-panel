'use client';

import { useState, useEffect } from 'react';
import { FinanceLayout } from '@/components/finance/FinanceLayout';
import { LoadingState } from '@/components/finance/LoadingState';
import { formatINR } from '@/utils/finance';
import { useAuthStore } from '@/store/authStore';
import { api, getToken, API_URL_BASE } from '@/lib/api';
import { toast } from 'sonner';
import {
  FileText, Download, RefreshCw, Loader2, TrendingUp, TrendingDown,
  AlertCircle, ChevronDown, FileSpreadsheet, Building2
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type ReportTab = 'pl' | 'cashflow' | 'loans' | 'account-statement';
type ExportFormat = 'pdf' | 'excel' | 'csv';

// ─── Sub-components ───────────────────────────────────────────────────────────

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest mb-2"
        style={{ background: 'rgba(212,168,83,0.12)', color: '#d4a853' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function ReportLine({ label, value, indent = true }: { label: string; value: number | string; indent?: boolean }) {
  const isNum = typeof value === 'number';
  return (
    <div className={`flex items-center justify-between py-1 border-b border-border/50 text-xs ${indent ? 'pl-3' : ''}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground">{isNum ? formatINR(value as number) : value}</span>
    </div>
  );
}

function ReportTotal({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  const isPositive = value >= 0;
  return (
    <div className={`flex items-center justify-between py-2 px-3 rounded-xl mt-2 ${highlight ? 'border border-[#d4a853]/30' : 'bg-secondary/60'}`}
      style={highlight ? { background: 'rgba(212,168,83,0.06)' } : {}}>
      <span className="text-sm font-bold text-foreground">{label}</span>
      <span className={`text-sm font-bold font-mono ${highlight ? (isPositive ? 'text-emerald-400' : 'text-red-400') : 'text-foreground'}`}>
        {formatINR(value)}
      </span>
    </div>
  );
}

// ─── P&L Preview ─────────────────────────────────────────────────────────────
function PLPreview({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="space-y-2">
      <p className="text-[10px] text-muted-foreground text-center mb-4">
        {new Date(data.period.from).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} —{' '}
        {new Date(data.period.to).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        {' · '}{(data.business_type || 'all').toUpperCase()}
      </p>

      <ReportSection title="Revenue">
        <ReportLine label="Cafe Order Revenue" value={data.revenue.cafe} />
        <ReportLine label="Online Order Revenue" value={data.revenue.online} />
        <ReportLine label="Manual / Other Income" value={data.revenue.other} />
        <ReportTotal label="TOTAL REVENUE" value={data.revenue.total} />
      </ReportSection>

      <ReportSection title="Cost of Goods Sold">
        {(data.cogs.lines || []).map((l: any, i: number) => (
          <ReportLine key={i} label={l._id?.name || 'Direct Expense'} value={l.total} />
        ))}
        {!data.cogs.lines?.length && <p className="text-[11px] text-muted-foreground pl-3">No direct expenses</p>}
        <ReportTotal label="TOTAL COGS" value={data.cogs.total} />
      </ReportSection>

      <ReportTotal label="GROSS PROFIT" value={data.gross_profit} />
      <div className="flex justify-between px-3 py-1 text-[11px] text-muted-foreground">
        <span>Gross Profit Margin</span>
        <span className="font-mono text-[#d4a853]">{data.gross_profit_margin}%</span>
      </div>

      <ReportSection title="Operating Expenses">
        {(data.operating_expenses.lines || []).map((l: any, i: number) => (
          <ReportLine key={i} label={l._id?.name || 'Expense'} value={l.total} />
        ))}
        {!data.operating_expenses.lines?.length && <p className="text-[11px] text-muted-foreground pl-3">No operating expenses</p>}
        <ReportTotal label="TOTAL OPERATING EXPENSES" value={data.operating_expenses.total} />
      </ReportSection>

      <ReportTotal label="EBITDA" value={data.ebitda} />

      <ReportSection title="Other Expenses">
        <ReportLine label="Loan Interest Expense" value={data.other_expenses.interest} />
        <ReportTotal label="TOTAL OTHER EXPENSES" value={data.other_expenses.total} />
      </ReportSection>

      <div className="mt-4 pt-2 border-t-2 border-[#d4a853]">
        <ReportTotal label="NET PROFIT / (LOSS)" value={data.net_profit} highlight />
        <div className="flex gap-6 mt-2 px-3 text-[11px] text-muted-foreground">
          <span>Net Margin: <strong className="text-foreground">{data.net_profit_margin}%</strong></span>
          <span>Expense Ratio: <strong className="text-foreground">{data.expense_ratio}%</strong></span>
        </div>
      </div>
    </div>
  );
}

// ─── Cash Flow Preview ────────────────────────────────────────────────────────
function CashFlowPreview({ data }: { data: any }) {
  if (!data) return null;
  const isPositive = data.net_cash_flow >= 0;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: 'Opening Balance', value: data.opening_balance, color: 'text-foreground' },
          { label: 'Total Cash In', value: data.total_cash_in, color: 'text-emerald-400' },
          { label: 'Total Cash Out', value: data.total_cash_out, color: 'text-red-400' },
          { label: 'Net Cash Flow', value: data.net_cash_flow, color: isPositive ? 'text-emerald-400' : 'text-red-400' },
          { label: 'Closing Balance', value: data.closing_balance, color: 'text-foreground' },
        ].map(item => (
          <div key={item.label} className="bg-secondary/60 rounded-xl p-3 border border-border">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
            <p className={`text-sm font-bold mt-1 font-mono ${item.color}`}>{formatINR(item.value)}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ReportSection title="Inflow Breakdown">
          <ReportLine label="Cafe Sales" value={data.inflow_breakdown.cafe_sales} />
          <ReportLine label="Online Sales" value={data.inflow_breakdown.online_sales} />
          <ReportLine label="Loan Proceeds" value={data.inflow_breakdown.loan_proceeds} />
          <ReportLine label="Other" value={data.inflow_breakdown.other} />
        </ReportSection>
        <ReportSection title="Outflow Breakdown">
          <ReportLine label="Inventory" value={data.outflow_breakdown.inventory} />
          <ReportLine label="Salaries" value={data.outflow_breakdown.salaries} />
          <ReportLine label="Rent" value={data.outflow_breakdown.rent} />
          <ReportLine label="Utilities" value={data.outflow_breakdown.utilities} />
          <ReportLine label="Marketing" value={data.outflow_breakdown.marketing} />
          <ReportLine label="Loan Principal" value={data.outflow_breakdown.loan_repayments_principal} />
          <ReportLine label="Loan Interest" value={data.outflow_breakdown.loan_repayments_interest} />
        </ReportSection>
      </div>
    </div>
  );
}

// ─── Loan Report Preview ──────────────────────────────────────────────────────
function LoanPreview({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: 'Total Borrowed', value: data.summary.total_borrowed, color: 'text-foreground' },
          { label: 'Total Repaid', value: data.summary.total_repaid, color: 'text-emerald-400' },
          { label: 'Outstanding', value: data.summary.outstanding_liability, color: 'text-red-400' },
          { label: 'Interest Paid', value: data.summary.total_interest_paid, color: 'text-orange-400' },
          { label: 'Active Loans', value: data.summary.active_count + ' loans', color: 'text-foreground' },
          { label: 'Closed Loans', value: data.summary.closed_count + ' loans', color: 'text-foreground' },
        ].map(item => (
          <div key={item.label} className="bg-secondary/60 rounded-xl p-3 border border-border">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
            <p className={`text-sm font-bold mt-1 font-mono ${item.color}`}>
              {typeof item.value === 'number' ? formatINR(item.value) : item.value}
            </p>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-xs">
          <thead className="bg-secondary text-muted-foreground uppercase text-[10px] tracking-wider">
            <tr>
              <th className="px-3 py-2.5 text-left">Lender</th>
              <th className="px-3 py-2.5 text-left">Type</th>
              <th className="px-3 py-2.5 text-right">Principal</th>
              <th className="px-3 py-2.5 text-right">Rate</th>
              <th className="px-3 py-2.5 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(data.loans || []).map((loan: any) => (
              <tr key={loan._id} className="hover:bg-secondary/40">
                <td className="px-3 py-2 font-medium">{typeof loan.lender_id === 'object' ? loan.lender_id?.name : 'Unknown'}</td>
                <td className="px-3 py-2 text-muted-foreground capitalize">{typeof loan.lender_id === 'object' ? loan.lender_id?.type : '—'}</td>
                <td className="px-3 py-2 text-right font-mono">{formatINR(parseFloat(loan.principal?.toString() || '0'))}</td>
                <td className="px-3 py-2 text-right">{loan.interest_rate}%</td>
                <td className="px-3 py-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${loan.status === 'active' ? 'bg-orange-500/10 text-orange-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {loan.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Account Statement Preview ────────────────────────────────────────────────
function AccountStatementPreview({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="space-y-4">
      <div className="flex gap-6 flex-wrap text-xs text-muted-foreground border-b border-border pb-3">
        <span>Account: <strong className="text-foreground">{data.account.code} — {data.account.name}</strong></span>
        <span>Opening: <strong className="text-foreground font-mono">{formatINR(data.opening_balance)}</strong></span>
        <span>Closing: <strong className="text-foreground font-mono">{formatINR(data.closing_balance)}</strong></span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-xs">
          <thead className="bg-secondary text-muted-foreground uppercase text-[10px] tracking-wider">
            <tr>
              <th className="px-3 py-2.5 text-left">Date</th>
              <th className="px-3 py-2.5 text-left">Type</th>
              <th className="px-3 py-2.5 text-left">Description</th>
              <th className="px-3 py-2.5 text-right">Debit</th>
              <th className="px-3 py-2.5 text-right">Credit</th>
              <th className="px-3 py-2.5 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(data.entries || []).map((e: any, i: number) => (
              <tr key={i} className="hover:bg-secondary/40">
                <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                  {new Date(e.entry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </td>
                <td className="px-3 py-2 text-muted-foreground whitespace-nowrap capitalize text-[10px]">{e.transaction_type?.replace('_', ' ')}</td>
                <td className="px-3 py-2 max-w-[200px] truncate">{e.description}</td>
                <td className="px-3 py-2 text-right font-mono text-emerald-400">{e.debit > 0 ? formatINR(e.debit) : '—'}</td>
                <td className="px-3 py-2 text-right font-mono text-red-400">{e.credit > 0 ? formatINR(e.credit) : '—'}</td>
                <td className="px-3 py-2 text-right font-mono font-bold">{formatINR(e.running_balance)}</td>
              </tr>
            ))}
            {(!data.entries?.length) && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground text-[11px]">No transactions in this period</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex gap-6 flex-wrap text-xs text-muted-foreground justify-end">
        <span>Total In: <strong className="text-emerald-400 font-mono">{formatINR(data.total_inflow)}</strong></span>
        <span>Total Out: <strong className="text-red-400 font-mono">{formatINR(data.total_outflow)}</strong></span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReportsModulePage() {
  const token = useAuthStore((s) => (s as any).token || '');

  // Tab state
  const [activeTab, setActiveTab] = useState<ReportTab>('pl');

  // Filter state
  const [period, setPeriod] = useState('this_month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [businessType, setBusinessType] = useState('all');
  const [cfView, setCfView] = useState('monthly');
  const [loanStatus, setLoanStatus] = useState('');
  const [accountId, setAccountId] = useState('');
  const [accounts, setAccounts] = useState<Array<{ _id: string; code: number; name: string }>>([]);

  // Report data
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<ExportFormat | null>(null);

  // Load accounts list for account statement tab
  const loadAccounts = async () => {
    if (accounts.length > 0) return;
    try {
      const res: any = await api.get('/finance/accounts');
      if (res?.success) {
        const flat: any[] = [];
        Object.values(res.data || {}).forEach((group: any) => group.forEach((a: any) => flat.push(a)));
        setAccounts(flat);
      }
    } catch { /* silent */ }
  };

  const getEndpoint = () => {
    const map: Record<ReportTab, string> = {
      pl: '/finance/reports/pl',
      cashflow: '/finance/reports/cashflow',
      loans: '/finance/reports/loans',
      'account-statement': '/finance/reports/account-statement',
    };
    return map[activeTab];
  };

  const buildParams = (format = 'json') => {
    const p = new URLSearchParams({ format });

    if (activeTab === 'account-statement') {
      // Account-statement always needs an explicit date range
      p.set('period', 'custom');
      if (customFrom) p.set('from', customFrom);
      if (customTo) p.set('to', customTo);
      if (accountId) p.set('account_id', accountId);
    } else {
      p.set('period', period);
      if (period === 'custom') {
        if (customFrom) p.set('from', customFrom);
        if (customTo) p.set('to', customTo);
      }
    }

    if (activeTab === 'pl') p.set('business_type', businessType);
    if (activeTab === 'cashflow') p.set('view', cfView);
    if (activeTab === 'loans' && loanStatus) p.set('status', loanStatus);

    return p;
  };

  const handleGenerate = async () => {
    if (activeTab === 'account-statement') {
      if (!accountId) { toast.error('Please select an account'); return; }
      if (!customFrom) { toast.error('Please select a From date'); return; }
      if (!customTo) { toast.error('Please select a To date'); return; }
    }
    if (period === 'custom' && activeTab !== 'account-statement') {
      if (!customFrom || !customTo) { toast.error('Please select both From and To dates'); return; }
    }
    setLoading(true);
    setReportData(null);
    try {
      const res: any = await api.get(`${getEndpoint()}?${buildParams('json')}`);
      if (res?.success) setReportData(res.data);
      else toast.error(res?.message || 'Failed to generate report');
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'account-statement') {
      if (accountId && customFrom && customTo) {
        handleGenerate();
      }
    } else {
      if (period !== 'custom' || (customFrom && customTo)) {
        handleGenerate();
      }
    }
  }, [activeTab, period, customFrom, customTo, businessType, cfView, loanStatus, accountId]);

  const handleDownload = async (format: ExportFormat) => {
    if (activeTab === 'account-statement' && !accountId) { toast.error('Select an account first'); return; }
    setDownloading(format);
    try {
      const params = buildParams(format);
      const token = getToken();
      const response = await fetch(`${API_URL_BASE}${getEndpoint()}?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        toast.error(errJson?.message || `Download failed (${response.status})`);
        return;
      }
      const blob = await response.blob();
      const ext = format === 'excel' ? 'xlsx' : format;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}_report_${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err.message || 'Download failed');
    } finally {
      setDownloading(null);
    }
  };

  const switchTab = (tabId: ReportTab) => {
    setActiveTab(tabId);
    setReportData(null);
    setCustomFrom('');
    setCustomTo('');
    if (tabId === 'account-statement') loadAccounts();
  };

  const clearFilters = () => {
    setPeriod('this_month');
    setCustomFrom('');
    setCustomTo('');
    setBusinessType('all');
    setCfView('monthly');
    setLoanStatus('');
    setAccountId('');
    setReportData(null);
  };

  const TAB_CONFIG = [
    { id: 'pl' as ReportTab, label: 'P&L Statement' },
    { id: 'cashflow' as ReportTab, label: 'Cash Flow' },
    { id: 'loans' as ReportTab, label: 'Loans' },
    { id: 'account-statement' as ReportTab, label: 'Account Statement' },
  ];

  const PERIODS = [
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_quarter', label: 'This Quarter' },
    { value: 'this_year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const inputCls = "px-3 py-2 bg-secondary border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#d4a853]/50";

  return (
    <FinanceLayout
      title="Financial Reports"
      description="Generate, preview, and export P&L, Cash Flow, Loan, and Account Statement reports."
    >
      {/* Tab selector */}
      <div className="flex gap-1 bg-secondary p-1 rounded-xl mb-5 w-fit flex-wrap">
        {TAB_CONFIG.map(tab => (
          <button
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === tab.id ? 'bg-[#d4a853]' : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-5">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Period dropdown — hidden for account-statement (uses explicit date range) */}
          {activeTab !== 'account-statement' && (
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Period</label>
              <select value={period} onChange={e => { setPeriod(e.target.value); setCustomFrom(''); setCustomTo(''); }} className={inputCls}>
                {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          )}

          {/* Custom date range — shown when period=custom OR for account-statement tab */}
          {(period === 'custom' || activeTab === 'account-statement') && (
            <>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                  {activeTab === 'account-statement' ? 'From Date *' : 'From'}
                </label>
                <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                  {activeTab === 'account-statement' ? 'To Date *' : 'To'}
                </label>
                <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className={inputCls} />
              </div>
            </>
          )}

          {/* P&L: Business Type */}
          {activeTab === 'pl' && (
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Business Type</label>
              <select value={businessType} onChange={e => setBusinessType(e.target.value)} className={inputCls}>
                <option value="all">All</option>
                <option value="cafe">Cafe Orders</option>
                <option value="online">Online Orders</option>
                <option value="manual">Manual / Other</option>
              </select>
            </div>
          )}

          {/* Cash Flow: View */}
          {activeTab === 'cashflow' && (
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">View</label>
              <div className="flex gap-1 bg-secondary p-1 rounded-lg">
                {['daily', 'weekly', 'monthly'].map(v => (
                  <button
                    key={v}
                    onClick={() => setCfView(v)}
                    className={`px-3 py-1 rounded text-[11px] font-semibold capitalize transition-all ${cfView === v ? 'bg-[#d4a853] text-[#000000] dark:text-[#ffffff] shadow' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                      }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loans: Status */}
          {activeTab === 'loans' && (
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Status</label>
              <select value={loanStatus} onChange={e => setLoanStatus(e.target.value)} className={inputCls}>
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          )}

          {/* Account Statement: Account selector */}
          {activeTab === 'account-statement' && (
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Account *</label>
              <select value={accountId} onChange={e => setAccountId(e.target.value)} className={`${inputCls} min-w-[220px]`}>
                <option value="">Select account...</option>
                {accounts.map(a => <option key={a._id} value={a._id}>{a.code} — {a.name}</option>)}
              </select>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 ml-auto items-end">
            {/* Clear filters */}
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground hover:border-border/80 transition-all"
            >
              ✕ Clear
            </button>

            {/* Generate */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              style={{ background: '#d4a853', color: '#1a1713' }}
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Report Preview */}
      <div className="bg-card border border-border rounded-2xl p-6 min-h-[300px]">
        {/* Download bar — only shown when data is available */}
        {reportData && (
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#d4a853]" />
              <span className="text-sm font-bold text-foreground capitalize">{activeTab.replace('-', ' ')} Report</span>
            </div>
            <div className="flex gap-2">
              {(['pdf', 'excel', 'csv'] as ExportFormat[]).map(fmt => (
                <button
                  key={fmt}
                  onClick={() => handleDownload(fmt)}
                  disabled={downloading === fmt}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:border-[#d4a853]/40 transition-all disabled:opacity-50"
                >
                  {downloading === fmt
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Download className="w-3 h-3" />}
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Preview Content */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#d4a853] mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Generating report...</p>
            </div>
          </div>
        )}

        {!loading && !reportData && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileSpreadsheet className="w-10 h-10 text-muted-foreground/20 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Select filters and click Generate Report</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">The report will appear here as a preview</p>
          </div>
        )}

        {!loading && reportData && activeTab === 'pl' && <PLPreview data={reportData} />}
        {!loading && reportData && activeTab === 'cashflow' && <CashFlowPreview data={reportData} />}
        {!loading && reportData && activeTab === 'loans' && <LoanPreview data={reportData} />}
        {!loading && reportData && activeTab === 'account-statement' && <AccountStatementPreview data={reportData} />}
      </div>
    </FinanceLayout>
  );
}
