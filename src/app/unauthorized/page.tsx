'use client'
import Link from 'next/link'
import { ShieldOff } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export default function UnauthorizedPage() {
  const logout = useAuthStore((s) => s.logout)
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
      <div className="text-center max-w-sm px-6">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(239,68,68,0.1)' }}>
          <ShieldOff className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-xl font-semibold text-foreground mb-2">Access restricted</h1>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          You don&apos;t have permission to view this page. Contact your administrator if you think this is a mistake.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/dashboard"
            className="h-10 rounded-lg font-medium flex items-center justify-center text-sm"
            style={{ background: '#d4a853', color: '#1a1713' }}>
            Go to dashboard
          </Link>
          <button onClick={() => logout()}
            className="h-10 rounded-lg font-medium text-sm border border-border text-muted-foreground hover:text-foreground transition-colors">
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
