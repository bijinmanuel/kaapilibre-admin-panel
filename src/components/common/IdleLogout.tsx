'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'

const IDLE_TIME_LIMIT = 5 * 60 * 1000 // 5 minutes in milliseconds
const STORAGE_KEY = 'kl_last_activity'

export function IdleLogout() {
  const logout = useAuthStore((s) => s.logout)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleLogout = useCallback(async () => {
    if (isAuthenticated) {
      toast.error('Session Expired', {
        description: 'You have been logged out due to 5 minutes of inactivity for security.',
        duration: 8000,
      })
      localStorage.removeItem(STORAGE_KEY)
      await logout()
    }
  }, [logout, isAuthenticated])

  const resetTimer = useCallback((syncToStorage = true) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    if (isAuthenticated) {
      timeoutRef.current = setTimeout(handleLogout, IDLE_TIME_LIMIT)
      
      if (syncToStorage) {
        localStorage.setItem(STORAGE_KEY, Date.now().toString())
      }
    }
  }, [handleLogout, isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      return
    }

    // Set initial timer
    resetTimer(false) // Don't sync on mount to avoid extra storage writes

    // Listen for storage events from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        resetTimer(false) // Sync timer without writing back to storage
      }
    }

    // Events to track user activity in this tab
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ]

    const handleActivity = () => {
      resetTimer(true) // Activity in this tab, sync to other tabs
    }

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    window.addEventListener('storage', handleStorageChange)
    document.addEventListener('visibilitychange', handleActivity)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
      window.removeEventListener('storage', handleStorageChange)
      document.removeEventListener('visibilitychange', handleActivity)
    }
  }, [isAuthenticated, resetTimer])

  return null
}

