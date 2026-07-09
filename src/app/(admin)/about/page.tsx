'use client'
import { useState, useEffect } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import {
  Loader2, Save, Upload, Plus, Trash2, Eye, EyeOff, Edit,
  ChevronUp, ChevronDown, ArrowRight, X,
  Mountain, Heart, Coffee, Sun, Shield, Flame, Archive,
  Star, Zap, Leaf, Globe, Award, Target, Crown, Users, Sparkles,
  BookOpen, Lightbulb, Compass, Gem, Feather, TreePine, Video, Play, Film
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  useAboutHero, useUpdateHero, useUploadHeroImage,
  useAboutManifesto, useUpdateManifesto, useUploadManifestoImage,
  useAboutBrandFilm, useUpdateBrandFilm, useUploadBrandFilmImage, useDeleteBrandFilmImage,
  useAboutPillars, useCreatePillar, useUpdatePillar, useDeletePillar, useTogglePillar, useReorderPillars,
  useAboutTimeline, useCreateTimelineStep, useUpdateTimelineStep, useDeleteTimelineStep, useToggleTimelineStep, useReorderTimeline,
  useAboutTeam, useCreateTeamMember, useUpdateTeamMember, useDeleteTeamMember, useToggleTeamMember, useReorderTeam, useUploadTeamPortrait,
} from '@/hooks/useAbout'
import type { Pillar, TimelineStep, TeamMember, AboutBrandFilm } from '@/types'
import { toast } from 'sonner'
import Link from 'next/link'

// ─── Lucide icon picker map ──────────────────────────────────────────────────
const ICON_OPTIONS = [
  { name: 'Mountain', icon: Mountain },
  { name: 'Heart', icon: Heart },
  { name: 'Coffee', icon: Coffee },
  { name: 'Sun', icon: Sun },
  { name: 'Shield', icon: Shield },
  { name: 'Flame', icon: Flame },
  { name: 'Archive', icon: Archive },
  { name: 'Star', icon: Star },
  { name: 'Zap', icon: Zap },
  { name: 'Leaf', icon: Leaf },
  { name: 'Globe', icon: Globe },
  { name: 'Award', icon: Award },
  { name: 'Target', icon: Target },
  { name: 'Crown', icon: Crown },
  { name: 'Users', icon: Users },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Lightbulb', icon: Lightbulb },
  { name: 'Compass', icon: Compass },
  { name: 'Gem', icon: Gem },
  { name: 'Feather', icon: Feather },
  { name: 'TreePine', icon: TreePine },
]

function getIcon(name: string) {
  const entry = ICON_OPTIONS.find(o => o.name === name)
  return entry ? entry.icon : Mountain
}

// ═══════════════════════════════════════════════════════════════════════════════
// HERO TAB
// ═══════════════════════════════════════════════════════════════════════════════

