export type Role = 'admin' | 'subadmin' | 'customer'
export type OrderStatus = 'pending' | 'confirmed' | 'roasting' | 'dispatched' | 'delivered' | 'cancelled' | 'completed'
export type WeightVariant = '250g' | '500g' | '1kg'
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
  blend: string
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
  logo?: string
  isActive: boolean
  region: 'Kerala' | 'Bangalore' | 'Hyderabad'
  status: 'active' | 'trial' | 'approached' | 'not_responded' | 'dropped_off'
  lastContactedAt?: string
  targetBeans?: string[]
  notes?: string
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
  paymentStatus: 'pending' | 'paid'
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CafeAnalytics {
  cafe: Cafe
  totalRevenue: number
  totalPaid: number
  totalPending: number
  totalOrders: number
  monthlyStats: {
    month: string;
    amount: number;
    paidAmount: number;
    pendingAmount: number;
    count: number
  }[]
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
  stats: any[]
  totalAmount: number
  monthsList: any[]
}

// Employees
export type EmployeeStatus = 'active' | 'inactive' | 'on_leave' | 'terminated'
export type EmploymentType = 'full_time' | 'part_time' | 'contractor'
export type AccessRole = 'admin' | 'manager' | 'staff' | 'viewer'

export interface EmployeeDocument {
  name: string
  url: string
  uploadedAt: string
}

export interface AttendanceRecord {
  date: string
  status: 'present' | 'absent' | 'half_day' | 'leave'
}

export interface LeaveBalance {
  casual: number
  sick: number
  earned: number
}

export interface Employee {
  _id: string
  employeeId: string
  name: string
  designation: string
  department: string
  employmentType: EmploymentType
  accessRole: AccessRole
  salary: number
  email?: string
  phone: string
  address?: string
  joiningDate: string
  manager?: string
  image?: string
  documents?: EmployeeDocument[]
  attendance: AttendanceRecord[]
  leaveBalance: LeaveBalance
  status: EmployeeStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface EmployeeAnalytics {
  totalEmployees: number
  activeCount: number
  onLeaveToday: number
  terminatedCount: number
  newHiresThisMonth: number
  turnoverRate: number
  totalPayroll: number
  departmentBreakdown: { _id: string; count: number; totalSalary: number }[]
  typeBreakdown: { _id: string; count: number }[]
}

export interface PerformanceInsightsData {
  summary: {
    currentRevenue: number
    prevRevenue: number
    revChangePercent: number
    currentOrders: number
    prevOrders: number
    ordersChange: number
    slowCafesCount: number
  }
  regionBreakdown: {
    region: string
    currentRevenue: number
    prevRevenue: number
    currentOrders: number
    prevOrders: number
    revenueGap: number
    rootCauseTag: 'Order volume drop' | 'Bean mix shift' | 'Cafe churned' | 'New cafe not yet ordering'
  }[]
  slowCafes: {
    cafeId: string
    name: string
    logo?: string
    region: string
    currentOrders: number
    prevOrders: number
    currentAvgOrderValue: number
    prevAvgOrderValue: number
    revenueGap: number
    lastOrderDate?: string
    isFlaggedNoOrder: boolean
    aiActions: string[]
  }[]
  recoveryEstimate: {
    potentialRecovery: number
    recoveredTotalRevenue: number
  }
}

export interface CafeAcquisitionData {
  funnel: {
    approached: number
    trial: number
    regular: number
    approachedToTrialRate: number
    trialToRegularRate: number
  }
  leads: Cafe[]
  gapAnalysis: {
    approachedThisMonth: number
    approachedLastMonth: number
    approachedChange: number
    untappedRegion: string
    untappedCount: number
    bottleneckStage: string
  }
  aiOutreach: {
    cafeId: string
    name: string
    region: string
    recommendedSubject: string
    recommendedBody: string
    recommendedOffer: string
  }[]
  overallStrategy: string[]
}

export interface SalesIntelligenceData {
  beansPerformance: {
    name: string
    currentQty: number
    prevQty: number
    currentRevenue: number
    prevRevenue: number
    trend: 'up' | 'down' | 'flat'
    isSlowMoving: boolean
  }[]
  customerBehavior: {
    retail: {
      avgOrderValue: number
      repeatOrderRate: number
      preferredBeans: string[]
    }
    cafes: {
      increased: { name: string; change: number }[]
      reduced: { name: string; change: number }[]
      silent: { name: string; days: number }[]
    }
  }
  regionSales: {
    region: string
    currentRevenue: number
    prevRevenue: number
    trend: 'growing' | 'flat' | 'dropped'
    popularBeans: string[]
  }[]
  healthScores: {
    cafeId: string
    name: string
    logo?: string
    region: string
    score: 'Healthy' | 'At Risk' | 'Churning'
    volumeTrend: number
    orderFrequencyDays: number
    aiSaveAction: string
  }[]
  aiPromotions: string[]
}
