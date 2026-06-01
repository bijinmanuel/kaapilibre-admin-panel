'use client'
import { useState, useRef } from 'react'
import { X, Upload, Loader2, Briefcase, User } from 'lucide-react'
import { useAddEmployee, useUpdateEmployee, useUploadEmployeeImage } from '@/hooks/useEmployees'
import type { Employee, EmployeeStatus } from '@/types'

const DESIGNATIONS = [
  'Barista', 'Manager', 'Roaster', 'Sales Executive', 'Delivery',
  'Accountant', 'Store Assistant', 'Marketing', 'Operations', 'Other'
]

interface Props {
  employee?: Employee | null
  onClose: () => void
}

export function EmployeeModal({ employee, onClose }: Props) {
  const isEdit = !!employee

  const [name, setName] = useState(employee?.name || '')
  const [designation, setDesignation] = useState(employee?.designation || '')
  const [department, setDepartment] = useState(employee?.department || 'General')
  const [salary, setSalary] = useState(employee?.salary?.toString() || '')
  const [email, setEmail] = useState(employee?.email || '')
  const [phone, setPhone] = useState(employee?.phone || '')
  const [address, setAddress] = useState(employee?.address || '')
  const [joiningDate, setJoiningDate] = useState(
    employee?.joiningDate ? new Date(employee.joiningDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  )
  const [status, setStatus] = useState<EmployeeStatus>(employee?.status || 'active')
  const [imagePreview, setImagePreview] = useState<string | null>(employee?.image || null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)
  const { mutateAsync: createEmployee, isPending: creating } = useAddEmployee()
  const { mutateAsync: updateEmployee, isPending: updating } = useUpdateEmployee()
  const { mutateAsync: uploadImage, isPending: uploading } = useUploadEmployeeImage()

  const isPending = creating || updating || uploading

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data: any = {
        name: name.trim(),
        designation: designation.trim(),
        department: department.trim(),
        salary: parseFloat(salary),
        email: email.trim() || undefined,
        phone: phone.trim(),
        address: address.trim() || undefined,
        joiningDate: new Date(joiningDate),
        status,
      }

      if (isEdit && employee) {
        await updateEmployee({ id: employee._id, ...data })
        if (imageFile) {
          await uploadImage({ id: employee._id, file: imageFile })
        }
      } else {
        const res: any = await createEmployee(data)
        const newId = res?.data?._id
        if (imageFile && newId) {
          await uploadImage({ id: newId, file: imageFile })
        }
      }
      onClose()
    } catch {
      // error handled by hooks
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.78)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-card border border-border rounded-2xl shadow-2xl flex flex-col"
        style={{ width: '640px', maxWidth: '95vw', maxHeight: '92vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(212,168,83,0.15)' }}>
              <Briefcase className="w-4 h-4" style={{ color: '#d4a853' }} />
            </div>
            <div>
              <h2 className="font-semibold text-foreground text-sm">
                {isEdit ? 'Edit Employee' : 'Add Employee'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isEdit ? `Updating ${employee?.name}` : 'Register a new team member'}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Avatar Upload */}
          <div className="flex items-center gap-5">
            <div
              className="w-20 h-20 rounded-2xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/50 transition-colors relative group"
              onClick={() => fileRef.current?.click()}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-muted-foreground/40" />
              )}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload className="w-4 h-4 text-white" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Employee Photo</p>
              <p className="text-xs text-muted-foreground">Click to upload · JPG, PNG, WebP · Max 5MB</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </div>

          {/* Name & Designation */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Full Name *</label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Rajesh Kumar" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Designation *</label>
              <input
                list="designation-list"
                value={designation}
                onChange={e => setDesignation(e.target.value)}
                placeholder="e.g. Barista"
                required
              />
              <datalist id="designation-list">
                {DESIGNATIONS.map(d => <option key={d} value={d} />)}
              </datalist>
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Department</label>
            <input
              list="department-list"
              value={department}
              onChange={e => setDepartment(e.target.value)}
              placeholder="e.g. Operations"
            />
            <datalist id="department-list">
              {['General', 'Operations', 'Sales', 'Marketing', 'Finance', 'HR', 'Roasting', 'Cafe'].map(d => <option key={d} value={d} />)}
            </datalist>
          </div>

          {/* Salary & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Monthly Salary (₹) *</label>
              <input type="number" value={salary} onChange={e => setSalary(e.target.value)}
                placeholder="e.g. 25000" required min="0" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Phone *</label>
              <input value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+91 98765 43210" required />
            </div>
          </div>

          {/* Email & Joining Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="employee@email.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Joining Date *</label>
              <input type="date" value={joiningDate} onChange={e => setJoiningDate(e.target.value)} required />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">Status</label>
            <div className="flex gap-2">
              {([
                { id: 'active', label: 'Active', color: 'green' },
                { id: 'on_leave', label: 'On Leave', color: 'orange' },
                { id: 'inactive', label: 'Inactive', color: 'red' },
                { id: 'terminated', label: 'Terminated', color: 'gray' },
              ] as const).map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStatus(s.id)}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
                    status === s.id
                      ? s.color === 'green' ? 'border-green-500 bg-green-500/10 text-green-500'
                        : s.color === 'orange' ? 'border-orange-500 bg-orange-500/10 text-orange-500'
                        : s.color === 'gray' ? 'border-gray-500 bg-gray-500/10 text-gray-500'
                        : 'border-red-500 bg-red-500/10 text-red-500'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Address</label>
            <textarea
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Full address..."
              rows={2}
              style={{
                resize: 'vertical', width: '100%', padding: '0.5rem 0.75rem',
                background: 'transparent', border: '1px solid var(--border)', borderRadius: '0.5rem',
                fontSize: '0.875rem', color: 'var(--foreground)', outline: 'none'
              }}
            />
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-border flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-opacity"
              style={{ background: '#d4a853', color: '#1a1713' }}
            >
              {isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" />Processing…</>
                : isEdit ? 'Save Changes' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