function HeroTab() {
  const { data: hero, isLoading } = useAboutHero()
  const updateHero = useUpdateHero()
  const uploadImage = useUploadHeroImage()

  const [tagline, setTagline] = useState('')
  const [headline, setHeadline] = useState('')
  const [subheadline, setSubheadline] = useState('')
  const [scrollCta, setScrollCta] = useState('')

  useEffect(() => {
    if (hero) {
      setTagline(hero.tagline || '')
      setHeadline(hero.headline || '')
      setSubheadline(hero.subheadline || '')
      setScrollCta(hero.scrollCta || '')
    }
  }, [hero])

  const handleSave = () => {
    updateHero.mutate({ tagline, headline, subheadline, scrollCta })
  }

  const handleImageUpload = (file: File) => {
    uploadImage.mutate(file)
  }

  if (isLoading) return <TabSkeleton />

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Hero Content</p>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Tagline</label>
          <input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="/ The Philosophy" />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Headline</label>
          <input value={headline} onChange={e => setHeadline(e.target.value)} placeholder="Coffee, As It Remembers Its Roots." />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Subheadline</label>
          <textarea value={subheadline} onChange={e => setSubheadline(e.target.value)} rows={3}
            placeholder="Description paragraph..." />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Scroll CTA Text</label>
          <input value={scrollCta} onChange={e => setScrollCta(e.target.value)} placeholder="Read Our Story" />
        </div>

        <button onClick={handleSave} disabled={updateHero.isPending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium"
          style={{ background: '#d4a853', color: '#1a1713' }}>
          {updateHero.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Hero
        </button>
      </div>

      {/* Hero Image */}
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Hero Image</p>
        {hero?.heroImage ? (
          <div className="relative rounded-lg overflow-hidden bg-muted mb-3 group">
            <img src={hero.heroImage} alt="Hero" className="w-full h-48 object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <label className="px-3 py-1.5 rounded-lg bg-white/90 text-xs font-medium text-gray-800 cursor-pointer hover:bg-white transition-colors">
                Replace
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = '' }} />
              </label>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-border hover:border-primary/40 cursor-pointer transition-colors text-muted-foreground hover:text-foreground">
            {uploadImage.isPending ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Upload className="w-6 h-6 mb-2" />
                <span className="text-xs">Upload hero image</span>
                <span className="text-[10px] mt-1 text-muted-foreground/60">JPG, PNG, WebP · max 5MB</span>
              </>
            )}
            <input type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = '' }} />
          </label>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MANIFESTO TAB
// ═══════════════════════════════════════════════════════════════════════════════

