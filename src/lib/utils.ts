import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import type { OrderStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd MMM yyyy')
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd MMM yyyy, hh:mm a')
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  pending:    { bg: 'bg-yellow-500/10',  text: 'text-yellow-600 dark:text-yellow-400',  border: 'border-yellow-500/30' },
  confirmed:  { bg: 'bg-blue-500/10',    text: 'text-blue-600 dark:text-blue-400',      border: 'border-blue-500/30' },
  roasting:   { bg: 'bg-orange-500/10',  text: 'text-orange-600 dark:text-orange-400',  border: 'border-orange-500/30' },
  dispatched: { bg: 'bg-purple-500/10',  text: 'text-purple-600 dark:text-purple-400',  border: 'border-purple-500/30' },
  delivered:  { bg: 'bg-green-500/10',   text: 'text-green-600 dark:text-green-400',    border: 'border-green-500/30' },
  completed:  { bg: 'bg-green-500/10',   text: 'text-green-600 dark:text-green-400',    border: 'border-green-500/30' },
  cancelled:  { bg: 'bg-red-500/10',     text: 'text-red-600 dark:text-red-400',        border: 'border-red-500/30' },
}

export const STATUS_HEX: Record<string, string> = {
  pending:    '#EAB308',
  confirmed:  '#3B82F6',
  roasting:   '#F59E0B',
  dispatched: '#8B5CF6',
  delivered:  '#22C55E',
  completed:  '#22C55E',
  cancelled:  '#EF4444',
}

export const ORDER_STATUSES: OrderStatus[] = [
  'pending', 'confirmed', 'roasting', 'dispatched', 'delivered', 'completed', 'cancelled',
]

export function getNextStatuses(current: OrderStatus): OrderStatus[] {
  const flow: Record<OrderStatus, OrderStatus[]> = {
    pending:    ['confirmed', 'cancelled'],
    confirmed:  ['roasting', 'cancelled'],
    roasting:   ['dispatched', 'cancelled'],
    dispatched: ['delivered', 'cancelled'],
    delivered:  ['completed'],
    completed:  [],
    cancelled:  [],
  }
  return flow[current] || []
}
