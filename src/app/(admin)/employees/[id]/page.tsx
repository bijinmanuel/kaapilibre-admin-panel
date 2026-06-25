'use client'
import { useState, use, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  ArrowLeft, Edit2, Loader2, User, Mail, Phone, MapPin, Calendar, Briefcase,
  Building2, Shield, DollarSign, Clock, FileText, Trash2, Upload, Plus, ChevronLeft, ChevronRight
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  useEmployee,
  useEmployeeAttendance,
  useMarkAttendance,
  useUploadDocument,
  useDeleteDocument
} from '@/hooks/useEmployees'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { EditEmployeeModal } from '@/components/employees/EditEmployeeModal'
import type { EmployeeStatus, EmploymentType, AccessRole } from '@/types'

const STATUS_COLORS: Record<EmployeeStatus, { bg: string; text: string; border: string }> = {
  active: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/20' },
  inactive: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
  on_leave: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/20' },
  terminated: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20' },
}

const TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contractor: 'Contractor',
}

const ROLE_COLORS: Record<AccessRole, string> = {
  admin: 'text-red-400 border-red-500/20 bg-red-500/5',
  manager: 'text-blue-400 border-blue-500/20 bg-blue-500/5',
  staff: 'text-green-400 border-green-500/20 bg-green-500/5',
  viewer: 'text-gray-400 border-gray-500/20 bg-gray-500/5',
}

