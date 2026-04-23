'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, Sun, Moon, LogOut, UserPlus, Trash2, KeyRound, Pencil } from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import { getInitials, formatDate } from '@/lib/utils'

// ── Schemas ──────────────────────────────────────────────────────────────────
const changePassSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword:     z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string().min(1, 'Required'),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match", path: ['confirmPassword'],
})

const createStaffSchema = z.object({
  name:            z.string().min(2, 'At least 2 characters'),
  email:           z.string().email('Enter a valid email'),
  phone:           z.string().min(7, 'Enter a valid phone number'),
  password:        z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string().min(1, 'Required'),
  role:            z.enum(['subadmin', 'admin']),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match", path: ['confirmPassword'],
})

const editStaffSchema = z.object({
  name:  z.string().min(2, 'At least 2 characters'),
  phone: z.string().min(7, 'Enter a valid phone number'),
  role:  z.enum(['subadmin', 'admin']),
})

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'At least 8 characters'),
})

type ChangePassData  = z.infer<typeof changePassSchema>
type CreateStaffData = z.infer<typeof createStaffSchema>
type EditStaffData   = z.infer<typeof editStaffSchema>
type ResetPassData   = z.infer<typeof resetPasswordSchema>

// ── Reusable password input ───────────────────────────────────────────────────
function PwdInput({ label, error, show, toggle, reg }: {
  label: string; error?: string; show: boolean; toggle: () => void; reg: any
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-1.5">{label}</label>
      <div className="relative">
        <input type={show ? 'text' : 'password'} {...reg} style={{ paddingRight: '2.5rem' }} />
        <button type="button" onClick={toggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user, logout } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const qc = useQueryClient()
  const isAdmin = user?.role === 'admin'

  // change-password form visibility
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew,     setShowNew]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // staff panel states
  const [showCreateForm,  setShowCreateForm]  = useState(false)
  const [editTarget,      setEditTarget]      = useState<any>(null)   // staff being edited
  const [resetTarget,     setResetTarget]     = useState<any>(null)   // staff getting pw reset
  const [deleteTarget,    setDeleteTarget]    = useState<string | null>(null)

  // password visibility for create form
  const [showCreatePw,    setShowCreatePw]    = useState(false)
  const [showCreateConf,  setShowCreateConf]  = useState(false)
  const [showResetPw,     setShowResetPw]     = useState(false)

  // ── Change own password ──────────────────────────────────────────────────
  const {
    register: regPass,
    handleSubmit: handlePass,
    reset: resetPass,
    formState: { errors: passErrors, isSubmitting: passSubmitting },
  } = useForm<ChangePassData>({ resolver: zodResolver(changePassSchema) })

  const onChangePassword = async (data: ChangePassData) => {
    try {
      await api.patch('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword:     data.newPassword,
      })
      toast.success('Password changed — signing you out...')
      resetPass()
      setTimeout(() => logout(), 2000)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  // ── Fetch staff list ─────────────────────────────────────────────────────
  const { data: staffList, isLoading: staffLoading } = useQuery<any[]>({
    queryKey: ['staff'],
    queryFn: async () => {
      const res = await api.get('/staff') as any
      return res.data || []
    },
    enabled: isAdmin,
  })

  // ── Create staff ─────────────────────────────────────────────────────────
  const {
    register: regCreate,
    handleSubmit: handleCreate,
    reset: resetCreate,
    formState: { errors: createErrors },
  } = useForm<CreateStaffData>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: { role: 'subadmin' },
  })

  const createStaff = useMutation({
    mutationFn: (data: CreateStaffData) =>
      api.post('/staff', {
        name: data.name, email: data.email,
        phone: data.phone, password: data.password, role: data.role,
      }),
    onSuccess: () => {
      toast.success('Staff account created')
      qc.invalidateQueries({ queryKey: ['staff'] })
      setShowCreateForm(false)
      resetCreate()
    },
    onError: (e: any) => toast.error(e.message),
  })

  // ── Edit staff ───────────────────────────────────────────────────────────
  const {
    register: regEdit,
    handleSubmit: handleEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<EditStaffData>({ resolver: zodResolver(editStaffSchema) })

  const openEdit = (staff: any) => {
    setEditTarget(staff)
    resetEdit({ name: staff.name, phone: staff.phone, role: staff.role })
  }

  const updateStaff = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditStaffData }) =>
      api.patch(`/staff/${id}`, data),
    onSuccess: () => {
      toast.success('Staff updated')
      qc.invalidateQueries({ queryKey: ['staff'] })
      setEditTarget(null)
    },
    onError: (e: any) => toast.error(e.message),
  })

  // ── Reset staff password ─────────────────────────────────────────────────
  const {
    register: regReset,
    handleSubmit: handleReset,
    reset: resetResetForm,
    formState: { errors: resetErrors },
  } = useForm<ResetPassData>({ resolver: zodResolver(resetPasswordSchema) })

  const resetStaffPassword = useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      api.patch(`/staff/${id}/reset-password`, { newPassword }),
    onSuccess: () => {
      toast.success('Password reset successfully')
      qc.invalidateQueries({ queryKey: ['staff'] })
      setResetTarget(null)
      resetResetForm()
    },
    onError: (e: any) => toast.error(e.message),
  })

  // ── Toggle staff active ───────────────────────────────────────────────────
  const toggleStaff = useMutation({
    mutationFn: (id: string) => api.patch(`/staff/${id}/toggle`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff'] }); toast.success('Account updated') },
    onError: (e: any) => toast.error(e.message),
  })

  // ── Delete staff ──────────────────────────────────────────────────────────
  const deleteStaff = useMutation({
    mutationFn: (id: string) => api.delete(`/staff/${id}`),
    onSuccess: () => {
      toast.success('Staff account deleted')
      qc.invalidateQueries({ queryKey: ['staff'] })
      setDeleteTarget(null)
    },
    onError: (e: any) => toast.error(e.message),
  })

  return (
    <div>
      <PageHeader title="Settings" />
      <div className="max-w-2xl space-y-5">

        {/* ── Profile card ─────────────────────────────────────────────── */}
        {user && (
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Profile</p>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
                style={{ background: 'rgba(212,168,83,0.15)', color: '#d4a853' }}>
                {getInitials(user.name)}
              </div>
              <div>
                <p className="font-semibold text-foreground text-lg">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <span className="text-xs px-2 py-0.5 rounded-full border mt-1.5 inline-block capitalize"
                  style={{ borderColor: 'rgba(212,168,83,0.3)', background: 'rgba(212,168,83,0.1)', color: '#d4a853' }}>
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Change own password ───────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Change password</p>
          <form onSubmit={handlePass(onChangePassword)} className="space-y-4">
            <PwdInput label="Current password" error={passErrors.currentPassword?.message}
              show={showCurrent} toggle={() => setShowCurrent(!showCurrent)} reg={regPass('currentPassword')} />
            <PwdInput label="New password" error={passErrors.newPassword?.message}
              show={showNew} toggle={() => setShowNew(!showNew)} reg={regPass('newPassword')} />
            <PwdInput label="Confirm new password" error={passErrors.confirmPassword?.message}
              show={showConfirm} toggle={() => setShowConfirm(!showConfirm)} reg={regPass('confirmPassword')} />
            <button type="submit" disabled={passSubmitting}
              className="w-full h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: '#d4a853', color: '#1a1713' }}>
              {passSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Updating...</> : 'Update password'}
            </button>
          </form>
        </div>

        {/* ── Appearance ───────────────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Appearance</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Theme</p>
              <p className="text-xs text-muted-foreground mt-0.5">{theme === 'dark' ? 'Dark mode active' : 'Light mode active'}</p>
            </div>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors text-sm text-foreground">
              {theme === 'dark' ? <><Sun className="w-4 h-4" />Switch to light</> : <><Moon className="w-4 h-4" />Switch to dark</>}
            </button>
          </div>
        </div>

        {/* ── Staff accounts — admin only ───────────────────────────────── */}
        {isAdmin && (
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Staff accounts</p>
                <p className="text-xs text-muted-foreground mt-1">Manage admin and subadmin accounts</p>
              </div>
              <button onClick={() => { setShowCreateForm(!showCreateForm); setEditTarget(null); setResetTarget(null) }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-accent transition-colors text-foreground">
                <UserPlus className="w-3.5 h-3.5" />
                {showCreateForm ? 'Cancel' : 'Add staff'}
              </button>
            </div>

            {/* ── Create form ────────────────────────────────────────── */}
            {showCreateForm && (
              <form onSubmit={handleCreate(d => createStaff.mutate(d))}
                className="mb-5 p-4 rounded-xl border border-border bg-background space-y-3">
                <p className="text-sm font-medium text-foreground">New staff account</p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Name *</label>
                    <input {...regCreate('name')} placeholder="Full name" />
                    {createErrors.name && <p className="text-xs text-red-400 mt-1">{createErrors.name.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Role *</label>
                    <select {...regCreate('role')}>
                      <option value="subadmin">Subadmin</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Email *</label>
                  <input {...regCreate('email')} type="email" placeholder="staff@kaapilibre.com" />
                  {createErrors.email && <p className="text-xs text-red-400 mt-1">{createErrors.email.message}</p>}
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Phone *</label>
                  <input {...regCreate('phone')} placeholder="9876543210" />
                  {createErrors.phone && <p className="text-xs text-red-400 mt-1">{createErrors.phone.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <PwdInput label="Password *" error={createErrors.password?.message}
                    show={showCreatePw} toggle={() => setShowCreatePw(!showCreatePw)} reg={regCreate('password')} />
                  <PwdInput label="Confirm *" error={createErrors.confirmPassword?.message}
                    show={showCreateConf} toggle={() => setShowCreateConf(!showCreateConf)} reg={regCreate('confirmPassword')} />
                </div>

                {/* Permission reference */}
                <div className="rounded-lg p-3 text-xs text-muted-foreground border border-border bg-muted/30">
                  <p className="font-medium text-foreground mb-1">Role permissions:</p>
                  <p><span style={{ color: '#d4a853' }}>Subadmin</span> — Dashboard, Orders (view + update status), Inventory, Contact (view + mark read)</p>
                  <p className="mt-1"><span style={{ color: '#60a5fa' }}>Admin</span> — Full access including Products, Customers, Analytics, Settings, CSV export, delete</p>
                </div>

                <button type="submit" disabled={createStaff.isPending}
                  className="w-full h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: '#d4a853', color: '#1a1713' }}>
                  {createStaff.isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Creating...</>
                    : <><UserPlus className="w-4 h-4" />Create account</>}
                </button>
              </form>
            )}

            {/* ── Edit form ──────────────────────────────────────────── */}
            {editTarget && (
              <form onSubmit={handleEdit(d => updateStaff.mutate({ id: editTarget._id, data: d }))}
                className="mb-5 p-4 rounded-xl border border-border bg-background space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Edit — {editTarget.name}</p>
                  <button type="button" onClick={() => setEditTarget(null)}
                    className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Name *</label>
                  <input {...regEdit('name')} />
                  {editErrors.name && <p className="text-xs text-red-400 mt-1">{editErrors.name.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Phone *</label>
                    <input {...regEdit('phone')} />
                    {editErrors.phone && <p className="text-xs text-red-400 mt-1">{editErrors.phone.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Role *</label>
                    <select {...regEdit('role')}>
                      <option value="subadmin">Subadmin</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <button type="submit" disabled={updateStaff.isPending}
                  className="w-full h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: '#d4a853', color: '#1a1713' }}>
                  {updateStaff.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : 'Save changes'}
                </button>
              </form>
            )}

            {/* ── Reset password form ────────────────────────────────── */}
            {resetTarget && (
              <form onSubmit={handleReset(d => resetStaffPassword.mutate({ id: resetTarget._id, newPassword: d.newPassword }))}
                className="mb-5 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Reset password — {resetTarget.name}</p>
                  <button type="button" onClick={() => setResetTarget(null)}
                    className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                </div>
                <PwdInput label="New password *" error={resetErrors.newPassword?.message}
                  show={showResetPw} toggle={() => setShowResetPw(!showResetPw)} reg={regReset('newPassword')} />
                <button type="submit" disabled={resetStaffPassword.isPending}
                  className="w-full h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60 border border-yellow-500/40 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/10 transition-colors">
                  {resetStaffPassword.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Resetting...</> : <><KeyRound className="w-4 h-4" />Set new password</>}
                </button>
              </form>
            )}

            {/* ── Staff list ─────────────────────────────────────────── */}
            {staffLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />)}
              </div>
            ) : staffList && staffList.length > 0 ? (
              <div className="space-y-2">
                {staffList.map((staff: any) => (
                  <div key={staff._id} className="rounded-lg border border-border hover:bg-accent/20 transition-colors">
                    {/* Staff row */}
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: 'rgba(212,168,83,0.15)', color: '#d4a853' }}>
                          {getInitials(staff.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">{staff.name}</p>
                            {!staff.isActive && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 flex-shrink-0">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{staff.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Role badge */}
                        <span className="text-xs px-2 py-0.5 rounded-full border capitalize hidden sm:inline-block"
                          style={staff.role === 'admin'
                            ? { borderColor: 'rgba(96,165,250,0.3)', background: 'rgba(96,165,250,0.1)', color: '#60a5fa' }
                            : { borderColor: 'rgba(212,168,83,0.3)', background: 'rgba(212,168,83,0.1)', color: '#d4a853' }}>
                          {staff.role}
                        </span>

                        {/* Edit */}
                        <button onClick={() => { setEditTarget(staff); setResetTarget(null); setShowCreateForm(false) }}
                          title="Edit staff"
                          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* Reset password */}
                        <button onClick={() => { setResetTarget(staff); setEditTarget(null); setShowCreateForm(false) }}
                          title="Reset password"
                          className="p-1.5 rounded text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10 transition-colors">
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        {/* Toggle active */}
                        <button onClick={() => toggleStaff.mutate(staff._id)}
                          title={staff.isActive ? 'Deactivate' : 'Activate'}
                          className={`p-1.5 rounded transition-colors text-xs font-medium border ${
                            staff.isActive
                              ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                              : 'border-green-500/30 text-green-500 hover:bg-green-500/10'
                          }`}>
                          {staff.isActive ? 'Deactivate' : 'Activate'}
                        </button>

                        {/* Delete */}
                        {deleteTarget === staff._id ? (
                          <div className="flex gap-1">
                            <button onClick={() => deleteStaff.mutate(staff._id)} disabled={deleteStaff.isPending}
                              className="px-2 py-1 rounded text-xs bg-red-500 text-white disabled:opacity-60">
                              {deleteStaff.isPending ? '...' : 'Delete'}
                            </button>
                            <button onClick={() => setDeleteTarget(null)}
                              className="px-2 py-1 rounded text-xs border border-border text-muted-foreground">
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteTarget(staff._id)} title="Delete permanently"
                            className="p-1.5 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Extra info row */}
                    <div className="px-3 pb-2 flex gap-4 text-[11px] text-muted-foreground">
                      <span>{staff.phone || '—'}</span>
                      <span>Joined {formatDate(staff.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No staff accounts yet</p>
                <p className="text-xs mt-1">Click "Add staff" to create a subadmin or admin</p>
              </div>
            )}
          </div>
        )}

        {/* ── Danger zone ──────────────────────────────────────────────── */}
        <div className="rounded-xl p-5" style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.03)' }}>
          <p className="text-xs font-medium text-red-400 uppercase tracking-wider mb-4">Danger zone</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Sign out</p>
              <p className="text-xs text-muted-foreground mt-0.5">End your current session</p>
            </div>
            <button onClick={() => logout()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
