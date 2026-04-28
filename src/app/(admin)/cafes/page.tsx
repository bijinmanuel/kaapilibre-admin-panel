'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Store, MapPin, Phone, Mail, ChevronRight, MoreVertical } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useCafes } from '@/hooks/useCafes'
import { CreateCafeModal } from '@/components/cafes/CreateCafeModal'
import { useAuthStore } from '@/store/authStore'
import { EditCafeModal } from '@/components/cafes/EditCafeModal'
import type { Cafe } from '@/types'

export default function CafesPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { data: cafes, isLoading } = useCafes()
  const [showCreate, setShowCreate] = useState(false)
  const [editingCafe, setEditingCafe] = useState<Cafe | null>(null)

  return (
    <>
      <PageHeader
        title="Cafe Management"
        description="Manage your cafe locations and view performance"
        action={
          user?.role === 'admin' && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02]"
              style={{ background: '#d4a853', color: '#1a1713' }}
            >
              <Plus className="w-4 h-4" /> Add New Cafe
            </button>
          )
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-card border border-border animate-pulse" />
          ))
        ) : cafes && cafes.length > 0 ? (
          cafes.map((cafe) => (
            <div
              key={cafe._id}
              onClick={() => router.push(`/cafes/${cafe._id}`)}
              className="group bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                  <Store className="w-6 h-6" />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingCafe(cafe)
                  }}
                  className="p-1 hover:bg-accent rounded-md transition-colors"
                >
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <h3 className="text-lg font-bold text-foreground mb-4">{cafe.name}</h3>

              <div className="space-y-2 mb-6">
                {cafe.location && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" />
                    {cafe.location}
                  </div>
                )}
                {cafe.contactNumber && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="w-3.5 h-3.5" />
                    {cafe.contactNumber}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${cafe.isActive ? 'text-green-500' : 'text-red-500'}`}>
                  {cafe.isActive ? 'Active' : 'Inactive'}
                </span>
                <div className="flex items-center gap-1 text-xs font-medium text-primary group-hover:gap-2 transition-all">
                  View Analytics <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-card border border-border border-dashed rounded-2xl">
            <Store className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground">No cafes added yet</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 text-sm font-bold text-primary hover:underline"
            >
              Click here to add your first cafe
            </button>
          </div>
        )}
      </div>

      {showCreate && <CreateCafeModal onClose={() => setShowCreate(false)} />}
      {editingCafe && (
        <EditCafeModal
          cafe={editingCafe}
          onClose={() => setEditingCafe(null)}
        />
      )}
    </>
  )
}
