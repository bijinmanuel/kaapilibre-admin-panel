'use client'
import { useState, useRef } from 'react'
import { X, User, Briefcase, DollarSign, Mail, Phone, MapPin, Calendar, Camera, Building2, Shield, Clock, Upload, Loader2 } from 'lucide-react'
import { useAddEmployee, useUploadEmployeeImage } from '@/hooks/useEmployees'
import type { EmployeeStatus, EmploymentType, AccessRole } from '@/types'

export function AddEmployeeModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    department: '',
    employmentType: 'full_time' as EmploymentType,
    accessRole: 'staff' as AccessRole,
    salary: '',
    email: '',
    phone: '',
    address: '',
    manager: '',
    joiningDate: new Date().toISOString().split('T')[0],
    status: 'active' as EmployeeStatus,
    notes: '',
  })

  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const { mutateAsync: addEmployee } = useAddEmployee()
  const { mutateAsync: uploadImage, isPending: uploading } = useUploadEmployeeImage()
  const [submitting, setSubmitting] = useState(false)

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
    setSubmitting(true)
    try {
      const res: any = await addEmployee({
        ...formData,
        salary: parseFloat(formData.salary),
      })
      const newId = res?.data?._id
      if (imageFile && newId) {
        await uploadImage({ id: newId, file: imageFile })
      }
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const set = (key: string, val: string) => setFormData(p => ({ ...p, [key]: val }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <h3 className="text-xl font-bold text-foreground">Add New Employee</h3>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Section: Personal Info */}
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-4">Personal Information</p>

          {/* Avatar Upload */}
          <div className="flex items-center gap-5 mb-6">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input required value={formData.name} onChange={(e) => set('name', e.target.value)}
                  placeholder="John Doe" className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="email" value={formData.email} onChange={(e) => set('email', e.target.value)}
                  placeholder="john@example.com" className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input required value={formData.phone} onChange={(e) => set('phone', e.target.value)}
                  placeholder="+91 ..." className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={formData.address} onChange={(e) => set('address', e.target.value)}
                  placeholder="Street address..." className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
              </div>
            </div>
          </div>

          {/* Section: Job Details */}
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-4">Job Details</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Designation *</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input required value={formData.designation} onChange={(e) => set('designation', e.target.value)}
                  placeholder="Senior Barista" className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Department</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={formData.department} onChange={(e) => set('department', e.target.value)}
                  placeholder="Operations" className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Manager</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={formData.manager} onChange={(e) => set('manager', e.target.value)}
                  placeholder="Manager name" className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Employment Type</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select value={formData.employmentType} onChange={(e) => set('employmentType', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm appearance-none">
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                  <option value="contractor">Contractor</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Access Role</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select value={formData.accessRole} onChange={(e) => set('accessRole', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm appearance-none">
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Hire Date *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input required type="date" value={formData.joiningDate} onChange={(e) => set('joiningDate', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
              </div>
            </div>
          </div>

          {/* Section: Compensation */}
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-4">Compensation</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Monthly Salary *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input required type="number" value={formData.salary} onChange={(e) => set('salary', e.target.value)}
                  placeholder="0.00" className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-sm border border-border hover:bg-accent transition-all">
              Cancel
            </button>
            <button type="submit" disabled={submitting || uploading}
              className="flex-1 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
              style={{ background: '#d4a853', color: '#1a1713' }}>
              {(submitting || uploading) ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {submitting ? 'Adding...' : 'Uploading Image...'}
                </>
              ) : (
                'Add Employee'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
