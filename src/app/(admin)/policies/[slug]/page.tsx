'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Code,
  Columns,
  ExternalLink,
  Sparkles,
  Loader2,
  RotateCcw,
  FileText,
  Layers,
  Edit3,
  HelpCircle,
  BookOpen,
  Clock,
  Hash,
} from 'lucide-react'
import { usePolicy, useUpsertPolicy } from '@/hooks/usePolicies'
import {
  POLICY_CATALOG,
  STARTER_POLICIES,
  calculateReadingStats,
} from '@/lib/policyDefaults'
import { VisualEditor } from '@/components/policies/VisualEditor'
import { SectionBuilder } from '@/components/policies/SectionBuilder'
import { ResetTemplateModal } from '@/components/policies/ResetTemplateModal'
import { InsertTemplateModal } from '@/components/policies/InsertTemplateModal'
import type { PolicySlug } from '@/types'

export default function PolicyEditPage() {
  const params = useParams()
  const router = useRouter()
  const slug = (params?.slug as string) || ''

  const { data: policy, isLoading, error } = usePolicy(slug)
  const upsertPolicy = useUpsertPolicy()

  // Policy Form State
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')
  const [isPublished, setIsPublished] = useState(true)

  // Editor View: 'visual' (WYSIWYG document) | 'sections' (clause cards) | 'html' (raw code)
  const [editorMode, setEditorMode] = useState<'visual' | 'sections' | 'html'>('visual')

  // Screen Layout: 'split' (side-by-side) | 'edit' (full editor) | 'preview' (full live preview)
  const [layoutMode, setLayoutMode] = useState<'split' | 'edit' | 'preview'>('split')

  // Modals
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  const meta = POLICY_CATALOG[slug as PolicySlug]

  // Initialize form when policy data loads
  useEffect(() => {
    if (policy) {
      setTitle(policy.title || meta?.label || 'Policy')
      setSummary(policy.summary || meta?.description || '')
      setContent(policy.content || STARTER_POLICIES[slug as PolicySlug]?.content || '')
      setIsPublished(policy.isPublished ?? true)
      setIsDirty(false)
    } else if (meta && STARTER_POLICIES[slug as PolicySlug]) {
      // Fallback starter template if brand new
      const starter = STARTER_POLICIES[slug as PolicySlug]
      setTitle(starter.title)
      setSummary(starter.summary)
      setContent(starter.content)
      setIsPublished(true)
      setIsDirty(false)
    }
  }, [policy, slug, meta])

  // Track content edits
  const handleContentChange = (newHtml: string) => {
    setContent(newHtml)
    setIsDirty(true)
  }

  // Handle Save
  const handleSave = async () => {
    await upsertPolicy.mutateAsync({
      slug,
      data: {
        title,
        summary,
        content,
        isPublished,
      },
    })
    setIsDirty(false)
  }

  // Reset to default starter template
  const handleResetToDefault = () => {
    const starter = STARTER_POLICIES[slug as PolicySlug]
    if (starter) {
      setTitle(starter.title)
      setSummary(starter.summary)
      setContent(starter.content)
      setIsDirty(true)
    }
  }

  // Global keyboard shortcut for Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [title, summary, content, isPublished])

  // Live statistics calculation
  const stats = useMemo(() => calculateReadingStats(content), [content])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm">Loading policy editor...</p>
      </div>
    )
  }

  if (error || !meta) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold text-foreground">Policy Not Found</h2>
        <p className="text-sm text-muted-foreground">
          The requested policy '{slug}' could not be loaded. Please ensure the URL is correct.
        </p>
        <Link
          href="/policies"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Policies</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-28">
      {/* ── Sticky Top Header & Actions ── */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md pb-4 pt-2 -mx-2 px-2 border-b border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/policies"
            className="p-2 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">{meta.label}</h1>
              <code className="text-xs font-mono text-muted-foreground bg-muted/70 px-2 py-0.5 rounded">
                /{slug}
              </code>
              {isDirty ? (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Unsaved changes
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  Saved
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Last saved:{' '}
              {policy?.updatedAt
                ? new Date(policy.updatedAt).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
                : 'Using starter default'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* External Storefront Link */}
          <a
            href={`http://localhost:3000/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Open live customer view on website"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </a>

          {/* Reset Template */}
          <button
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            title="Restore official template"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Template</span>
          </button>

          {/* Published Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsPublished(!isPublished)
              setIsDirty(true)
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${isPublished
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
              }`}
          >
            {isPublished ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
            <span>{isPublished ? 'Published Live' : 'Draft (Hidden)'}</span>
          </button>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={upsertPolicy.isPending}
            className="inline-flex items-center rounded-xl bg-white hover:bg-amber-600 text-white font-bold text-xs shadow-lg  hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            {upsertPolicy.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : (
              <Save className="w-4 h-4 text-black" />
            )}
            <span>{upsertPolicy.isPending ? 'Saving Policy...' : 'Save Policy Changes'}</span>
          </button>
        </div>
      </div>

      {/* ── Meta Fields: Title & Summary ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card border border-border/80 rounded-xl p-5 shadow-xs">
        <div className="md:col-span-1 space-y-1.5">
          <label className="text-xs font-medium text-foreground">Document Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setIsDirty(true)
            }}
            placeholder="e.g. Privacy Policy"
            className="w-full text-xs"
          />
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <label className="text-xs font-medium text-foreground">
            Summary / Customer Guidance Note
          </label>
          <input
            type="text"
            value={summary}
            onChange={(e) => {
              setSummary(e.target.value)
              setIsDirty(true)
            }}
            placeholder="Short summary displayed on storefront cards and search snippets..."
            className="w-full text-xs"
          />
        </div>
      </div>

      {/* ── Editor Toolbar & View Switcher ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/40 border border-border rounded-xl p-3">
        {/* Editor Mode Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium text-muted-foreground mr-1 hidden sm:inline">
            Editor Mode:
          </span>
          <button
            type="button"
            onClick={() => setEditorMode('visual')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${editorMode === 'visual'
              ? 'bg-card text-foreground shadow-xs border border-border'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Visual Document (No HTML tags)</span>
          </button>

          <button
            type="button"
            onClick={() => setEditorMode('sections')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${editorMode === 'sections'
              ? 'bg-card text-foreground shadow-xs border border-border'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
          >
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span>Clause Builder ({stats.sectionCount} Clauses)</span>
          </button>

          <button
            type="button"
            onClick={() => setEditorMode('html')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${editorMode === 'html'
              ? 'bg-card text-foreground shadow-xs border border-border'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Source Code (Advanced)</span>
          </button>
        </div>

        {/* Layout Switcher */}
        <div className="flex items-center gap-1 bg-muted/70 p-1 rounded-lg self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setLayoutMode('edit')}
            title="Editor Full Width"
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${layoutMode === 'edit'
              ? 'bg-card text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <Edit3 className="w-3.5 h-3.5 inline mr-1" />
            Editor
          </button>
          <button
            type="button"
            onClick={() => setLayoutMode('split')}
            title="Side-by-side Live Preview"
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${layoutMode === 'split'
              ? 'bg-card text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <Columns className="w-3.5 h-3.5 inline mr-1" />
            Split
          </button>
          <button
            type="button"
            onClick={() => setLayoutMode('preview')}
            title="Live Storefront Preview Only"
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${layoutMode === 'preview'
              ? 'bg-card text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <Eye className="w-3.5 h-3.5 inline mr-1" />
            Preview
          </button>
        </div>
      </div>

      {/* ── Document Statistics Pill Bar ── */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground px-1 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Hash className="w-3.5 h-3.5 text-primary" />
          <span>
            <strong className="text-foreground">{stats.sectionCount}</strong> Legal Clauses
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-primary" />
          <span>
            <strong className="text-foreground">{stats.wordCount}</strong> Words
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-primary" />
          <span>
            ~<strong className="text-foreground">{stats.readingTimeMinutes} min</strong> Reading Time
          </span>
        </div>
      </div>

      {/* ── Main Workspace: Editor and/or Live Storefront Preview ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[580px]">
        {/* Editor Column */}
        {(layoutMode === 'edit' || layoutMode === 'split') && (
          <div
            className={`flex flex-col ${layoutMode === 'split' ? 'md:col-span-6' : 'md:col-span-12'
              }`}
          >
            {editorMode === 'visual' && (
              <VisualEditor
                value={content}
                onChange={handleContentChange}
                onSave={handleSave}
                isSaving={upsertPolicy.isPending}
                isDirty={isDirty}
                onOpenTemplates={() => setIsTemplateModalOpen(true)}
              />
            )}

            {editorMode === 'sections' && (
              <SectionBuilder
                value={content}
                onChange={handleContentChange}
                onSave={handleSave}
                isSaving={upsertPolicy.isPending}
                isDirty={isDirty}
                onOpenTemplates={() => setIsTemplateModalOpen(true)}
              />
            )}

            {editorMode === 'html' && (
              <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-xs">
                <div className="px-4 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-mono text-muted-foreground">
                      Raw HTML Source (Advanced)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {stats.charCount} chars
                    </span>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={upsertPolicy.isPending}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {upsertPolicy.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>{upsertPolicy.isPending ? 'Saving...' : 'Save HTML'}</span>
                    </button>
                  </div>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Enter policy in HTML format..."
                  spellCheck={false}
                  className="flex-1 w-full p-4 font-mono text-xs bg-transparent text-foreground resize-none focus:outline-none leading-relaxed min-h-[520px]"
                />
                <div className="px-4 py-3 bg-muted/20 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {isDirty ? 'Unsaved HTML changes' : 'HTML is in sync'}
                  </span>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={upsertPolicy.isPending}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {upsertPolicy.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                    ) : (
                      <Save className="w-3.5 h-3.5 text-black" />
                    )}
                    <span>{upsertPolicy.isPending ? 'Saving Changes...' : 'Save Policy Changes'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Live Storefront Dark Preview Column */}
        {(layoutMode === 'preview' || layoutMode === 'split') && (
          <div
            className={`flex flex-col rounded-2xl border border-white/10 bg-[#0b1114] text-gray-200 overflow-hidden shadow-2xl ${layoutMode === 'split' ? 'md:col-span-6' : 'md:col-span-12'
              }`}
          >
            {/* Storefront Window Titlebar */}
            <div className="px-5 py-3 bg-[#121c21] border-b border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs font-mono text-[#598aa6] ml-2">
                  kaapilibre.com/{slug}
                </span>
              </div>
              <span className="text-[11px] text-gray-400 font-sans">
                Live Storefront Preview
              </span>
            </div>

            {/* Storefront Typography Canvas */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto max-h-[680px]">
              {/* Policy Header */}
              <div className="mb-6 pb-6 border-b border-white/10 space-y-2">
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#598aa6]/15 border border-[#598aa6]/30 text-[#598aa6] text-[10px] font-mono uppercase tracking-wider">
                  Storefront Policy
                </div>
                <h1 className="text-2xl md:text-3xl font-light text-white tracking-wide uppercase typewriter">
                  {title || 'Policy Title'}
                </h1>
                {summary && (
                  <p className="text-xs text-gray-300 italic border-l-2 border-[#598aa6] pl-3 py-0.5">
                    {summary}
                  </p>
                )}
              </div>

              {/* Policy Body HTML */}
              <div
                className="space-y-6 text-gray-300 text-sm leading-relaxed
                  [&>h2]:text-lg md:[&>h2]:text-xl [&>h2]:font-light [&>h2]:text-white [&>h2]:tracking-wide [&>h2]:mt-8 [&>h2]:mb-3 [&>h2]:pt-5 [&>h2]:border-t [&>h2]:border-white/10 [&>h2:first-child]:border-none [&>h2:first-child]:mt-0 [&>h2:first-child]:pt-0
                  [&>h3]:text-sm [&>h3]:font-medium [&>h3]:text-[#598aa6] [&>h3]:mt-4 [&>h3]:mb-1.5
                  [&>p]:text-gray-300 [&>p]:leading-relaxed [&>p]:mb-3
                  [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1.5 [&>ul]:mb-4 [&>ul>li]:text-gray-300
                  [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:space-y-1.5 [&>ol]:mb-4 [&>ol>li]:text-gray-300
                  [&>table]:w-full [&>table]:border-collapse [&>table]:my-5 [&>table]:text-xs
                  [&_th]:text-white [&_th]:font-semibold [&_th]:border-b [&_th]:border-white/20 [&_th]:p-2.5 [&_th]:text-left
                  [&_td]:text-gray-300 [&_td]:border-b [&_td]:border-white/5 [&_td]:p-2.5
                  [&_a]:text-[#598aa6] [&_a]:underline hover:[&_a]:text-white transition-colors
                  [&_strong]:text-white [&_strong]:font-semibold
                  [&_blockquote]:border-l-4 [&_blockquote]:border-[#598aa6] [&_blockquote]:bg-[#598aa6]/10 [&_blockquote]:p-3.5 [&_blockquote]:rounded-r-lg"
                dangerouslySetInnerHTML={{
                  __html:
                    content || '<p class="text-gray-500 italic">No policy content written yet...</p>',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Fixed Floating Bottom Save Bar (Always Visible) ── */}
      {/* <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl bg-card/95 border-2 border-primary/50 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isDirty ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-foreground">
              {isDirty ? 'Unsaved Policy Edits' : 'All Changes Saved'}
            </span>
            <span className="text-[10px] text-muted-foreground hidden sm:inline">
              Press Ctrl+S to save
            </span>
          </div>
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {isDirty && (
          <button
            type="button"
            onClick={() => {
              if (policy) {
                setTitle(policy.title || meta.label)
                setSummary(policy.summary || '')
                setContent(policy.content || '')
                setIsDirty(false)
              }
            }}
            className="px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            Discard
          </button>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={upsertPolicy.isPending}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-lg ring-2 ring-amber-400/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
        >
          {upsertPolicy.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin text-black" />
          ) : (
            <Save className="w-4 h-4 text-black" />
          )}
          <span>{upsertPolicy.isPending ? 'Saving...' : 'Save Policy Changes'}</span>
        </button>
      </div> */}

      {/* Reset Confirmation Modal */}
      <ResetTemplateModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleResetToDefault}
        policyName={meta.label}
      />

      {/* Template Insert Modal */}
      <InsertTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onInsert={(html) => handleContentChange(content + '\n' + html)}
      />
    </div>
  )
}
