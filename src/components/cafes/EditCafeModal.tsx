'use client'
import { useState } from 'react'
import { X, Store, MapPin, Phone, Mail, Power, Upload, Loader2, FileText } from 'lucide-react'
import { useUpdateCafe, useUploadCafeLogo } from '@/hooks/useCafes'
import type { Cafe } from '@/types'

interface EditCafeModalProps {
  cafe: Cafe
  onClose: () => void
}

export function EditCafeModal({ cafe, onClose }: EditCafeModalProps) {
  const [formData, setFormData] = useState({
    name: cafe.name,
    location: cafe.location || '',
    contactNumber: cafe.contactNumber || '',
    email: cafe.email || '',
    gstin: cafe.gstin || '',
    isActive: cafe.isActive,
  })

  const { mutate: updateCafe, isPending: isUpdating } = useUpdateCafe()
  const { mutate: uploadLogo, isPending: isUploading } = useUploadCafeLogo()

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadLogo({ id: cafe._id, file })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateCafe(
      { id: cafe._id, data: formData },
      {
        onSuccess: onClose,
      }
    )
  }

  const isPending = isUpdating || isUploading

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" /> Edit Cafe Details
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Logo Section */}
          <div className="flex flex-col items-center gap-4 mb-2">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/40">
                {isUploading ? (
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                ) : cafe.logo ? (
                  <img src={cafe.logo} alt={cafe.name} className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-8 h-8 text-muted-foreground/40" />
                )}
              </div>
              <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                <Upload className="w-5 h-5 text-white" />
                <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} disabled={isUploading} />
              </label>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              {isUploading ? 'Uploading...' : 'Change Logo'}
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cafe Name</label>
            <div className="relative">
              {/* <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /> */}
              <input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Downtown Branch"
                className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Location</label>
            <div className="relative">
              {/* <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /> */}
              <input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Full address"
                className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">GSTIN Number</label>
            <div className="relative">
              {/* <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /> */}
              <input
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                placeholder="e.g. 32AAAAA1111A1Z1"
                className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Contact</label>
              <div className="relative">
                {/* <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /> */}
                <input
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  placeholder="+91..."
                  className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email</label>
              <div className="relative">
                {/* <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /> */}
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="cafe@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                className={`w-10 h-5 rounded-full transition-colors relative ${formData.isActive ? 'bg-green-500' : 'bg-muted'}`}
              >
                <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform ${formData.isActive ? 'translate-x-5' : ''}`} />
              </div>
              <span className="text-sm font-medium text-foreground">Cafe is active and accepting orders</span>
            </label>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
              style={{ background: '#d4a853', color: '#1a1713' }}
            >
              {isPending ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
