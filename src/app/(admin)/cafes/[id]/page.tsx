'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Store, TrendingUp, ShoppingBag, Calendar,
  ArrowUpRight, Clock, Star, MapPin, Phone, FileText
} from 'lucide-react'
import Link from 'next/link'
import { useCafeOrders } from '@/hooks/useCafeOrders'
import { ConsolidatedCafeInvoiceModal } from '@/components/invoice/ConsolidatedCafeInvoiceModal'
import { format } from 'date-fns'
import { PageHeader } from '@/components/layout/PageHeader'
import { useCafeAnalytics } from '@/hooks/useCafes'
import { formatCurrency } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line
} from 'recharts'
import { EditCafeModal } from '@/components/cafes/EditCafeModal'
import { Settings } from 'lucide-react'

export default function CafeDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: analytics, isLoading } = useCafeAnalytics(id as string)
  const [mounted, setMounted] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])
  const [showConsolidatedModal, setShowConsolidatedModal] = useState(false)
  const [orderPaymentStatusFilter, setOrderPaymentStatusFilter] = useState<string>('all')
  const [orderMonthFilter, setOrderMonthFilter] = useState<string>('all')

  const { data: ordersData, isLoading: isLoadingOrders } = useCafeOrders({
    cafeId: id as string,
    limit: 100,
  } as any)

  const orders = ordersData?.data || []

  // Extract unique month/year from orders for month dropdown filter
  const months = Array.from(
    new Set(
      orders.map(o => format(new Date(o.createdAt), 'yyyy-MM'))
    )
  ).sort().reverse()

  const filteredOrders = orders.filter(o => {
    const matchesPaymentStatus = orderPaymentStatusFilter === 'all' || o.paymentStatus === orderPaymentStatusFilter
    const matchesMonth = orderMonthFilter === 'all' || format(new Date(o.createdAt), 'yyyy-MM') === orderMonthFilter
    return matchesPaymentStatus && matchesMonth
  })

  const handleToggleSelectAll = () => {
    const allFilteredIds = filteredOrders.map(o => o._id)
    const areAllSelected = allFilteredIds.every(id => selectedOrderIds.includes(id))

    if (areAllSelected) {
      setSelectedOrderIds(prev => prev.filter(id => !allFilteredIds.includes(id)))
    } else {
      setSelectedOrderIds(prev => Array.from(new Set([...prev, ...allFilteredIds])))
    }
  }

  const handleToggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    )
  }

  const handleSelectUnpaid = () => {
    const unpaidIds = orders
      .filter(o => o.paymentStatus === 'pending' && o.status === 'completed')
      .map(o => o._id)
    setSelectedOrderIds(unpaidIds)
  }

  const getBillingPeriodLabel = (selectedOrdersList: typeof orders) => {
    if (selectedOrdersList.length === 0) return ''
    const dates = selectedOrdersList.map(o => new Date(o.createdAt))
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))

    const minMonth = format(minDate, 'MMM yyyy')
    const maxMonth = format(maxDate, 'MMM yyyy')

    if (minMonth === maxMonth) {
      return format(minDate, 'MMMM yyyy')
    }
    return `${minMonth} - ${maxMonth}`
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  if (isLoading || !mounted) return <div className="p-8 animate-pulse text-muted-foreground">Loading analytics...</div>
  if (!analytics) return <div className="p-8 text-red-500">Analytics not found</div>

  const { cafe, totalRevenue, totalPaid, totalPending, totalOrders, monthlyStats, topMonth } = analytics

  return (
    <>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Cafes
      </button>

      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center overflow-hidden">
              {cafe.logo ? (
                <img src={cafe.logo} alt={cafe.name} className="w-full h-full object-cover" />
              ) : (
                <Store className="w-5 h-5 text-primary" />
              )}
            </div>
            {cafe.name}
          </div>
        }
        description="Detailed performance and sales analytics"
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowEdit(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border text-sm font-medium hover:bg-accent transition-all"
            >
              <Settings className="w-4 h-4" /> Edit Cafe
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-500 text-xs font-bold uppercase tracking-wider h-fit">
              <Clock className="w-3.5 h-3.5" /> Live Tracking
            </div>
          </div>
        }
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
          </div>
          <h3 className="text-2xl font-bold text-foreground">{formatCurrency(totalRevenue)}</h3>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-sm text-muted-foreground">Received (Paid)</p>
          </div>
          <h3 className="text-2xl font-bold text-foreground">{formatCurrency(totalPaid)}</h3>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <Clock className="w-5 h-5" />
            </div>
            <p className="text-sm text-muted-foreground">Pending (Due)</p>
          </div>
          <h3 className="text-2xl font-bold text-foreground">{formatCurrency(totalPending)}</h3>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <p className="text-sm text-muted-foreground">Total Orders</p>
          </div>
          <h3 className="text-2xl font-bold text-foreground">{totalOrders}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="text-lg font-bold text-foreground">Sales Performance</h4>
              <p className="text-sm text-muted-foreground">Month-by-month revenue growth</p>
            </div>
          </div>

          <div className="h-[300px] w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={100}>
              <BarChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#888' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#888' }}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <Tooltip
                  contentStyle={{ background: '#1a1713', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  cursor={{ fill: 'rgba(212, 168, 83, 0.05)' }}
                />
                <Bar
                  dataKey="amount"
                  name="Total Invoiced"
                  fill="#d4a853"
                  radius={[6, 6, 0, 0]}
                  barSize={30}
                  animationDuration={1500}
                />
                <Bar
                  dataKey="paidAmount"
                  name="Actually Paid"
                  fill="#22c55e"
                  radius={[6, 6, 0, 0]}
                  barSize={30}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cafe Info */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6"> Cafe Details</h4>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="p-2 rounded-lg bg-accent text-muted-foreground h-fit">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Address</p>
                  <p className="text-sm font-medium text-foreground">{cafe.location || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="p-2 rounded-lg bg-accent text-muted-foreground h-fit">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Contact Number</p>
                  <p className="text-sm font-medium text-foreground">{cafe.contactNumber || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="p-2 rounded-lg bg-accent text-muted-foreground h-fit">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">GSTIN Number</p>
                  <p className="text-sm font-medium text-foreground">{cafe.gstin || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden group">
            <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Performance Summary</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This cafe has generated a total of <span className="text-primary font-bold">{formatCurrency(totalRevenue)}</span> across
              <span className="text-primary font-bold"> {totalOrders}</span> orders.
              The most successful month was <span className="text-primary font-bold">{topMonth?.month}</span>.
            </p>
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
              <Store className="w-24 h-24" />
            </div>
          </div>
        </div>
      </div>

      {/* Cafe Orders & Invoicing Section */}
      <div className="bg-card border border-border rounded-2xl p-8 mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h4 className="text-lg font-bold text-foreground">Orders & Consolidated Invoicing</h4>
            <p className="text-sm text-muted-foreground">Select multiple orders to generate a single consolidated invoice (e.g. for month-end payments).</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectUnpaid}
              className="px-4 py-2 rounded-lg bg-accent border border-border text-sm font-medium hover:bg-accent/80 transition-colors"
            >
              Select Unpaid Completed
            </button>
            <button
              onClick={() => setShowConsolidatedModal(true)}
              disabled={selectedOrderIds.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:pointer-events-none"
              style={{ background: '#d4a853', color: '#1a1713' }}
            >
              <FileText className="w-4 h-4" /> Generate Invoice ({selectedOrderIds.length})
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6 bg-muted/20 p-4 rounded-xl border border-border">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Month</label>
            <select
              value={orderMonthFilter}
              onChange={e => setOrderMonthFilter(e.target.value)}
              className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Months</option>
              {months.map(m => (
                <option key={m} value={m}>
                  {format(new Date(m + '-02'), 'MMMM yyyy')}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Payment Status</label>
            <select
              value={orderPaymentStatusFilter}
              onChange={e => setOrderPaymentStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoadingOrders ? (
            <div className="py-12 text-center text-muted-foreground animate-pulse">Loading orders...</div>
          ) : filteredOrders.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4 w-12">
                    <input
                      type="checkbox"
                      checked={filteredOrders.length > 0 && filteredOrders.every(o => selectedOrderIds.includes(o._id))}
                      onChange={handleToggleSelectAll}
                      className="rounded border-border text-primary focus:ring-primary/30 w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4">Order Number</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.map(order => {
                  const isSelected = selectedOrderIds.includes(order._id);
                  return (
                    <tr
                      key={order._id}
                      className={`text-sm hover:bg-muted/30 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOrder(order._id)}
                          className="rounded border-border text-primary focus:ring-primary/30 w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-primary">
                        <Link href={`/cafe-orders/${order._id}`} className="hover:underline">
                          {order.orderNumber}
                        </Link>
                        {order.invoiceNumber && (
                          <div className="text-[10px] text-muted-foreground font-sans font-normal mt-0.5" title="Consolidated Invoice Number">
                            {order.invoiceNumber}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {format(new Date(order.createdAt), 'dd MMM yyyy, hh:mm a')}
                      </td>
                      <td className="py-3 px-4 text-xs font-medium max-w-[250px] truncate" title={order.items.map(i => `${i.qty}x ${i.name}`).join(', ')}>
                        {order.items.map(i => `${i.qty}x ${i.name}`).join(', ')}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-foreground">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${order.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                          order.status === 'cancelled' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'
                          }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${order.paymentStatus === 'paid' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'
                          }`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-muted-foreground border border-dashed border-border rounded-xl">
              <ShoppingBag className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p>No orders found matching filters.</p>
            </div>
          )}
        </div>
      </div>

      {showEdit && analytics?.cafe && (
        <EditCafeModal
          cafe={analytics.cafe}
          onClose={() => setShowEdit(false)}
        />
      )}

      {showConsolidatedModal && (
        <ConsolidatedCafeInvoiceModal
          cafe={cafe}
          orders={orders.filter(o => selectedOrderIds.includes(o._id))}
          billingPeriod={getBillingPeriodLabel(orders.filter(o => selectedOrderIds.includes(o._id)))}
          onClose={() => setShowConsolidatedModal(false)}
        />
      )}
    </>
  )
}
