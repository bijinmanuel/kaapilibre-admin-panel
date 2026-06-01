'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Search, Users, UserPlus, UserMinus, TrendingDown, DollarSign, Mail, Phone, Edit2, Trash2, User, Briefcase, Eye, Building2, Shield } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useEmployees, useDeleteEmployee, useEmployeeAnalytics } from '@/hooks/useEmployees'
import { formatCurrency } from '@/lib/utils'
import { AddEmployeeModal } from '@/components/employees/AddEmployeeModal'
import { EditEmployeeModal } from '@/components/employees/EditEmployeeModal'
import type { Employee } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/10 text-green-500',
  on_leave: 'bg-yellow-500/10 text-yellow-500',
  inactive: 'bg-gray-500/10 text-gray-400',
  terminated: 'bg-red-500/10 text-red-500',
}

const TYPE_LABELS: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contractor: 'Contractor',
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'text-red-400',
  manager: 'text-blue-400',
  staff: 'text-green-400',
  viewer: 'text-gray-400',
}

export default function EmployeesPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [view, setView] = useState<'grid' | 'table'>('grid')

  const { data: employees, isLoading } = useEmployees({ search, status })
  const { data: analytics } = useEmployeeAnalytics()
  const { mutate: deleteEmployee } = useDeleteEmployee()

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this employee?')) {
      deleteEmployee(id)
    }
  }

  return (
    <>
      <PageHeader
        title="Employee Management"
        description="Manage your team, payroll, and organizational structure"
        action={
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: '#d4a853', color: '#1a1713' }}
          >
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        }
      />

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total Employees', value: analytics?.totalEmployees || 0, icon: Users, color: '#d4a853' },
          { label: 'New Hires', value: analytics?.newHiresThisMonth || 0, icon: UserPlus, color: '#22c55e' },
          { label: 'On Leave Today', value: analytics?.onLeaveToday || 0, icon: UserMinus, color: '#f59e0b' },
          { label: 'Turnover Rate', value: `${analytics?.turnoverRate || 0}%`, icon: TrendingDown, color: '#ef4444' },
          { label: 'Monthly Payroll', value: formatCurrency(analytics?.totalPayroll || 0), icon: DollarSign, color: '#8b5cf6' },
        ].map((card) => (
          <div key={card.label} className="bg-card border border-border rounded-xl p-5 relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg" style={{ background: `${card.color}15` }}>
                <card.icon className="w-4 h-4" style={{ color: card.color }} />
              </div>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{card.label}</p>
            <h3 className="text-xl font-bold text-foreground mt-1">{card.value}</h3>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, ID, designation, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2.5 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm min-w-[140px]">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="on_leave">On Leave</option>
          <option value="inactive">Inactive</option>
          <option value="terminated">Terminated</option>
        </select>
        <div className="flex bg-card border border-border rounded-xl overflow-hidden">
          <button onClick={() => setView('grid')}
            className={`px-4 py-2.5 text-xs font-bold transition-colors ${view === 'grid' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            Grid
          </button>
          <button onClick={() => setView('table')}
            className={`px-4 py-2.5 text-xs font-bold transition-colors ${view === 'table' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            Table
          </button>
        </div>
      </div>

      {/* Grid View */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6 animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-muted" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-full" />
                </div>
              </div>
            ))
          ) : employees && employees.length > 0 ? employees.map((emp) => (
            <div key={emp._id} className="bg-card border border-border rounded-2xl p-6 group transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-muted overflow-hidden relative flex-shrink-0 border border-border">
                    {emp.image ? (
                      <Image src={emp.image} alt={emp.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                        <User className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-sm">{emp.name}</h4>
                    <p className="text-[10px] text-muted-foreground font-mono">{emp.employeeId}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Briefcase className="w-3 h-3" /> {emp.designation}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${STATUS_COLORS[emp.status]}`}>
                    {emp.status.replace('_', ' ')}
                  </span>
                  <span className="text-[9px] text-muted-foreground">{TYPE_LABELS[emp.employmentType] || emp.employmentType}</span>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 py-3 border-y border-border/50 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1"><Building2 className="w-3 h-3" /> Department</span>
                  <span className="font-medium text-foreground">{emp.department || 'General'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1"><Shield className="w-3 h-3" /> Access</span>
                  <span className={`font-bold uppercase text-[10px] ${ROLE_COLORS[emp.accessRole] || ''}`}>{emp.accessRole}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Salary</span>
                  <span className="font-bold text-foreground">{formatCurrency(emp.salary)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Joined</span>
                  <span className="font-medium text-foreground">{new Date(emp.joiningDate).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-between">
                <div className="flex gap-1">
                  <a href={`tel:${emp.phone}`} className="p-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors">
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  {emp.email && (
                    <a href={`mailto:${emp.email}`} className="p-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors">
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <div className="flex gap-1">
                  <Link href={`/employees/${emp._id}`}
                    className="p-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors">
                    <Eye className="w-3.5 h-3.5" />
                  </Link>
                  <button onClick={() => setEditingEmployee(emp)}
                    className="p-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(emp._id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-16 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No employees found. Click &quot;Add Employee&quot; to get started.</p>
            </div>
          )}
        </div>
      )}

      {/* Table View */}
      {view === 'table' && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-border">
              <tr className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <th className="text-left px-4 py-3">Employee</th>
                <th className="text-left px-4 py-3">ID</th>
                <th className="text-left px-4 py-3">Department</th>
                <th className="text-left px-4 py-3">Role / Type</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Salary</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-4 py-4"><div className="h-4 bg-muted rounded w-full" /></td>
                  </tr>
                ))
              ) : employees?.map((emp) => (
                <tr key={emp._id} className="hover:bg-accent/30 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted overflow-hidden relative flex-shrink-0">
                        {emp.image ? (
                          <Image src={emp.image} alt={emp.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{emp.name}</p>
                        <p className="text-[10px] text-muted-foreground">{emp.designation}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">{emp.employeeId}</td>
                  <td className="px-4 py-3 text-xs text-foreground">{emp.department || 'General'}</td>
                  <td className="px-4 py-3">
                    <div>
                      <span className={`text-[10px] font-bold uppercase ${ROLE_COLORS[emp.accessRole]}`}>{emp.accessRole}</span>
                      <p className="text-[10px] text-muted-foreground">{TYPE_LABELS[emp.employmentType]}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${STATUS_COLORS[emp.status]}`}>
                      {emp.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-foreground">{formatCurrency(emp.salary)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/employees/${emp._id}`}
                        className="p-1.5 rounded hover:bg-primary/10 hover:text-primary transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <button onClick={() => setEditingEmployee(emp)}
                        className="p-1.5 rounded hover:bg-primary/10 hover:text-primary transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(emp._id)}
                        className="p-1.5 rounded hover:bg-red-500/10 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && <AddEmployeeModal onClose={() => setShowAdd(false)} />}
      {editingEmployee && (
        <EditEmployeeModal
          employee={editingEmployee}
          onClose={() => setEditingEmployee(null)}
        />
      )}
    </>
  )
}
