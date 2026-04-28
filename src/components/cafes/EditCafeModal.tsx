'use client'
import { useState } from 'react'
import { X, Store, MapPin, Phone, Mail, Power } from 'lucide-react'
import { useUpdateCafe } from '@/hooks/useCafes'
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
    isActive: cafe.isActive,
  })

  const { mutate: updateCafe, isPending } = useUpdateCafe()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateCafe(
      { id: cafe._id, data: formData },
      {
        onSuccess: onClose,
      }
    )
  }

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
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cafe Name</label>
            <div className="relative">
              <input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Downtown Branch"
                className="w-full px-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Location</label>
            <div className="relative">
              <input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Full address"
                className="w-full px-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Contact</label>
              <div className="relative">
                <input
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  placeholder="+91..."
                  className="w-full px-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="cafe@example.com"
                  className="w-full px-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
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
