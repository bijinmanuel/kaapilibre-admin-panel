'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // Pre-fill remembered email if saved on this device
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('kl_admin_remember_email')
      if (savedEmail) {
        setValue('email', savedEmail)
        setRememberMe(true)
      }
    }
  }, [setValue])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = (await api.post('/auth/admin/login', data)) as any
      setUser(res.data.user, res.data.token)

      if (typeof window !== 'undefined') {
        if (rememberMe) {
          localStorage.setItem('kl_admin_remember_email', data.email)
        } else {
          localStorage.removeItem('kl_admin_remember_email')
        }
      }

      toast.success(`Welcome back, ${res.data.user.name || 'Admin'}!`)

      if (res.data.user.role === 'admin') {
        router.replace('/dashboard')
      } else if (res.data.user.role === 'subadmin') {
        router.replace('/orders')
      } else {
        router.replace('/unauthorized')
      }
    } catch (e: any) {
      toast.error(e.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex w-full overflow-x-hidden font-sans">
      {/* ─── LEFT PANEL: Dark Artisan Roastery Branding ───────────────────── */}
      <div
        style={{
          background:
            'radial-gradient(ellipse at 70% 50%, rgba(212, 168, 83, 0.12) 0%, rgba(26, 21, 15, 0.6) 45%, #0a0806 85%)',
        }}
        className="hidden lg:flex flex-col justify-between w-1/2 xl:w-[52%] relative p-12 xl:p-16 overflow-hidden border-r border-black/10 text-white"
      >
        {/* Soft Ambient Radiance */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-[#d4a853]/10 rounded-full blur-[130px] pointer-events-none" />

        {/* Botanical Hummingbird Artwork - Blended Seamlessly */}
        <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
          <div className="absolute right-0 bottom-0 w-[78%] h-[78%] opacity-65">
            <Image
              src="/brand/HUMMERS_W.png"
              alt="KaapiLibre Heritage Hummingbirds"
              fill
              sizes="50vw"
              priority
              className="object-contain object-bottom-right filter drop-shadow-[0_0_40px_rgba(212,168,83,0.2)]"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0806] via-transparent to-[#0a0806]/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0806] via-[#0a0806]/40 to-transparent" />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-11 h-11 relative rounded-2xl p-2 bg-gradient-to-b from-[#2a2216] to-[#120f0a] border border-[#d4a853]/35 shadow-lg flex items-center justify-center">
            <Image
              src="/brand/logo.png"
              alt="KaapiLibre Logo"
              width={34}
              height={34}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <p className="font-bold text-white text-lg tracking-tight leading-tight">KaapiLibre</p>
            <p className="text-xs text-[#d4a853] font-medium tracking-wide">Admin Panel</p>
          </div>
        </div>

        {/* Big Clean Statement */}
        <div className="relative z-10 max-w-md my-auto py-12">
          <blockquote className="text-4xl xl:text-5xl text-white leading-[1.2] tracking-tight">
            Old World Coffee: Ordinary Hands
          </blockquote>
        </div>

        {/* Minimal Footer */}
        <div className="relative z-10 text-xs text-white/35 font-light">
          Specialty Coffee Roasters
        </div>
      </div>

      {/* ─── RIGHT PANEL: Clean White Authentication with Glassmorphism ───── */}
      <div
        style={{
          background: 'linear-gradient(145deg, #ffffff 0%, #f7f5f2 50%, #f0ede6 100%)',
        }}
        className="flex-1 flex flex-col justify-between items-center p-6 sm:p-10 lg:p-14 relative overflow-y-auto text-gray-900 selection:bg-[#d4a853]/30 selection:text-gray-900"
      >
        {/* Soft Ambient Projection Light Behind the Glass Card */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] h-[500px] bg-[#d4a853]/8 rounded-full blur-[110px] pointer-events-none" />

        {/* Mobile Header (Hidden on Desktop) */}
        <div className="w-full max-w-[400px] lg:hidden flex items-center gap-3 pb-6 border-b border-gray-200/60">
          <div className="w-10 h-10 relative rounded-xl p-2 bg-[#1a1713] flex items-center justify-center shadow-sm">
            <Image
              src="/brand/logo.png"
              alt="KaapiLibre Logo"
              width={26}
              height={26}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-base leading-tight">KaapiLibre</p>
            <p className="text-xs text-[#b88628] font-medium">Admin Panel</p>
          </div>
        </div>

        {/* Top Spacer for vertical balance */}
        <div className="hidden lg:block" />

        {/* Centered Glassmorphic Projected Card */}
        <div className="w-full max-w-[400px] my-auto relative z-10">
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(255, 255, 255, 0.65) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(212, 168, 83, 0.35)',
              boxShadow:
                '0 24px 50px -12px rgba(30, 24, 15, 0.12), 0 8px 24px -4px rgba(0, 0, 0, 0.04), inset 0 1px 1px rgba(255, 255, 255, 0.95), 0 0 30px rgba(212, 168, 83, 0.08)',
            }}
            className="rounded-3xl p-8 sm:p-10 transition-shadow duration-300"
          >
            {/* Header */}
            <div className="mb-7">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-950 tracking-tight">
                Sign in
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1.5 leading-normal">
                Enter your credentials to access the admin portal
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <div
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                      color: '#b88628',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="admin@kaapilibre.com"
                    autoComplete="email"
                    style={{
                      paddingLeft: '44px',
                      paddingRight: '16px',
                      height: '46px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e0d8',
                      borderRadius: '12px',
                      color: '#111827',
                      fontSize: '14px',
                      width: '100%',
                      outline: 'none',
                    }}
                    className="login-input w-full placeholder:text-gray-400"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => toast.info('Please contact your administrator to reset credentials.')}
                    className="text-xs font-medium text-[#b88628] hover:text-[#976a17] hover:underline cursor-pointer"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <div
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                      color: '#b88628',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    {...register('password')}
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••••"
                    autoComplete="current-password"
                    style={{
                      paddingLeft: '44px',
                      paddingRight: '44px',
                      height: '46px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e0d8',
                      borderRadius: '12px',
                      color: '#111827',
                      fontSize: '14px',
                      width: '100%',
                      outline: 'none',
                    }}
                    className="login-input w-full placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      padding: '4px',
                      color: '#9ca3af',
                    }}
                    className="hover:!text-gray-700 transition-colors cursor-pointer"
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.password.message}</p>
                )}
              </div>

              {/* Remember Me */}
              <div className="pt-0.5">
                <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        backgroundColor: rememberMe ? '#d4a853' : '#ffffff',
                        border: rememberMe ? '1px solid #d4a853' : '1px solid #d1d5db',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {rememberMe && (
                        <svg
                          style={{ width: '10px', height: '10px', color: '#1a1713', strokeWidth: 3.5 }}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-600 font-medium group-hover:text-gray-900 transition-colors">
                    Remember me
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #dfb45e 0%, #d4a853 50%, #be9035 100%)',
                  color: '#1a1713',
                  fontWeight: 600,
                  fontSize: '15px',
                  boxShadow: '0 6px 18px rgba(212, 168, 83, 0.38)',
                }}
                className="w-full mt-3 transition-all flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#1a1713]" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="w-4 h-4 text-[#1a1713]" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Minimal Footer */}
          <p className="mt-8 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} KaapiLibre
          </p>
        </div>

        {/* Bottom Spacer */}
        <div className="hidden lg:block" />
      </div>
    </div>
  )
}