const ATTENDANCE_STATUSES = [
  { value: 'present', label: 'Present', color: 'bg-green-500', text: 'text-green-400' },
  { value: 'absent', label: 'Absent', color: 'bg-red-500', text: 'text-red-400' },
  { value: 'half_day', label: 'Half Day', color: 'bg-orange-500', text: 'text-orange-400' },
  { value: 'leave', label: 'On Leave', color: 'bg-purple-500', text: 'text-purple-400' },
]

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    return `${d.getFullYear()}-${month}` // YYYY-MM
  })

  // Attendance logging form states
  const [logDate, setLogDate] = useState(() => new Date().toISOString().split('T')[0])
  const [logStatus, setLogStatus] = useState('present')

  // Document upload states
  const [docName, setDocName] = useState('')
  const [docFile, setDocFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isEditing, setIsEditing] = useState(false)

  // API Hooks
  const { data: employee, isLoading: isEmpLoading } = useEmployee(id)
  const { data: attendanceData, isLoading: isAttLoading } = useEmployeeAttendance(id, currentMonth)

  const markAttendance = useMarkAttendance()
  const uploadDoc = useUploadDocument()
  const deleteDoc = useDeleteDocument()

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const [year, month] = currentMonth.split('-').map(Number)
    let newYear = year
    let newMonth = month

    if (direction === 'prev') {
      newMonth -= 1
      if (newMonth === 0) {
        newMonth = 12
        newYear -= 1
      }
    } else {
      newMonth += 1
      if (newMonth === 13) {
        newMonth = 1
        newYear += 1
      }
    }

    const monthStr = String(newMonth).padStart(2, '0')
    setCurrentMonth(`${newYear}-${monthStr}`)
  }

  const handleMarkAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await markAttendance.mutateAsync({ id, date: logDate, status: logStatus })
    } catch (err) {
      console.error(err)
    }
  }

  const handleDocUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!docFile || !docName.trim()) return
    try {
      await uploadDoc.mutateAsync({ id, file: docFile, documentName: docName.trim() })
      setDocName('')
      setDocFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteDoc = async (index: number) => {
    if (confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteDoc.mutateAsync({ id, docIndex: index })
      } catch (err) {
        console.error(err)
      }
    }
  }

  if (isEmpLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Employee not found.</p>
        <button onClick={() => router.back()} className="mt-4 inline-flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    )
  }

  // Generate monthly calendar grid
  const [year, month] = currentMonth.split('-').map(Number)
  const firstDayIndex = new Date(year, month - 1, 1).getDay() // 0 = Sunday, 1 = Monday, etc.
  const totalDays = new Date(year, month, 0).getDate()

  const calendarDays = []
  // Padding cells for previous month
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null)
  }
  // Days of the month
  for (let i = 1; i <= totalDays; i++) {
    calendarDays.push(i)
  }

  const getDayAttendance = (dayNum: number) => {
    if (!attendanceData?.records) return null
    const targetDateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
    return attendanceData.records.find((r: any) => r.date.split('T')[0] === targetDateStr)
  }

  return (
    <>
      <PageHeader
        title={employee.name}
        description={`Employee Management · ID: ${employee.employeeId}`}
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm font-semibold hover:bg-accent transition-colors"
            >
              <Edit2 className="w-4 h-4" /> Edit Profile
            </button>
            <button
              onClick={() => router.push('/employees')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to List
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT COLUMN: Profile info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden">
            {/* Header info */}
            <div className="flex flex-col items-center text-center pb-6 border-b border-border">
              <div className="w-24 h-24 rounded-2xl bg-muted overflow-hidden relative border border-border mb-4">
                {employee.image ? (
                  <Image src={employee.image} alt={employee.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                    <User className="w-10 h-10" />
                  </div>
                )}
              </div>
              <h3 className="text-lg font-bold text-foreground">{employee.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{employee.designation}</p>
              
              <div className="flex items-center gap-2 mt-4">
                <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[employee.status]?.bg} ${STATUS_COLORS[employee.status]?.text} ${STATUS_COLORS[employee.status]?.border}`}>
                  {employee.status.replace('_', ' ')}
                </span>
                <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-bold uppercase ${ROLE_COLORS[employee.accessRole]}`}>
                  {employee.accessRole}
                </span>
              </div>
            </div>

            {/* Details list */}
            <div className="py-6 space-y-4 text-sm border-b border-border">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Department</p>
                  <p className="font-semibold text-foreground mt-0.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground/60" />
                    {employee.department || 'General'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Employment Type</p>
                  <p className="font-semibold text-foreground mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground/60" />
                    {TYPE_LABELS[employee.employmentType]}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Monthly Salary</p>
                  <p className="font-semibold text-primary mt-0.5 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-primary/70" />
                    {formatCurrency(employee.salary)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Joining Date</p>
                  <p className="font-semibold text-foreground mt-0.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground/60" />
                    {new Date(employee.joiningDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </p>
                </div>
              </div>

              {employee.manager && (
                <div>
                  <p className="text-xs text-muted-foreground">Manager</p>
                  <p className="font-semibold text-foreground mt-0.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground/60" />
                    {employee.manager}
                  </p>
                </div>
              )}
            </div>

            {/* Contact details */}
            <div className="pt-6 space-y-3.5 text-sm">
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Contact Information</p>
              {employee.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground/70" />
                  <a href={`mailto:${employee.email}`} className="text-foreground hover:text-primary transition-colors">
                    {employee.email}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground/70" />
                <a href={`tel:${employee.phone}`} className="text-foreground hover:text-primary transition-colors">
                  {employee.phone}
                </a>
              </div>
              {employee.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground/70 mt-0.5" />
                  <p className="text-foreground leading-relaxed">{employee.address}</p>
                </div>
              )}
            </div>

            {/* Internal notes */}
            {employee.notes && (
              <div className="mt-6 p-4 rounded-xl bg-muted/30 border border-border/60">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Notes</p>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{employee.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Attendance & Documents */}
        <div className="lg:col-span-3 space-y-6">
          {/* Section: Attendance Tracker */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h4 className="text-base font-bold text-foreground">Attendance Calendar</h4>
                <p className="text-xs text-muted-foreground">Track employee check-ins and log history</p>
              </div>
              
              <div className="flex items-center gap-2 bg-muted/30 border border-border/80 rounded-xl px-2.5 py-1">
                <button onClick={() => handleMonthChange('prev')} className="p-1 hover:bg-accent rounded-lg transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold font-mono px-1">
                  {new Date(year, month - 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={() => handleMonthChange('next')} className="p-1 hover:bg-accent rounded-lg transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Summary statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Present', count: attendanceData?.summary?.present ?? 0, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
                { label: 'Absent', count: attendanceData?.summary?.absent ?? 0, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
                { label: 'Half Day', count: attendanceData?.summary?.halfDay ?? 0, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
                { label: 'On Leave', count: attendanceData?.summary?.leave ?? 0, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
              ].map((stat) => (
                <div key={stat.label} className={`border rounded-xl p-3 text-center ${stat.color}`}>
                  <p className="text-[10px] uppercase font-bold tracking-wider opacity-80">{stat.label}</p>
                  <p className="text-xl font-bold mt-1">{stat.count}</p>
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            {isAttLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="border border-border rounded-xl overflow-hidden mb-6">
                {/* Days of week */}
                <div className="grid grid-cols-7 bg-muted/40 border-b border-border text-center py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
                </div>
                {/* Days numbers */}
                <div className="grid grid-cols-7 gap-px bg-border">
                  {calendarDays.map((dayNum, idx) => {
                    if (dayNum === null) {
                      return <div key={`empty-${idx}`} className="bg-card min-h-[52px]" />
                    }
                    const att = getDayAttendance(dayNum)
                    const statusConfig = ATTENDANCE_STATUSES.find(s => s.value === att?.status)
                    
                    return (
                      <div
                        key={`day-${dayNum}`}
                        className="bg-card min-h-[52px] p-1.5 flex flex-col justify-between hover:bg-accent/20 transition-colors cursor-pointer"
                        onClick={() => {
                          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
                          setLogDate(dateStr)
                        }}
                      >
                        <span className="text-[10px] font-bold font-mono text-muted-foreground">{dayNum}</span>
                        {att && (
                          <div className={`mt-1 text-[9px] font-bold uppercase tracking-wider rounded-md py-0.5 px-1.5 text-center truncate ${statusConfig?.color}/10 ${statusConfig?.text}`}>
                            {statusConfig?.label}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Mark attendance form */}
            <form onSubmit={handleMarkAttendanceSubmit} className="p-4 border border-border/80 rounded-xl bg-muted/10 flex flex-col sm:flex-row items-end gap-4">
              <div className="flex-1 w-full space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Date to Log</label>
                <input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="w-full bg-card"
                  required
                />
              </div>
              <div className="flex-1 w-full space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Attendance Status</label>
                <select
                  value={logStatus}
                  onChange={(e) => setLogStatus(e.target.value)}
                  className="w-full bg-card"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="half_day">Half Day</option>
                  <option value="leave">On Leave</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={markAttendance.isPending}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                style={{ background: '#d4a853', color: '#1a1713' }}
              >
                {markAttendance.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                Log Day
              </button>
            </form>
          </div>

          {/* Section: Documents Locker */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h4 className="text-base font-bold text-foreground mb-1">Documents Locker</h4>
            <p className="text-xs text-muted-foreground mb-5">View credentials, contracts, and uploads</p>

            {/* Documents List */}
            <div className="space-y-3 mb-6">
              {employee.documents && employee.documents.length > 0 ? (
                employee.documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 border border-border rounded-xl hover:border-primary/30 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{doc.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Uploaded {formatDateTime(doc.uploadedAt)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => window.open(doc.url, '_blank')}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-border hover:bg-accent text-foreground transition-colors"
                      >
                        View File
                      </button>
                      <button
                        onClick={() => handleDeleteDoc(idx)}
                        disabled={deleteDoc.isPending}
                        className="p-1.5 rounded-lg border border-transparent hover:border-red-500/20 text-muted-foreground hover:text-red-500 hover:bg-red-500/5 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 border border-dashed border-border rounded-xl">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">No documents uploaded yet.</p>
                </div>
              )}
            </div>

            {/* Upload Document Form */}
            <form onSubmit={handleDocUploadSubmit} className="p-4 border border-border/80 rounded-xl bg-muted/10 space-y-4">
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Upload New Document</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Document Name</label>
                  <input
                    type="text"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    placeholder="e.g. Aadhaar Card, Contract"
                    className="w-full bg-card"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Select File</label>
                  <div className="relative">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                      className="hidden"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-4 py-2 bg-card border border-border rounded-lg text-xs font-semibold hover:bg-accent transition-colors flex items-center justify-between gap-2 h-9 text-muted-foreground"
                    >
                      <span className="truncate">{docFile ? docFile.name : 'Choose image or PDF...'}</span>
                      <Upload className="w-3.5 h-3.5 flex-shrink-0" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={uploadDoc.isPending || !docFile || !docName.trim()}
                  className="px-5 py-2.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  style={{ background: '#d4a853', color: '#1a1713' }}
                >
                  {uploadDoc.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      Upload File
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {isEditing && (
        <EditEmployeeModal
          employee={employee}
          onClose={() => setIsEditing(false)}
        />
      )}
    </>
  )
}
