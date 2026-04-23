'use client'
import { cn, STATUS_COLORS } from '@/lib/utils'
import type { OrderStatus } from '@/types'

export function StatusBadge({ status }: { status: OrderStatus }) {
  const c = STATUS_COLORS[status]
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize', c.bg, c.text, c.border)}>
      {status}
    </span>
  )
}
