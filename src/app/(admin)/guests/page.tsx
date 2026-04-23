'use client'
import { useState } from 'react'
import { Search, Mail, Users, CheckSquare, Square, Send, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import { toast } from 'sonner'

export default function GuestsPage() {
  const qc = useQueryClient()
  const [search,   setSearch]   = useState('')
  const [page,     setPage]     = useState(1)
  const [selected, setSelected] = useState<string[]>([])
  const [sending,  setSending]  = useState<string | null>(null)

  const { data, isLoading } = useQuery<{ data: any[]; meta: any }>({
    queryKey: ['guests', search, page],
    queryFn: async () => {
      const res = await api.get('/customers/guests', {
        params: { search: search || undefined, page, limit: 20 },
      }) as any
      return { data: res.data, meta: res.meta }
    },
  })

  const guests = data?.data ?? []
  const meta   = data?.meta

  // Single invite
  const sendInvite = useMutation({
    mutationFn: (id: string) => api.post(`/customers/guests/${id}/invite`),
    onSuccess: () => { toast.success('Invite email sent'); setSending(null) },
    onError: (e: Error) => { toast.error(e.message); setSending(null) },
  })

  // Bulk invite
  const bulkInvite = useMutation({
    mutationFn: (ids: string[]) => api.post('/customers/guests/bulk-invite', { ids }),
    onSuccess: (res: any) => {
      toast.success(`Invites sent to ${res?.data?.sent ?? selected.length} guests`)
      setSelected([])
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const toggleSelect = (id: string) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  const toggleAll = () =>
    setSelected(selected.length === guests.length ? [] : guests.map((g: any) => g._id))

  const allSelected = guests.length > 0 && selected.length === guests.length

  return (
    <div>
      <PageHeader
        title="Guest customers"
        description="Customers who ordered without creating an account"
        action={
          selected.length > 0 ? (
            <button
              onClick={() => bulkInvite.mutate(selected)}
              disabled={bulkInvite.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
              style={{ background: '#d4a853', color: '#1a1713' }}>
              {bulkInvite.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" />Sending...</>
                : <><Send className="w-4 h-4" />Send invite to {selected.length} selected</>}
            </button>
          ) : undefined
        }
      />

      {/* Info banner */}
      <div className="mb-5 rounded-xl border border-border bg-card p-4 flex items-start gap-3">
        <Users className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Send account activation invites</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Guest customers have ordered but not created an account. Sending an invite email lets them activate an account using their order number — no registration form needed.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search guests..." style={{ paddingLeft: '2.25rem' }} />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 w-10">
                  <button onClick={toggleAll} className="text-muted-foreground hover:text-foreground">
                    {allSelected ? <CheckSquare className="w-4 h-4" style={{ color: '#d4a853' }} /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
                {['Customer', 'Phone', 'Orders', 'Total spent', 'Since', 'Action'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-muted animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : guests.length > 0 ? guests.map((guest: any) => (
                <tr key={guest._id}
                  className={`border-b border-border last:border-0 transition-colors ${selected.includes(guest._id) ? 'bg-primary/5' : 'hover:bg-accent/30'}`}>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleSelect(guest._id)} className="text-muted-foreground hover:text-foreground">
                      {selected.includes(guest._id)
                        ? <CheckSquare className="w-4 h-4" style={{ color: '#d4a853' }} />
                        : <Square className="w-4 h-4" />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: 'rgba(212,168,83,0.1)', color: '#d4a853' }}>
                        {getInitials(guest.name)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{guest.name}</p>
                        <p className="text-xs text-muted-foreground">{guest.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{guest.phone || '—'}</td>
                  <td className="px-4 py-3 text-foreground">{guest.totalOrders}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{formatCurrency(guest.totalSpent)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(guest.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { setSending(guest._id); sendInvite.mutate(guest._id) }}
                      disabled={sending === guest._id && sendInvite.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-accent transition-colors text-foreground disabled:opacity-50">
                      {sending === guest._id && sendInvite.isPending
                        ? <><Loader2 className="w-3 h-3 animate-spin" />Sending...</>
                        : <><Mail className="w-3 h-3" />Send invite</>}
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No guest customers found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Page {meta.page} of {meta.totalPages} ({meta.total} guests)</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                className="p-1.5 rounded-md border border-border disabled:opacity-30 hover:bg-accent transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={page === meta.totalPages}
                className="p-1.5 rounded-md border border-border disabled:opacity-30 hover:bg-accent transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
