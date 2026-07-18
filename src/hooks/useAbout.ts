import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { AboutHero, AboutManifesto, AboutBrandFilm, Pillar, TimelineStep, TeamMember } from '@/types'

// ═══════════════════════════════════════════════════════════════════════════════
// HERO
// ═══════════════════════════════════════════════════════════════════════════════

export function useAboutHero() {
  return useQuery<AboutHero>({
    queryKey: ['about-hero'],
    queryFn: async () => {
      const res = await api.get('/about') as any
      return res.data.hero
    },
  })
}

export function useUpdateHero() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<AboutHero>) => api.put('/about/hero', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['about-hero'] })
      toast.success('Hero updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUploadHeroImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData()
      fd.append('image', file)
      return api.post('/about/hero/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['about-hero'] })
      toast.success('Hero image uploaded')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// MANIFESTO
// ═══════════════════════════════════════════════════════════════════════════════

export function useAboutManifesto() {
  return useQuery<AboutManifesto>({
    queryKey: ['about-manifesto'],
    queryFn: async () => {
      const res = await api.get('/about') as any
      return res.data.manifesto
    },
  })
}

export function useUpdateManifesto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<AboutManifesto>) => api.put('/about/manifesto', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['about-manifesto'] })
      toast.success('Manifesto updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUploadManifestoImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData()
      fd.append('image', file)
      return api.post('/about/manifesto/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['about-manifesto'] })
      toast.success('Manifesto image uploaded')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// BRAND FILM
// ═══════════════════════════════════════════════════════════════════════════════

export function useAboutBrandFilm() {
  return useQuery<AboutBrandFilm>({
    queryKey: ['about-brand-film'],
    queryFn: async () => {
      const res = await api.get('/about') as any
      return res.data.brandFilm
    },
  })
}

export function useUpdateBrandFilm() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<AboutBrandFilm>) => api.put('/about/brand-film', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['about-brand-film'] })
      toast.success('Brand film updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUploadBrandFilmImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData()
      fd.append('image', file)
      return api.post('/about/brand-film/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['about-brand-film'] })
      toast.success('Brand film image uploaded')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteBrandFilmImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete('/about/brand-film/image'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['about-brand-film'] })
      toast.success('Brand film image deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// PILLARS
// ═══════════════════════════════════════════════════════════════════════════════

export function useAboutPillars() {
  return useQuery<Pillar[]>({
    queryKey: ['about-pillars'],
    queryFn: async () => {
      const res = await api.get('/about/pillars/all') as any
      return res.data
    },
  })
}

export function useCreatePillar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Pillar>) => api.post('/about/pillars', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['about-pillars'] })
      toast.success('Pillar created')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdatePillar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pillar> }) =>
      api.put(`/about/pillars/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['about-pillars'] })
      toast.success('Pillar updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeletePillar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/about/pillars/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['about-pillars'] })
      toast.success('Pillar deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useTogglePillar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.patch(`/about/pillars/${id}/toggle`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['about-pillars'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useReorderPillars() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) => api.patch('/about/pillars/reorder', { orderedIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['about-pillars'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIMELINE
// ═══════════════════════════════════════════════════════════════════════════════

export function useAboutTimeline() {
  return useQuery<TimelineStep[]>({
    queryKey: ['about-timeline'],
    queryFn: async () => {
      const res = await api.get('/about/timeline/all') as any
      return res.data
    },
  })
}

export function useCreateTimelineStep() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<TimelineStep>) => api.post('/about/timeline', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['about-timeline'] })
      toast.success('Timeline step created')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateTimelineStep() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TimelineStep> }) =>
      api.put(`/about/timeline/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['about-timeline'] })
      toast.success('Timeline step updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteTimelineStep() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/about/timeline/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['about-timeline'] })
      toast.success('Timeline step deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useToggleTimelineStep() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.patch(`/about/timeline/${id}/toggle`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['about-timeline'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useReorderTimeline() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) => api.patch('/about/timeline/reorder', { orderedIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['about-timeline'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEAM MEMBERS
// ═══════════════════════════════════════════════════════════════════════════════

export function useAboutTeam() {
  return useQuery<TeamMember[]>({
    queryKey: ['about-team'],
    queryFn: async () => {
      const res = await api.get('/about/team/all') as any
      return res.data
    },
  })
}

export function useCreateTeamMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<TeamMember>) => api.post('/about/team', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['about-team'] })
      toast.success('Team member created')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateTeamMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TeamMember> }) =>
      api.put(`/about/team/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['about-team'] })
      toast.success('Team member updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteTeamMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/about/team/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['about-team'] })
      toast.success('Team member deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useToggleTeamMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.patch(`/about/team/${id}/toggle`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['about-team'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useReorderTeam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) => api.patch('/about/team/reorder', { orderedIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['about-team'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUploadTeamPortrait() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const fd = new FormData()
      fd.append('image', file)
      return api.post(`/about/team/${id}/portrait`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['about-team'] })
      toast.success('Portrait uploaded')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
