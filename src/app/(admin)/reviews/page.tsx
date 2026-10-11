'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Star,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Trash2,
  Search,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Send,
  X,
  Clock,
  Sparkles,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  useReviews,
  useReviewStats,
  useUpdateReviewStatus,
  useReplyReview,
  useDeleteReview,
} from '@/hooks/useReviews'
import { formatDateTime, cn } from '@/lib/utils'
import type { Review, ReviewStatus } from '@/types'

const STATUS_CONFIG: Record<
  ReviewStatus,
  { label: string; badgeClass: string; icon: any }
> = {
  pending: {
    label: 'Pending Moderation',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    icon: Clock,
  },
  approved: {
    label: 'Approved',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected',
    badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    icon: XCircle,
  },
}

export default function ReviewsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [search, setSearch] = useState('')
  const [rating, setRating] = useState<number | undefined>(undefined)
  const [page, setPage] = useState(1)

  // Reply modal state
  const [replyingReview, setReplyingReview] = useState<Review | null>(null)
  const [replyText, setReplyText] = useState('')

  // Query & mutation hooks
  const { data: stats } = useReviewStats()
  const { data, isLoading } = useReviews({
    status: activeTab === 'all' ? undefined : activeTab,
    search: search || undefined,
    rating: rating || undefined,
    page,
    limit: 15,
  })

  const updateStatusMutation = useUpdateReviewStatus()
  const replyMutation = useReplyReview()
  const deleteMutation = useDeleteReview()

  const reviews = data?.reviews ?? []
  const pagination = data?.pagination

  const handleOpenReplyModal = (review: Review) => {
    setReplyingReview(review)
    setReplyText(review.adminReply?.comment || '')
  }

  const handleSendReply = () => {
    if (!replyingReview || !replyText.trim()) return
    replyMutation.mutate(
      { id: replyingReview._id, comment: replyText.trim() },
      {
        onSuccess: () => {
          setReplyingReview(null)
          setReplyText('')
        },
      }
    )
  }

  const handleDelete = (review: Review) => {
    if (confirm(`Are you sure you want to delete the review by "${review.name}"?`)) {
      deleteMutation.mutate(review._id)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Reviews"
        description={
          stats
            ? `${stats.total} total reviews • ${stats.pending} pending moderation`
            : 'Moderate customer ratings and product reviews'
        }
      />

      {/* Status Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {(
          [
            { id: 'pending', label: 'Pending', count: stats?.pending },
            { id: 'approved', label: 'Approved', count: stats?.approved },
            { id: 'rejected', label: 'Rejected', count: stats?.rejected },
            { id: 'all', label: 'All Reviews', count: stats?.total },
          ] as const
        ).map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                setPage(1)
              }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent'
              )}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={cn(
                    'text-[11px] font-bold px-2 py-0.5 rounded-full',
                    isActive
                      ? 'bg-amber-400 text-stone-950'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search by customer, email, product, or comment..."
            className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:border-amber-500"
          />
        </div>

        <select
          value={rating ?? ''}
          onChange={(e) => {
            const val = e.target.value ? Number(e.target.value) : undefined
            setRating(val)
            setPage(1)
          }}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-amber-500"
        >
          <option value="">All Ratings</option>
          <option value="5">5 Stars ★★★★★</option>
          <option value="4">4 Stars ★★★★☆</option>
          <option value="3">3 Stars ★★★☆☆</option>
          <option value="2">2 Stars ★★☆☆☆</option>
          <option value="1">1 Star ★☆☆☆☆</option>
        </select>

        {(search || rating !== undefined) && (
          <button
            onClick={() => {
              setSearch('')
              setRating(undefined)
              setPage(1)
            }}
            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 rounded-xl border border-border bg-card/50 animate-pulse"
            />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
            <Star className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No reviews found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {activeTab === 'pending'
              ? 'No pending reviews currently require moderation. Great job!'
              : 'There are no reviews matching your current filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => {
            const statusInfo = STATUS_CONFIG[rev.status]
            const StatusIcon = statusInfo.icon

            const primaryImg =
              rev.product?.images?.find((i) => i.isPrimary)?.url ||
              rev.product?.images?.[0]?.url

            return (
              <div
                key={rev._id}
                className="rounded-xl border border-border bg-card p-5 space-y-4 transition-all hover:border-border/80"
              >
                {/* Header Row: Product info & Status */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {primaryImg ? (
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-border flex-shrink-0 relative">
                        <Image
                          src={primaryImg}
                          alt={rev.product?.name || 'Product'}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {rev.product?.name || 'Unknown Product'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Submitted {formatDateTime(rev.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
                        statusInfo.badgeClass
                      )}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                {/* Rating & Author Row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Stars */}
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            'w-4 h-4',
                            star <= rev.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-muted-foreground/30'
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      {rev.rating}.0
                    </span>

                    {rev.isVerifiedPurchase && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full ml-2">
                        <BadgeCheck className="w-3.5 h-3.5" />
                        Verified Buyer
                      </span>
                    )}
                  </div>

                  {/* Customer Identity */}
                  <div className="text-xs text-muted-foreground">
                    By{' '}
                    <span className="font-medium text-foreground">
                      {rev.name}
                    </span>{' '}
                    <span className="opacity-75">({rev.email})</span>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-1">
                  {rev.title && (
                    <h4 className="text-sm font-semibold text-foreground">
                      {rev.title}
                    </h4>
                  )}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {rev.comment}
                  </p>
                </div>

                {/* Official Admin Reply (if exists) */}
                {rev.adminReply && (
                  <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3.5 space-y-1.5 ml-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        KaapiLibre Team Response
                      </span>
                      <span className="text-muted-foreground text-[11px]">
                        {formatDateTime(rev.adminReply.repliedAt)}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/90 leading-relaxed">
                      {rev.adminReply.comment}
                    </p>
                  </div>
                )}

                {/* Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    {/* Approve button */}
                    {rev.status !== 'approved' && (
                      <button
                        onClick={() =>
                          updateStatusMutation.mutate({
                            id: rev._id,
                            status: 'approved',
                          })
                        }
                        disabled={updateStatusMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve
                      </button>
                    )}

                    {/* Reject button */}
                    {rev.status !== 'rejected' && (
                      <button
                        onClick={() =>
                          updateStatusMutation.mutate({
                            id: rev._id,
                            status: 'rejected',
                          })
                        }
                        disabled={updateStatusMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/30 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    )}

                    {/* Reset to pending button if approved/rejected */}
                    {rev.status !== 'pending' && (
                      <button
                        onClick={() =>
                          updateStatusMutation.mutate({
                            id: rev._id,
                            status: 'pending',
                          })
                        }
                        disabled={updateStatusMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground border border-border hover:text-foreground transition-colors"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Set to Pending
                      </button>
                    )}

                    {/* Reply button */}
                    <button
                      onClick={() => handleOpenReplyModal(rev)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      {rev.adminReply ? 'Edit Reply' : 'Add Reply'}
                    </button>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(rev)}
                    disabled={deleteMutation.isPending}
                    className="p-1.5 text-muted-foreground hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-500/10"
                    title="Delete review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
          <p>
            Showing Page <span className="text-foreground font-semibold">{pagination.page}</span> of{' '}
            <span className="text-foreground font-semibold">{pagination.totalPages}</span> ({pagination.totalItems} total)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 border border-border rounded-lg disabled:opacity-40 hover:text-foreground transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="px-3 py-1.5 border border-border rounded-lg disabled:opacity-40 hover:text-foreground transition-colors flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {replyingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Official Response
                </h3>
                <p className="text-xs text-muted-foreground">
                  Reply to {replyingReview.name}'s review on {replyingReview.product?.name}
                </p>
              </div>
              <button
                onClick={() => setReplyingReview(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Original review quote */}
            <div className="rounded-lg bg-muted/40 border border-border/50 p-3 text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-1 text-amber-400">
                {'★'.repeat(replyingReview.rating)}
                {'☆'.repeat(5 - replyingReview.rating)}
              </div>
              <p className="italic">"{replyingReview.comment}"</p>
            </div>

            {/* Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Your Response (visible publicly under the review)
              </label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
                placeholder="Thank you for your feedback! We're glad you enjoyed the roast..."
                className="w-full p-3 bg-muted/20 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setReplyingReview(null)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSendReply}
                disabled={!replyText.trim() || replyMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {replyMutation.isPending ? 'Saving...' : 'Post Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
