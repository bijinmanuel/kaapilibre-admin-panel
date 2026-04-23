import { create } from 'zustand'
import { api, setToken, removeToken, getToken } from '@/lib/api'
import type { User, Role } from '@/types'

const PERMISSIONS: Record<string, string[]> = {
  admin: ['dashboard', 'orders', 'products', 'customers', 'inventory', 'contact', 'analytics', 'payments', 'guests', 'complaints', 'blog', 'settings', 'cafe-orders', 'expenses', 'cafe', 'cafe-products'],
  subadmin: ['orders', 'products', 'inventory', 'contact', 'complaints', 'blog', 'cafe-orders', 'cafe', 'cafe-products'],
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  fetchMe: () => Promise<void>
  setUser: (user: User, token?: string) => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  fetchMe: async () => {
    // If no token in storage, skip the API call — not logged in
    const token = getToken()
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false })
      return
    }
    try {
      set({ isLoading: true })
      const res = await api.get('/auth/me') as any
      const user = res.data
      set({ user, isAuthenticated: true, isLoading: false })
    } catch {
      removeToken()
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  setUser: (user: User, token?: string) => {
    if (token) setToken(token)
    set({ user, isAuthenticated: true })
  },

  logout: async () => {
    try { await api.post('/auth/logout') } catch { }
    removeToken()
    set({ user: null, isAuthenticated: false })
    if (typeof window !== 'undefined') window.location.href = '/login'
  },
}))

export function useIsAdmin() {
  const user = useAuthStore((s) => s.user)
  return user?.role === 'admin'
}

export function useCanAccess(feature: string) {
  const user = useAuthStore((s) => s.user)
  if (!user) return false
  const role = user.role as string
  return PERMISSIONS[role]?.includes(feature) ?? false
}

export function useUserRole(): Role | null {
  return useAuthStore((s) => s.user?.role ?? null)
}
