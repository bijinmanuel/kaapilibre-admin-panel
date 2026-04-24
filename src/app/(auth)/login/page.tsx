'use client'
import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff, Coffee, Loader2, ShieldCheck } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

// Dummy credentials for demo
const DEMO_CREDENTIALS = [
  { role: 'Admin', email: 'admin@kaapilibre.com', password: 'admin123456', color: '#d4a853' },
  { role: 'Subadmin', email: 'subadmin@kaapilibre.com', password: 'subadmin123456', color: '#60a5fa' },
]

export default function LoginPage() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await api.post('/auth/admin/login', data) as any
      setUser(res.data.user, res.data.token)
      console.log(res.data.user.role)
      toast.success(`Welcome back, ${res.data.user.name}!`)
      res.data.user.role == 'admin' ? router.replace('/dashboard') : res.data.user.role == 'subadmin' ? router.replace('/orders') : router.replace('/unauthorized')
    } catch (e: any) {
      toast.error(e.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (email: string, password: string) => {
    setValue('email', email)
    setValue('password', password)
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--brand-dark)' }}>
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden" style={{ background: '#131008' }}>
        {/* Background Image Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/brand/HUMMERS_W.png"
            alt="Branding Background"
            fill
            sizes="50vw"
            priority
            loading="eager"
            className="object-cover opacity-95 grayscale hover:grayscale-0 transition-all duration-700"
          />
          <div className="absolute inset-0 bg-[#131008]/40 backdrop-blur-[2px]" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 relative">
            <Image
              src="/brand/logo.png"
              alt="KaapiLibre Logo"
              fill
              sizes="40px"
              className="object-contain"
            />
          </div>
          <div>
            <p className="font-semibold text-white text-lg leading-tight">KaapiLibre</p>
            <p className="text-xs" style={{ color: '#d4a853' }}>Admin Panel</p>
          </div>
        </div>

        <div className="relative z-10">
          <blockquote className="text-3xl font-light text-white/80 leading-relaxed mb-6">
            "Every great cup starts with<br />
            <span style={{ color: '#d4a853' }}>great data.</span>"
          </blockquote>
          <p className="text-sm text-white/40">Manage your beans, orders, and customers in one place.</p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4">
          {['Orders Today', 'Products', 'Customers'].map((label, i) => (
            <div key={label} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-2xl font-semibold" style={{ color: '#d4a853' }}>{['24', '7', '142'][i]}</p>
              <p className="text-xs text-white/40 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 relative">
              <Image
                src="/brand/logo.png"
                alt="KaapiLibre Logo"
                fill
                sizes="36px"
                className="object-contain"
              />
            </div>
            <span className="font-semibold text-white">KaapiLibre Admin</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-white">Sign in</h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Enter your credentials to access the dashboard</p>
          </div>

          {/* Demo credentials */}
          <div className="mb-6 rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: '#d4a853' }} />
              <span className="text-xs font-medium" style={{ color: '#d4a853' }}>Demo credentials — click to fill</span>
            </div>
            <div className="space-y-2">
              {DEMO_CREDENTIALS.map((c) => (
                <button
                  key={c.role}
                  type="button"
                  onClick={() => fillDemo(c.email, c.password)}
                  className="w-full text-left rounded-lg px-3 py-2.5 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: `${c.color}20`, color: c.color }}>
                      {c.role}
                    </span>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>click to use →</span>
                  </div>
                  <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.email}</p>
                  <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>{c.password}</p>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Email</label>
              <input
                {...register('email')}
                type="email"
                placeholder="admin@kaapilibre.com"
                autoComplete="email"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
              />
              {errors.email && <p className="text-xs mt-1 text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs mt-1 text-red-400">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg font-medium flex items-center justify-center gap-2 transition-opacity disabled:opacity-60 mt-6"
              style={{ background: '#d4a853', color: '#1a1713' }}
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</> : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
