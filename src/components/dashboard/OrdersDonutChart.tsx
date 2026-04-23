'use client'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { STATUS_HEX } from '@/lib/utils'
import type { StatusCount, OrderStatus } from '@/types'

interface Props { data?: StatusCount[]; isLoading?: boolean }

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg px-3 py-2 text-xs border border-border bg-popover shadow-lg">
      <p className="font-medium capitalize text-foreground">{payload[0].name}</p>
      <p className="text-muted-foreground">{payload[0].value} orders</p>
    </div>
  )
}

export function OrdersDonutChart({ data, isLoading }: Props) {
  const total = data?.reduce((s, d) => s + d.count, 0) || 0

  return (
    <div className="rounded-xl border border-border bg-card p-5 h-full">
      <p className="text-sm font-medium text-foreground mb-1">Orders by status</p>
      <p className="text-xs text-muted-foreground mb-4">{total} total orders</p>
      {isLoading ? (
        <div className="h-52 rounded-lg bg-muted animate-pulse" />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={data || []} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={2}>
              {data?.map((entry) => (
                <Cell key={entry.status} fill={STATUS_HEX[entry.status as OrderStatus] || '#888'} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={(v) => <span className="text-xs capitalize text-muted-foreground">{v}</span>} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
