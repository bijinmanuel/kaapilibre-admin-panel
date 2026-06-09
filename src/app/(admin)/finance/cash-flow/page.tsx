'use client';

import { useState, useEffect } from 'react';
import { FinanceLayout } from '@/components/finance/FinanceLayout';
import { LoadingState } from '@/components/finance/LoadingState';
import { ErrorState } from '@/components/finance/ErrorState';
import { formatINR } from '@/utils/finance';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  TrendingUp, TrendingDown, RefreshCw, Loader2, Download, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid
} from 'recharts';

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 text-xs shadow-lg">
      <p className="font-bold text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {formatINR(p.value)}</p>
      ))}
      {payload.length === 2 && (
        <p className={`mt-1 font-semibold ${payload[0].value - payload[1].value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          Net: {formatINR(payload[0].value - payload[1].value)}
        </p>
      )}
    </div>
  );
};

export default function CashFlowPage() {
  const [period, setPeriod] = useState('this_month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [view, setView] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ view });
      if (period !== 'custom') {
        params.set('period', period);
      } else {
        params.set('period', 'custom');
        if (customFrom) params.set('from', customFrom);
        if (customTo) params.set('to', customTo);
      }
      const res: any = await api.get(`/finance/reports/cashflow?${params}`);
      if (res?.success) setData(res.data);
      else toast.error(res?.message || 'Failed to load cash flow');
    } catch (err: any) {
      setError(err.message || 'Failed to load cash flow');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (period !== 'custom' || (customFrom && customTo)) {
      loadData();
    }
  }, [period, customFrom, customTo, view]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const params = new URLSearchParams({ view, format: 'csv' });
      if (period !== 'custom') { params.set('period', period); }
      else {
        params.set('period', 'custom');
        if (customFrom) params.set('from', customFrom);
        if (customTo) params.set('to', customTo);
      }
      const authToken = (window as any).__authToken || '';
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/finance/reports/cashflow?${params}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `cashflow_${Date.now()}.json`; a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const inputCls = "px-3 py-2 bg-secondary border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#d4a853]/50";

  const PERIODS = [
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_quarter', label: 'This Quarter' },
    { value: 'this_year', label: 'This Year' },
    { value: 'custom', label: 'Custom' },
  ];

  return (
    <FinanceLayout
      title="Cash Flow"
      description="Track operating, investing, and financing cash movements over time."
    >
      {/* Filters */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-5">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Period</label>
            <select value={period} onChange={e => setPeriod(e.target.value)} className={inputCls}>
              {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>

          {period === 'custom' && (
            <>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">From</label>
                <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">To</label>
                <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className={inputCls} />
              </div>
            </>
          )}

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">View</label>
            <div className="flex gap-1 bg-secondary p-1 rounded-lg">
              {(['daily', 'weekly', 'monthly'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1 rounded text-[11px] font-semibold capitalize transition-all ${view === v ? 'bg-[#d4a853] text-[#000000] dark:text-[#ffffff] shadow' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                    }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            style={{ background: '#d4a853', color: '#1a1713' }}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Generate
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && <LoadingState />}

      {/* Error */}
      {error && !loading && <ErrorState message={error} onRetry={loadData} />}

      {/* No Data */}
      {!loading && !error && !data && (
        <div className="bg-card border border-border rounded-2xl p-16 text-center">
          <TrendingUp className="w-10 h-10 mx-auto text-muted-foreground/20 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Select a period and click Generate</p>
        </div>
      )}

      {/* Data */}
      {!loading && !error && data && (
        <div className="space-y-5">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Opening Balance', value: data.opening_balance, color: 'text-foreground', Icon: null },
              { label: 'Total Cash In', value: data.total_cash_in, color: 'text-emerald-400', Icon: ArrowUpRight },
              { label: 'Total Cash Out', value: data.total_cash_out, color: 'text-red-400', Icon: ArrowDownLeft },
              {
                label: 'Net Cash Flow',
                value: data.net_cash_flow,
                color: data.net_cash_flow >= 0 ? 'text-emerald-400' : 'text-red-400',
                Icon: data.net_cash_flow >= 0 ? TrendingUp : TrendingDown,
              },
              { label: 'Closing Balance', value: data.closing_balance, color: 'text-foreground', Icon: null },
            ].map(item => (
              <div
                key={item.label}
                className={`bg-card border rounded-2xl p-4 relative overflow-hidden ${item.label === 'Net Cash Flow'
                    ? data.net_cash_flow >= 0 ? 'border-emerald-500/20' : 'border-red-500/20'
                    : 'border-border'
                  }`}
              >
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{item.label}</p>
                <p className={`text-base font-bold mt-1 font-mono ${item.color}`}>{formatINR(item.value)}</p>
                {item.Icon && (
                  <div className="absolute right-3 top-3 opacity-10">
                    <item.Icon className="w-8 h-8" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-sm font-bold text-foreground mb-4">
              Cash Flow Trend — <span className="text-[#d4a853] capitalize">{view}</span>
            </h3>
            {data.trend && data.trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.trend} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#888' }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: '#888' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="cash_in" name="Cash In" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cash_out" name="Cash Out" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-10">No trend data for this period</p>
            )}
          </div>

          {/* Inflow / Outflow Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Inflow */}
            <div className="bg-card border border-emerald-500/10 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-emerald-400 mb-4 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4" /> Inflow Sources
              </h3>
              <div className="space-y-2">
                {[
                  { label: 'Cafe Sales', value: data.inflow_breakdown.cafe_sales },
                  { label: 'Online Sales', value: data.inflow_breakdown.online_sales },
                  { label: 'Loan Proceeds', value: data.inflow_breakdown.loan_proceeds },
                  { label: 'Other Income', value: data.inflow_breakdown.other },
                ].map(item => {
                  const pct = data.total_cash_in > 0 ? (item.value / data.total_cash_in) * 100 : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-mono font-semibold text-foreground">{formatINR(item.value)}</span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-3 border-t border-border flex justify-between text-xs font-bold">
                <span className="text-muted-foreground">Total Inflow</span>
                <span className="text-emerald-400 font-mono">{formatINR(data.total_cash_in)}</span>
              </div>
            </div>

            {/* Outflow */}
            <div className="bg-card border border-red-500/10 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-red-400 mb-4 flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4" /> Outflow Categories
              </h3>
              <div className="space-y-2">
                {[
                  { label: 'Inventory', value: data.outflow_breakdown.inventory },
                  { label: 'Salaries', value: data.outflow_breakdown.salaries },
                  { label: 'Rent', value: data.outflow_breakdown.rent },
                  { label: 'Utilities', value: data.outflow_breakdown.utilities },
                  { label: 'Marketing', value: data.outflow_breakdown.marketing },
                  { label: 'Loan Principal', value: data.outflow_breakdown.loan_repayments_principal },
                  { label: 'Loan Interest', value: data.outflow_breakdown.loan_repayments_interest },
                  { label: 'Other', value: data.outflow_breakdown.other },
                ].map(item => {
                  const pct = data.total_cash_out > 0 ? (item.value / data.total_cash_out) * 100 : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-mono font-semibold text-foreground">{formatINR(item.value)}</span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-3 border-t border-border flex justify-between text-xs font-bold">
                <span className="text-muted-foreground">Total Outflow</span>
                <span className="text-red-400 font-mono">{formatINR(data.total_cash_out)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </FinanceLayout>
  );
}
