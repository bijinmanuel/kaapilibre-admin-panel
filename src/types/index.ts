export type Role = 'admin' | 'subadmin' | 'customer'
export type OrderStatus = 'pending' | 'confirmed' | 'roasting' | 'dispatched' | 'delivered' | 'cancelled' | 'completed'
export type WeightVariant = '100g' | '250g' | '500g'
export type GrindType = 'Whole Bean' | 'Coarse' | 'Medium' | 'Fine'
export type PaymentMethod = 'whatsapp' | 'website' | 'email' | 'cash' | 'upi' | 'card' | 'netbanking'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type ProductVariety = 'Arabica' | 'Robusta'
export type ProductProcess = 'Washed' | 'Natural' | 'Honey'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  isGuest?: boolean
}

export interface ProductImage {
  url: string
  publicId: string
  isPrimary: boolean
}

export interface StockVariant {
  qty: number
  reorderAt: number
}

export interface Product {
  _id: string
  name: string
  slug: string
  origin: string
  region: string
  variety: ProductVariety
  process: ProductProcess
  altitude: string
  roast: string
  flavourNotes: string[]
  story: string
  prices: Record<WeightVariant, number>
  stock: Record<WeightVariant, StockVariant>
  images: ProductImage[]
  badge?: string
  isActive: boolean
  totalSold: number
  createdAt: string
  updatedAt: string
}


export interface Payment {
  method: PaymentMethod
  status: PaymentStatus
  transactionId?: string
  gatewayOrderId?: string
  paidAt?: string
  amount: number
  notes?: string
}

export interface OrderItem {
  product: string
  name: string
  slug: string
  weight: WeightVariant
  grind: GrindType
  qty: number
  unitPrice: number
  subtotal: number
}

export interface StatusHistory {
  status: OrderStatus
  changedAt: string
  note?: string
}

export interface Order {
  _id: string
  orderNumber: string
  customer: { name: string; email: string; phone: string; userId?: string }
  items: OrderItem[]
  totalAmount: number
  status: OrderStatus
  statusHistory: StatusHistory[]
  payment: Payment
  shippingAddress: string
  notes?: string
  isRead: boolean
  createdAt: string
  updatedAt: string
}

export interface Customer {
  _id: string
  name: string
  email: string
  phone: string
  isGuest: boolean
  role: Role
  totalOrders: number
  totalSpent: number
  savedAddress?: string
  isActive: boolean
  createdAt: string
}

export interface ContactMessage {
  _id: string
  name: string
  email: string
  phone: string
  selectedProduct?: string
  message: string
  isRead: boolean
  convertedToOrder: boolean
  orderId?: string
  createdAt: string
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  meta?: PaginationMeta
}

export interface OverviewStats {
  totalOrders: number
  revenue: number
  customers: number
  lowStockCount: number
  pendingOrders: number
}

export interface RevenuePoint {
  _id: { year: number; month?: number; day?: number; week?: number }
  revenue: number
  orders: number
}

export interface StatusCount {
  status: OrderStatus
  count: number
}

export interface TopProduct {
  _id: string
  name: string
  slug: string
  unitsSold: number
  revenue: number
}

export type ComplaintStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type ComplaintCategory = 'product_quality' | 'wrong_item' | 'delivery' | 'payment' | 'packaging' | 'other'
export type ComplaintPriority = 'low' | 'medium' | 'high'

export interface ComplaintMessage {
  _id: string
  sender: 'customer' | 'admin'
  senderName: string
  message: string
  sentAt: string
}

export interface Complaint {
  _id: string
  ticketNumber: string
  customer: { userId: string; name: string; email: string }
  orderId?: string
  orderNumber?: string
  category: ComplaintCategory
  subject: string
  status: ComplaintStatus
  priority: ComplaintPriority
  messages: ComplaintMessage[]
  resolvedAt?: string
  resolvedBy?: string
  createdAt: string
  updatedAt: string
}

// Cafe Orders
export type CafeOrderStatus = 'pending' | 'completed' | 'cancelled'
export interface CafeOrderItem {
  name: string
  qty: number
  price: number
  subtotal: number
}

export type CafeCategory = 'Coffee Beans' | 'Other'

export interface CafeProduct {
  _id: string
  name: string
  category: CafeCategory
  price: number
  description?: string
  image?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Cafe {
  _id: string
  name: string
  location?: string
  contactNumber?: string
  email?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CafeOrder {
  _id: string
  orderNumber: string
  cafeId: string | Cafe
  items: CafeOrderItem[]
  totalAmount: number
  status: CafeOrderStatus
  paymentMethod: PaymentMethod
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CafeAnalytics {
  cafe: Cafe
  totalRevenue: number
  totalOrders: number
  monthlyStats: { month: string; amount: number; count: number }[]
  topMonth: { month: string; amount: number } | null
}

// Expenses
export type ExpenseCategory = 'Rent' | 'Salary' | 'Inventory' | 'Utility' | 'Marketing' | 'Maintenance' | 'Other'

export interface Expense {
  _id: string
  title: string
  amount: number
  category: ExpenseCategory
  date: string
  notes?: string
  receiptImage?: string
  createdAt: string
  updatedAt: string
}

export interface ExpenseStats {
  totalExpense: number
  byCategory: Record<ExpenseCategory, number>
  monthlyTrend: { month: string; amount: number }[]
}