function ManifestoTab() {
  const { data: manifesto, isLoading } = useAboutManifesto()
  const updateManifesto = useUpdateManifesto()
  const uploadImage = useUploadManifestoImage()

  const [sectionLabel, setSectionLabel] = useState('')
  const [quote, setQuote] = useState('')
  const [paragraphs, setParagraphs] = useState<string[]>([''])

  useEffect(() => {
    if (manifesto) {
      setSectionLabel(manifesto.sectionLabel || '')
      setQuote(manifesto.quote || '')
      setParagraphs(manifesto.paragraphs?.length ? manifesto.paragraphs : [''])
    }
  }, [manifesto])

  const handleSave = () => {
    const filtered = paragraphs.filter(p => p.trim())
    if (filtered.length === 0) { toast.error('At least one paragraph is required'); return }
    updateManifesto.mutate({ sectionLabel, quote, paragraphs: filtered })
  }

  const updateParagraph = (idx: number, value: string) => {
    setParagraphs(p => p.map((v, i) => i === idx ? value : v))
  }

  const addParagraph = () => setParagraphs(p => [...p, ''])

  const removeParagraph = (idx: number) => {
    if (paragraphs.length <= 1) return
    setParagraphs(p => p.filter((_, i) => i !== idx))
  }

  if (isLoading) return <TabSkeleton />

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Manifesto Content</p>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Section Label</label>
          <input value={sectionLabel} onChange={e => setSectionLabel(e.target.value)} placeholder="The Belief" />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Featured Quote</label>
          <textarea value={quote} onChange={e => setQuote(e.target.value)} rows={2}
            placeholder="The forest is the only true vessel of flavor."
            style={{ borderLeft: '3px solid #d4a853', borderRadius: '0 8px 8px 0', paddingLeft: '12px', fontStyle: 'italic' }} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-muted-foreground">Paragraphs ({paragraphs.length})</label>
            <button type="button" onClick={addParagraph}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
          <div className="space-y-2">
            {paragraphs.map((p, i) => (
              <div key={i} className="flex gap-2">
                <textarea value={p} onChange={e => updateParagraph(i, e.target.value)} rows={3}
                  placeholder={`Paragraph ${i + 1}...`} className="flex-1" />
                {paragraphs.length > 1 && (
                  <button type="button" onClick={() => removeParagraph(i)}
                    className="p-2 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors self-start mt-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleSave} disabled={updateManifesto.isPending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium"
          style={{ background: '#d4a853', color: '#1a1713' }}>
          {updateManifesto.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Manifesto
        </button>
      </div>

      {/* Roast Image */}
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Roast Image</p>
        {manifesto?.roastImage ? (
          <div className="relative rounded-lg overflow-hidden bg-muted mb-3 group">
            <img src={manifesto.roastImage} alt="Roast" className="w-full h-48 object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <label className="px-3 py-1.5 rounded-lg bg-white/90 text-xs font-medium text-gray-800 cursor-pointer hover:bg-white transition-colors">
                Replace
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage.mutate(f); e.target.value = '' }} />
              </label>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-border hover:border-primary/40 cursor-pointer transition-colors text-muted-foreground hover:text-foreground">
            {uploadImage.isPending ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Upload className="w-6 h-6 mb-2" />
                <span className="text-xs">Upload roast image</span>
              </>
            )}
            <input type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage.mutate(f); e.target.value = '' }} />
          </label>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// BRAND FILM TAB
// ═══════════════════════════════════════════════════════════════════════════════

function BrandFilmTab() {
  const { data: brandFilm, isLoading } = useAboutBrandFilm()
  const updateBrandFilm = useUpdateBrandFilm()
  const uploadImage = useUploadBrandFilmImage()
  const deleteImage = useDeleteBrandFilmImage()

  const [videoUrl, setVideoUrl] = useState('')

  useEffect(() => {
    if (brandFilm) {
      setVideoUrl(brandFilm.videoUrl || '')
    }
  }, [brandFilm])

  const getYoutubeId = (url: string) => {
    if (!url) return null
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  const handleSave = () => {
    const trimmedUrl = videoUrl.trim()
    const hasImage = !!brandFilm?.image

    if (!trimmedUrl && !hasImage) {
      toast.error('Either a YouTube URL or an Image is required.')
      return
    }

    updateBrandFilm.mutate({ videoUrl: trimmedUrl })
  }

  const handleImageUpload = (file: File) => {
    uploadImage.mutate(file)
  }

  const handleDeleteImage = () => {
    const trimmedUrl = videoUrl.trim()
    if (!trimmedUrl) {
      toast.error('Cannot delete the image when there is no YouTube URL. At least one is required.')
      return
    }
    deleteImage.mutate()
  }

  if (isLoading) return <TabSkeleton />

  const youtubeId = getYoutubeId(videoUrl)

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Brand Film Content</p>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">YouTube Video URL</label>
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm hover:border-primary/40 focus:border-primary focus:outline-none transition-colors"
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            Provide a YouTube video link. If no YouTube URL is specified, a brand film image is mandatory.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={updateBrandFilm.isPending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium"
          style={{ background: '#d4a853', color: '#1a1713' }}
        >
          {updateBrandFilm.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Brand Film
        </button>
      </div>

      {/* Brand Film Media Previews */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cover Image Upload */}
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Cover / Poster Image</p>
            {brandFilm?.image ? (
              <div className="relative rounded-lg overflow-hidden bg-muted mb-3 group aspect-video">
                <img src={brandFilm.image} alt="Brand Film Cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <label className="px-3 py-1.5 rounded-lg bg-white/90 text-xs font-medium text-gray-800 cursor-pointer hover:bg-white transition-colors">
                    Replace
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) handleImageUpload(f)
                        e.target.value = ''
                      }}
                    />
                  </label>
                  <button
                    onClick={handleDeleteImage}
                    disabled={deleteImage.isPending}
                    className="px-3 py-1.5 rounded-lg bg-red-600/90 text-xs font-medium text-white hover:bg-red-600 transition-colors flex items-center gap-1"
                  >
                    {deleteImage.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-40 rounded-xl border-2 border-dashed border-border hover:border-primary/40 cursor-pointer transition-colors text-muted-foreground hover:text-foreground mb-3">
                {uploadImage.isPending ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 mb-2 animate-bounce" />
                    <span className="text-xs font-medium">Upload brand film image</span>
                    <span className="text-[10px] mt-1 text-muted-foreground/60">JPG, PNG, WebP · max 5MB</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleImageUpload(f)
                    e.target.value = ''
                  }}
                />
              </label>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">
            {videoUrl.trim() ? 'Optional when YouTube URL is provided.' : 'Mandatory when YouTube URL is empty.'}
          </p>
        </div>

        {/* Video Player Preview */}
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Video Player Preview</p>
          {youtubeId ? (
            <div className="rounded-lg overflow-hidden border border-border aspect-video bg-black shadow-inner">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title="YouTube Video Player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 rounded-xl border border-dashed border-border bg-muted/20 text-muted-foreground text-center p-4">
              <Film className="w-8 h-8 mb-2 opacity-30" />
              <span className="text-xs font-medium">No Video URL Entered</span>
              <span className="text-[10px] text-muted-foreground/60 mt-1 max-w-[200px]">
                Provide a valid YouTube URL to enable video playback preview here.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ICON PICKER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const SelectedIcon = getIcon(value)

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-input text-sm hover:border-primary/40 transition-colors w-full">
        <SelectedIcon className="w-4 h-4" style={{ color: '#d4a853' }} />
        <span className="flex-1 text-left text-foreground">{value || 'Select icon'}</span>
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-30 rounded-xl border border-border bg-popover shadow-xl p-3 max-h-48 overflow-y-auto">
          <div className="grid grid-cols-6 gap-1.5">
            {ICON_OPTIONS.map(({ name, icon: Icon }) => (
              <button key={name} type="button"
                onClick={() => { onChange(name); setOpen(false) }}
                title={name}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${value === name ? 'bg-primary/20 ring-1 ring-primary' : 'hover:bg-accent'}`}>
                <Icon className="w-4 h-4" style={value === name ? { color: '#d4a853' } : {}} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PILLARS TAB
// ═══════════════════════════════════════════════════════════════════════════════

function PillarsTab() {
  const { data: pillars, isLoading } = useAboutPillars()
  const createPillar = useCreatePillar()
  const updatePillar = useUpdatePillar()
  const deletePillar = useDeletePillar()
  const togglePillar = useTogglePillar()
  const reorderPillars = useReorderPillars()

  const [editing, setEditing] = useState<Pillar | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [tagline, setTagline] = useState('')
  const [description, setDescription] = useState('')
  const [iconName, setIconName] = useState('Mountain')

  const resetForm = () => {
    setTitle(''); setTagline(''); setDescription(''); setIconName('Mountain')
    setEditing(null); setShowForm(false)
  }

  const openEdit = (p: Pillar) => {
    setEditing(p)
    setTitle(p.title); setTagline(p.tagline); setDescription(p.description); setIconName(p.iconName)
    setShowForm(true)
  }

  const handleSave = () => {
    if (!title.trim() || !tagline.trim() || !description.trim()) { toast.error('All fields required'); return }
    const data = { title, tagline, description, iconName }
    if (editing) {
      updatePillar.mutate({ id: editing._id, data }, { onSuccess: resetForm })
    } else {
      createPillar.mutate(data as any, { onSuccess: resetForm })
    }
  }

  const handleMove = (idx: number, dir: 'up' | 'down') => {
    if (!pillars) return
    const ids = pillars.map(p => p._id)
    const swap = dir === 'up' ? idx - 1 : idx + 1
    if (swap < 0 || swap >= ids.length) return
      ;[ids[idx], ids[swap]] = [ids[swap], ids[idx]]
    reorderPillars.mutate(ids)
  }

  if (isLoading) return <TabSkeleton />

  return (
    <div className="space-y-4">
      {/* Add button */}
      {!showForm && (
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: '#d4a853', color: '#1a1713' }}>
          <Plus className="w-4 h-4" /> Add Pillar
        </button>
      )}

      {/* Form */}
      {showForm && (
        <div className="rounded-xl border border-primary/30 bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {editing ? 'Edit Pillar' : 'New Pillar'}
            </p>
            <button onClick={resetForm} className="p-1 rounded text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Icon</label>
              <IconPicker value={iconName} onChange={setIconName} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Canopy Ecosystems" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Tagline *</label>
            <input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="Cultivated in Shade" />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Description *</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              placeholder="Describe this pillar..." />
          </div>

          <div className="flex gap-2">
            <button onClick={handleSave} disabled={createPillar.isPending || updatePillar.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: '#d4a853', color: '#1a1713' }}>
              {(createPillar.isPending || updatePillar.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editing ? 'Update' : 'Create'}
            </button>
            <button onClick={resetForm} className="px-4 py-2.5 rounded-lg text-sm border border-border text-muted-foreground hover:text-foreground">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Pillar list */}
      {(pillars?.length ?? 0) === 0 ? (
        <EmptyState label="pillars" />
      ) : (
        <div className="space-y-2">
          {pillars!.map((p, idx) => {
            const Icon = getIcon(p.iconName)
            return (
              <div key={p._id} className="rounded-xl border border-border bg-card p-4 flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(212,168,83,0.1)' }}>
                  <Icon className="w-5 h-5" style={{ color: '#d4a853' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-medium text-sm text-foreground">{p.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${p.isVisible ? 'border-green-500/30 bg-green-500/10 text-green-500' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
                      {p.isVisible ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                  <p className="text-xs text-primary/80">{p.tagline}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleMove(idx, 'up')} disabled={idx === 0}
                    className="p-1.5 rounded-md hover:bg-accent text-muted-foreground disabled:opacity-30">
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleMove(idx, 'down')} disabled={idx === pillars!.length - 1}
                    className="p-1.5 rounded-md hover:bg-accent text-muted-foreground disabled:opacity-30">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => togglePillar.mutate(p._id)} title={p.isVisible ? 'Hide' : 'Show'}
                    className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground">
                    {p.isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => openEdit(p)} title="Edit Pillar"
                    className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  {deleteTarget === p._id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => { deletePillar.mutate(p._id); setDeleteTarget(null) }}
                        className="px-2 py-1 rounded text-xs bg-red-500 text-white">Delete</button>
                      <button onClick={() => setDeleteTarget(null)}
                        className="px-2 py-1 rounded text-xs border border-border text-muted-foreground">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteTarget(p._id)}
                      className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIMELINE TAB
// ═══════════════════════════════════════════════════════════════════════════════

function TimelineTab() {
  const { data: steps, isLoading } = useAboutTimeline()
  const createStep = useCreateTimelineStep()
  const updateStep = useUpdateTimelineStep()
  const deleteStep = useDeleteTimelineStep()
  const toggleStep = useToggleTimelineStep()
  const reorderSteps = useReorderTimeline()

  const [editing, setEditing] = useState<TimelineStep | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const [step, setStep] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [iconName, setIconName] = useState('Sun')

  const resetForm = () => {
    setStep(''); setTitle(''); setDescription(''); setIconName('Sun')
    setEditing(null); setShowForm(false)
  }

  const openEdit = (s: TimelineStep) => {
    setEditing(s)
    setStep(s.step); setTitle(s.title); setDescription(s.description); setIconName(s.iconName)
    setShowForm(true)
  }

  const handleSave = () => {
    if (!step.trim() || !title.trim() || !description.trim()) { toast.error('All fields required'); return }
    const data = { step, title, description, iconName }
    if (editing) {
      updateStep.mutate({ id: editing._id, data }, { onSuccess: resetForm })
    } else {
      createStep.mutate(data as any, { onSuccess: resetForm })
    }
  }

  const handleMove = (idx: number, dir: 'up' | 'down') => {
    if (!steps) return
    const ids = steps.map(s => s._id)
    const swap = dir === 'up' ? idx - 1 : idx + 1
    if (swap < 0 || swap >= ids.length) return
      ;[ids[idx], ids[swap]] = [ids[swap], ids[idx]]
    reorderSteps.mutate(ids)
  }

  if (isLoading) return <TabSkeleton />

  return (
    <div className="space-y-4">
      {!showForm && (
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: '#d4a853', color: '#1a1713' }}>
          <Plus className="w-4 h-4" /> Add Step
        </button>
      )}

      {showForm && (
        <div className="rounded-xl border border-primary/30 bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {editing ? 'Edit Step' : 'New Step'}
            </p>
            <button onClick={resetForm} className="p-1 rounded text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Step # *</label>
              <input value={step} onChange={e => setStep(e.target.value)} placeholder="01" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Icon</label>
              <IconPicker value={iconName} onChange={setIconName} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Harvesting the Shade" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Description *</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              placeholder="Describe this phase..." />
          </div>

          <div className="flex gap-2">
            <button onClick={handleSave} disabled={createStep.isPending || updateStep.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: '#d4a853', color: '#1a1713' }}>
              {(createStep.isPending || updateStep.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editing ? 'Update' : 'Create'}
            </button>
            <button onClick={resetForm} className="px-4 py-2.5 rounded-lg text-sm border border-border text-muted-foreground hover:text-foreground">
              Cancel
            </button>
          </div>
        </div>
      )}

      {(steps?.length ?? 0) === 0 ? (
        <EmptyState label="timeline steps" />
      ) : (
        <div className="space-y-2">
          {steps!.map((s, idx) => {
            const Icon = getIcon(s.iconName)
            return (
              <div key={s._id} className="rounded-xl border border-border bg-card p-4 flex items-start gap-4 group">
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-lg font-bold" style={{ color: '#d4a853' }}>{s.step}</span>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(212,168,83,0.1)' }}>
                    <Icon className="w-4 h-4" style={{ color: '#d4a853' }} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-medium text-sm text-foreground">{s.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${s.isVisible ? 'border-green-500/30 bg-green-500/10 text-green-500' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
                      {s.isVisible ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleMove(idx, 'up')} disabled={idx === 0}
                    className="p-1.5 rounded-md hover:bg-accent text-muted-foreground disabled:opacity-30">
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleMove(idx, 'down')} disabled={idx === steps!.length - 1}
                    className="p-1.5 rounded-md hover:bg-accent text-muted-foreground disabled:opacity-30">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => toggleStep.mutate(s._id)} title={s.isVisible ? 'Hide' : 'Show'}
                    className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground">
                    {s.isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => openEdit(s)} title="Edit Step"
                    className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  {deleteTarget === s._id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => { deleteStep.mutate(s._id); setDeleteTarget(null) }}
                        className="px-2 py-1 rounded text-xs bg-red-500 text-white">Delete</button>
                      <button onClick={() => setDeleteTarget(null)}
                        className="px-2 py-1 rounded text-xs border border-border text-muted-foreground">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteTarget(s._id)}
                      className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CAFE PARTNERS TAB
// ═══════════════════════════════════════════════════════════════════════════════

function CafePartnersTab() {
  return (
    <div className="rounded-xl border border-border bg-card p-8 text-center">
      <Coffee className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
      <h3 className="text-sm font-medium text-foreground mb-1">Cafe Partners</h3>
      <p className="text-xs text-muted-foreground mb-4 max-w-md mx-auto">
        Cafe partners for the website ticker are managed from the Cafes page.
        Active cafes with logos will appear automatically on the About page.
      </p>
      <Link href="/cafes"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-accent transition-colors">
        Go to Cafes <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEAM TAB
// ═══════════════════════════════════════════════════════════════════════════════

function TeamTab() {
  const { data: members, isLoading } = useAboutTeam()
  const createMember = useCreateTeamMember()
  const updateMember = useUpdateTeamMember()
  const deleteMember = useDeleteTeamMember()
  const toggleMember = useToggleTeamMember()
  const reorderMembers = useReorderTeam()
  const uploadPortrait = useUploadTeamPortrait()

  const [editing, setEditing] = useState<TeamMember | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [roleLabel, setRoleLabel] = useState('')
  const [bio, setBio] = useState('')
  const [portraitFile, setPortraitFile] = useState<File | null>(null)
  const [portraitPreview, setPortraitPreview] = useState<string | null>(null)

  const resetForm = () => {
    setName(''); setRole(''); setRoleLabel(''); setBio('')
    setPortraitFile(null); setPortraitPreview(null)
    setEditing(null); setShowForm(false)
  }

  const openEdit = (m: TeamMember) => {
    setEditing(m)
    setName(m.name); setRole(m.role); setRoleLabel(m.roleLabel || ''); setBio(m.bio || '')
    setPortraitPreview(m.portrait || null)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!name.trim() || !role.trim()) { toast.error('Name and role are required'); return }
    const data = { name, role, roleLabel, bio }
    try {
      if (editing) {
        await updateMember.mutateAsync({ id: editing._id, data })
        if (portraitFile) {
          await uploadPortrait.mutateAsync({ id: editing._id, file: portraitFile })
        }
      } else {
        const res = await createMember.mutateAsync(data as any) as any
        const newId = res?.data?._id
        if (newId && portraitFile) {
          await uploadPortrait.mutateAsync({ id: newId, file: portraitFile })
        }
      }
      resetForm()
    } catch (err: any) {
      console.error(err)
    }
  }

  const handleMove = (idx: number, dir: 'up' | 'down') => {
    if (!members) return
    const ids = members.map(m => m._id)
    const swap = dir === 'up' ? idx - 1 : idx + 1
    if (swap < 0 || swap >= ids.length) return
      ;[ids[idx], ids[swap]] = [ids[swap], ids[idx]]
    reorderMembers.mutate(ids)
  }

  const handlePortraitUpload = (id: string, file: File) => {
    uploadPortrait.mutate({ id, file })
  }

  if (isLoading) return <TabSkeleton />

  return (
    <div className="space-y-4">
      {!showForm && (
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: '#d4a853', color: '#1a1713' }}>
          <Plus className="w-4 h-4" /> Add Team Member
        </button>
      )}

      {showForm && (
        <div className="rounded-xl border border-primary/30 bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {editing ? 'Edit Member' : 'New Member'}
            </p>
            <button onClick={resetForm} className="p-1 rounded text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Portrait *</label>
              {portraitPreview ? (
                <div className="relative rounded-lg overflow-hidden bg-muted w-20 h-24 group/preview">
                  <img src={portraitPreview} alt="Preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => { setPortraitFile(null); setPortraitPreview(null) }}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-red-500 flex items-center justify-center text-white transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-20 h-24 rounded-xl border-2 border-dashed border-border hover:border-primary/40 cursor-pointer transition-colors text-muted-foreground hover:text-foreground">
                  <Upload className="w-4 h-4 mb-1" />
                  <span className="text-[10px] text-center">Upload</span>
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0]
                      if (f) {
                        setPortraitFile(f)
                        setPortraitPreview(URL.createObjectURL(f))
                      }
                      e.target.value = ''
                    }}
                  />
                </label>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Arjun Nair" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Role *</label>
              <input value={role} onChange={e => setRole(e.target.value)} placeholder="Co-Founder & Sourcing" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Full Role Title</label>
            <input value={roleLabel} onChange={e => setRoleLabel(e.target.value)} placeholder="Co-Founder & Lead Sourcing Curator" />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
              placeholder="Brief biography..." />
          </div>

          <div className="flex gap-2">
            <button onClick={handleSave} disabled={createMember.isPending || updateMember.isPending || uploadPortrait.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: '#d4a853', color: '#1a1713' }}>
              {(createMember.isPending || updateMember.isPending || uploadPortrait.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editing ? 'Update' : 'Create'}
            </button>
            <button onClick={resetForm} className="px-4 py-2.5 rounded-lg text-sm border border-border text-muted-foreground hover:text-foreground">
              Cancel
            </button>
          </div>
        </div>
      )}

      {(members?.length ?? 0) === 0 ? (
        <EmptyState label="team members" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {members!.map((m, idx) => (
            <div key={m._id} className="rounded-xl border border-border bg-card overflow-hidden group">
              <div className="flex items-start gap-4 p-4">
                {/* Portrait */}
                <div className="w-16 h-20 rounded-lg bg-muted flex-shrink-0 overflow-hidden relative group/img">
                  {m.portrait ? (
                    <img src={m.portrait} alt={m.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    {uploadPortrait.isPending ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 text-white" />
                    )}
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handlePortraitUpload(m._id, f); e.target.value = '' }} />
                  </label>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-medium text-sm text-foreground truncate">{m.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${m.isVisible ? 'border-green-500/30 bg-green-500/10 text-green-500' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
                      {m.isVisible ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: '#d4a853' }}>{m.role}</p>
                  {m.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.bio}</p>}
                </div>
              </div>

              {/* Actions bar */}
              <div className="flex items-center justify-end gap-1 px-4 pb-3 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleMove(idx, 'up')} disabled={idx === 0}
                  className="p-1.5 rounded-md hover:bg-accent text-muted-foreground disabled:opacity-30">
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleMove(idx, 'down')} disabled={idx === members!.length - 1}
                  className="p-1.5 rounded-md hover:bg-accent text-muted-foreground disabled:opacity-30">
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => toggleMember.mutate(m._id)} title={m.isVisible ? 'Hide' : 'Show'}
                  className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground">
                  {m.isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => openEdit(m)} title="Edit Member"
                  className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground">
                  <Edit className="w-3.5 h-3.5" />
                </button>
                {deleteTarget === m._id ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => { deleteMember.mutate(m._id); setDeleteTarget(null) }}
                      className="px-2 py-1 rounded text-xs bg-red-500 text-white">Delete</button>
                    <button onClick={() => setDeleteTarget(null)}
                      className="px-2 py-1 rounded text-xs border border-border text-muted-foreground">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteTarget(m._id)}
                    className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function TabSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-24 rounded-xl bg-card border border-border animate-pulse" />
      ))}
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="py-16 text-center text-muted-foreground">
      <Archive className="w-10 h-10 mx-auto mb-3 opacity-30" />
      <p className="text-sm font-medium">No {label} yet</p>
      <p className="text-xs mt-1">Click the button above to add your first entry.</p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

const TABS = [
  { id: 'hero', label: 'Hero' },
  { id: 'manifesto', label: 'Manifesto' },
  { id: 'brandFilm', label: 'Brand Film' },
  { id: 'pillars', label: 'Pillars' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'cafes', label: 'Cafe Partners' },
  { id: 'team', label: 'Team' },
]

export default function AboutPage() {
  return (
    <div>
      <PageHeader
        title="About Page"
        description="Manage all sections of the About page"
      />

      <Tabs.Root defaultValue="hero">
        <Tabs.List className="flex gap-1 p-1 rounded-lg bg-muted mb-6 flex-wrap">
          {TABS.map(tab => (
            <Tabs.Trigger key={tab.id} value={tab.id}
              className="px-4 py-2 rounded-md text-xs font-medium capitalize transition-all text-muted-foreground data-[state=active]:bg-[#d4a853] data-[state=active]:text-[#d4a853]"
            >
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="hero"><HeroTab /></Tabs.Content>
        <Tabs.Content value="manifesto"><ManifestoTab /></Tabs.Content>
        <Tabs.Content value="brandFilm"><BrandFilmTab /></Tabs.Content>
        <Tabs.Content value="pillars"><PillarsTab /></Tabs.Content>
        <Tabs.Content value="timeline"><TimelineTab /></Tabs.Content>
        <Tabs.Content value="cafes"><CafePartnersTab /></Tabs.Content>
        <Tabs.Content value="team"><TeamTab /></Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
