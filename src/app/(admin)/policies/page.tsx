'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  Scale,
  Truck,
  RotateCcw,
  Cookie,
  ExternalLink,
  Edit3,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Loader2,
  Search,
  BookOpen,
  Hash,
} from 'lucide-react'
import { usePolicies, useTogglePolicyPublish } from '@/hooks/usePolicies'
import {
  POLICY_CATALOG,
  STARTER_POLICIES,
  calculateReadingStats,
} from '@/lib/policyDefaults'
import type { PolicySlug } from '@/types'

const POLICY_ICONS: Record<PolicySlug, any> = {
  'privacy-policy': ShieldCheck,
  'terms-and-conditions': Scale,
  'shipping-policy': Truck,
  'cancellation-refund-policy': RotateCcw,
  'cookie-policy': Cookie,
}

export default function PoliciesPage() {
  const { data: policies, isLoading, error, refetch } = usePolicies()
  const togglePublish = useTogglePolicyPublish()

  const [togglingSlug, setTogglingSlug] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const handleTogglePublish = async (slug: string) => {
    setTogglingSlug(slug)
    try {
      await togglePublish.mutateAsync(slug)
    } finally {
      setTogglingSlug(null)
    }
  }

  const policyList = policies || []

  // Filtered policies list based on search
  const filteredSlugs = useMemo(() => {
    const slugs = Object.keys(POLICY_CATALOG) as PolicySlug[]
    if (!searchQuery.trim()) return slugs

    const q = searchQuery.toLowerCase().trim()
    return slugs.filter((slug) => {
      const meta = POLICY_CATALOG[slug]
      const pol = policyList.find((p) => p.slug === slug)
      const title = pol?.title || meta.label
      const summary = pol?.summary || meta.description
      return (
        title.toLowerCase().includes(q) ||
        summary.toLowerCase().includes(q) ||
        slug.toLowerCase().includes(q)
      )
    })
  }, [searchQuery, policyList])

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* ── Header Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-card/90 via-card to-card/70 border border-border/80 p-6 md:p-8 backdrop-blur-md shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono tracking-wider uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Legal Policies & Compliance CMS</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Storefront Legal Policies
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Update your legal terms, shipping procedures, and policies visually like a document. No complex HTML or tag confusion — edit clauses naturally, reorder sections, and preview live on your storefront.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-card/90 border border-border rounded-xl px-4 py-3 text-center min-w-[120px] shadow-sm">
              <span className="text-xs text-muted-foreground uppercase font-mono block">Published</span>
              <span className="text-xl font-bold text-emerald-400">
                {policyList.filter((p) => p.isPublished).length} / 5
              </span>
            </div>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search policies by name, keyword, or slug..."
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Visual WYSIWYG & Clause Builder enabled</span>
        </div>
      </div>

      {/* ── Loading State ── */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Loading legal policies...</p>
        </div>
      )}

      {/* ── Error State ── */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
          <h3 className="font-semibold text-foreground">Failed to load policies</h3>
          <p className="text-sm text-muted-foreground">
            {(error as any)?.message || 'An error occurred while fetching policy data from the server.'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Policy Cards Grid ── */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSlugs.map((slug) => {
            const meta = POLICY_CATALOG[slug]
            const policy = policyList.find((p) => p.slug === slug)
            const Icon = POLICY_ICONS[slug] || ShieldCheck
            const isPublished = policy ? policy.isPublished : true
            const isToggling = togglingSlug === slug

            // Content stats
            const content = policy?.content || STARTER_POLICIES[slug]?.content || ''
            const stats = calculateReadingStats(content)

            return (
              <div
                key={slug}
                className="group relative flex flex-col justify-between rounded-2xl bg-card border border-border/80 hover:border-primary/40 hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                {/* Top status & icon bar */}
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center border bg-gradient-to-br ${meta.accentColor} shadow-inner`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTogglePublish(slug)}
                        disabled={isToggling}
                        title={isPublished ? 'Click to unpublish (draft)' : 'Click to publish live'}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                          isPublished
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                        }`}
                      >
                        {isToggling ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : isPublished ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <EyeOff className="w-3 h-3" />
                        )}
                        <span>{isPublished ? 'Published' : 'Draft'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Title & Slug */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      {policy?.title || meta.label}
                    </h3>
                    <code className="text-[11px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                      {meta.websitePath}
                    </code>
                  </div>

                  {/* Summary / Description */}
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {policy?.summary || meta.description}
                  </p>

                  {/* Document Metrics */}
                  <div className="flex items-center gap-3 pt-2 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Hash className="w-3 h-3 text-primary" />
                      <span>{stats.sectionCount} Clauses</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-primary" />
                      <span>{stats.wordCount} words</span>
                    </span>
                  </div>
                </div>

                {/* Card Footer: Metadata & Actions */}
                <div className="p-4 bg-muted/20 border-t border-border/60 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {policy?.updatedAt
                        ? new Date(policy.updatedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Default seeded'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`http://localhost:3000${meta.websitePath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View live page on storefront"
                      className="p-2 rounded-lg bg-card hover:bg-accent border border-border text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <Link
                      href={`/policies/${slug}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-black" />
                      <span>Edit Policy</span>
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
