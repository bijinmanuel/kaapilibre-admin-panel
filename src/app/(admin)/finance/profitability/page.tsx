'use client';

import { useState, useEffect } from 'react';
import { FinanceLayout } from '@/components/finance/FinanceLayout';
import { LoadingState } from '@/components/finance/LoadingState';
import { ErrorState } from '@/components/finance/ErrorState';
import { formatINR } from '@/utils/finance';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, RefreshCw, Loader2, Coffee, Globe, BookOpen, AlertCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  CartesianGrid, LineChart, Line
} from 'recharts';

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 text-xs shadow-lg">
      <p className="font-bold text-foreground mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.name?.includes('%') ? p.value + '%' : formatINR(p.value)}
        </p>
      ))}
    </div>
  );
};

// ─── Business Type Card ───────────────────────────────────────────────────────
function BusinessCard({
  title, icon: Icon, color, stats
}: {
  title: string;
  icon: React.ComponentType<any>;
  color: string;
  stats: { revenue: number; allocated_cogs: number; gross_profit: number; gross_margin: string; order_count: number };
}) {
  const isPositive = stats.gross_profit >= 0;
  const marginNum = parseFloat(stats.gross_margin);

  return (
    <div className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden">
      {/* Icon watermark */}
      <div className="absolute right-4 top-4 opacity-5">
        <Icon className="w-16 h-16" />
      </div>

      {/* Title */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0`}
          style={{ background: `${color}18` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">{title}</p>
          <p className="text-[10px] text-muted-foreground">{stats.order_count} entries</p>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-center">
          <span className="text-[11px] text-muted-foreground">Revenue</span>
          <span className="text-sm font-bold font-mono text-foreground">{formatINR(stats.revenue)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[11px] text-muted-foreground">COGS (allocated)</span>
          <span className="text-xs font-mono text-red-400">−{formatINR(stats.allocated_cogs)}</span>
        </div>
        <div className="h-px bg-border" />
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-semibold text-foreground">Gross Profit</span>
          <span className={`text-sm font-bold font-mono ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatINR(stats.gross_profit)}
          </span>
        </div>
      </div>

      {/* Margin bar */}
      <div className="mt-4">
        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
          <span>Gross Margin</span>
          <span className="font-semibold" style={{ color }}>{stats.gross_margin}%</span>
        </div>
        <div className="h-2 bg-border rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(100, Math.max(0, marginNum))}%`,
              background: `linear-gradient(90deg, ${color}80, ${color})`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProfitabilityPage() {
  const [period, setPeriod] = useState('this_month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (period !== 'custom') {
        params.set('period', period);
      } else {
        params.set('period', 'custom');
        if (customFrom) params.set('from', customFrom);
        if (customTo) params.set('to', customTo);
      }
      const res: any = await api.get(`/finance/profitability?${params}`);
      if (res?.success) setData(res.data);
      else toast.error(res?.message || 'Failed to load profitability data');
    } catch (err: any) {
      setError(err.message || 'Failed to load profitability data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (period !== 'custom' || (customFrom && customTo)) {
      loadData();
    }
  }, [period, customFrom, customTo]);

  const inputCls = "px-3 py-2 bg-secondary border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#d4a853]/50";

  const PERIODS = [
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_quarter', label: 'This Quarter' },
    { value: 'this_year', label: 'This Year' },
    { value: 'custom', label: 'Custom' },
  ];

  const businessCards = data ? [
    { key: 'cafe_order', title: 'Cafe Orders', icon: Coffee, color: '#d4a853', stats: data.by_source.cafe_order },
    { key: 'online_order', title: 'Online Orders', icon: Globe, color: '#3b82f6', stats: data.by_source.online_order },
    { key: 'manual', title: 'Manual / Other', icon: BookOpen, color: '#8b5cf6', stats: data.by_source.manual },
  ] : [];

  // Build margin comparison chart data
  const marginChartData = data ? [
    { name: 'Cafe', margin: parseFloat(data.by_source.cafe_order.gross_margin), revenue: data.by_source.cafe_order.revenue },
    { name: 'Online', margin: parseFloat(data.by_source.online_order.gross_margin), revenue: data.by_source.online_order.revenue },
    { name: 'Manual', margin: parseFloat(data.by_source.manual.gross_margin), revenue: data.by_source.manual.revenue },
  ] : [];

  return (
    <FinanceLayout
      title="Profitability"
      description="Compare gross margins and net profit across Cafe, Online, and Manual revenue streams."
    >
      {/* Filter bar */}
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

      {loading && <LoadingState />}
      {error && !loading && <ErrorState message={error} onRetry={loadData} />}

      {!loading && !error && !data && (
        <div className="bg-card border border-border rounded-2xl p-16 text-center">
          <TrendingUp className="w-10 h-10 mx-auto text-muted-foreground/20 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Select a period and click Generate</p>
        </div>
      )}

      {!loading && !error && data && (
        <div className="space-y-5">
          {/* Overall Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Revenue', value: data.overall.total_revenue, color: 'text-foreground' },
              { label: 'Total Expenses', value: data.overall.total_expenses, color: 'text-red-400' },
              { label: 'Net Profit', value: data.overall.net_profit, color: data.overall.net_profit >= 0 ? 'text-emerald-400' : 'text-red-400' },
              { label: 'Net Margin', value: data.overall.net_margin + '%', color: data.overall.net_profit >= 0 ? 'text-emerald-400' : 'text-red-400' },
            ].map(item => (
              <div key={item.label} className="bg-card border border-border rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
                <p className={`text-base font-bold mt-1 font-mono ${item.color}`}>
                  {typeof item.value === 'number' ? formatINR(item.value) : item.value}
                </p>
              </div>
            ))}
          </div>

          {/* Business Type Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {businessCards.map(({ key, ...cardProps }) => (
              <BusinessCard key={key} {...cardProps} />
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Margin Comparison */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-sm font-bold text-foreground mb-4">Gross Margin Comparison</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={marginChartData} barCategoryGap="40%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#888' }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: '#888' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="margin" name="Gross Margin %" fill="#d4a853" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Revenue Trend */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-sm font-bold text-foreground mb-4">Monthly Revenue Trend (6 months)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.monthly_trend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#888' }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: '#888' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Line type="monotone" dataKey="cafe" name="Cafe" stroke="#d4a853" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="online" name="Online" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="manual" name="Manual" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expense Breakdown */}
          {data.expenses_breakdown?.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-sm font-bold text-foreground mb-4">Approved Expense Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {data.expenses_breakdown.map((e: any) => (
                  <div key={e.category} className="bg-secondary rounded-xl p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{e.category}</p>
                    <p className="text-sm font-bold font-mono text-foreground mt-1">{formatINR(e.total)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{e.count} entries</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
            <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-400/80">
              <strong>Allocation Note:</strong> {data.note}
            </p>
          </div>
        </div>
      )}
    </FinanceLayout>
  );
}
