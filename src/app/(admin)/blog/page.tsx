'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Clock, BookOpen, Eye, Trash2, Globe, FileText } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useBlogs, useDeleteBlog, useTogglePublish } from '@/hooks/useBlog'
import { formatDate } from '@/lib/utils'

type StatusFilter = 'all' | 'published' | 'draft'

export default function BlogPage() {
  const router = useRouter()
  const [search, setSearch]       = useState('')
  const [status, setStatus]       = useState<StatusFilter>('all')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const { data, isLoading } = useBlogs({ status, search: search || undefined, limit: 50 })
  const deleteBlog    = useDeleteBlog()
  const togglePublish = useTogglePublish()

  const blogs = data?.data || []
  const publishedCount = blogs.filter(b => b.status === 'published').length
  const draftCount     = blogs.filter(b => b.status === 'draft').length

  return (
    <div>
      <PageHeader
        title="Blog"
        description={`${blogs.length} posts · ${publishedCount} published · ${draftCount} drafts`}
        action={
          <button onClick={() => router.push('/blog/new')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: '#d4a853', color: '#1a1713' }}>
            <Plus className="w-4 h-4" /> New post
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search posts..." style={{ paddingLeft: '2.25rem' }} />
        </div>
        <div className="flex gap-1 p-1 rounded-lg bg-muted">
          {(['all', 'published', 'draft'] as StatusFilter[]).map(f => (
            <button key={f} onClick={() => setStatus(f)}
              className="px-4 py-1.5 rounded-md text-xs font-medium capitalize transition-all"
              style={status === f ? { background: '#d4a853', color: '#1a1713' } : { color: 'var(--muted-foreground)' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Post list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : blogs.length > 0 ? (
        <div className="space-y-3">
          {blogs.map(blog => (
            <div key={blog._id}
              className="rounded-xl border border-border bg-card hover:border-primary/20 transition-colors group">
              <div className="flex items-start gap-4 p-4">

                {/* Cover thumbnail */}
                <div className="w-20 h-20 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                  {blog.coverImage?.url ? (
                    <img src={blog.coverImage.url} alt={blog.title}
                      className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {/* Status badge */}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                          blog.status === 'published'
                            ? 'border-green-500/30 bg-green-500/10 text-green-500'
                            : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-500'
                        }`}>
                          {blog.status === 'published' ? 'Published' : 'Draft'}
                        </span>
                        {blog.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-secondary text-muted-foreground">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <h3 className="font-medium text-foreground text-sm leading-snug truncate">{blog.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{blog.excerpt}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Edit */}
                      <button onClick={() => router.push(`/blog/${blog._id}`)}
                        title="Edit post"
                        className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Publish/Unpublish toggle */}
                      <button
                        onClick={() => togglePublish.mutate(blog._id)}
                        title={blog.status === 'published' ? 'Move to draft' : 'Publish'}
                        className={`p-1.5 rounded-md transition-colors ${
                          blog.status === 'published'
                            ? 'hover:bg-yellow-500/10 text-green-500 hover:text-yellow-500'
                            : 'hover:bg-green-500/10 text-muted-foreground hover:text-green-500'
                        }`}>
                        {blog.status === 'published'
                          ? <FileText className="w-3.5 h-3.5" />
                          : <Globe className="w-3.5 h-3.5" />}
                      </button>

                      {/* Delete */}
                      {deleteTarget === blog._id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => { deleteBlog.mutate(blog._id); setDeleteTarget(null) }}
                            className="px-2 py-1 rounded text-xs bg-red-500 text-white">
                            Delete
                          </button>
                          <button onClick={() => setDeleteTarget(null)}
                            className="px-2 py-1 rounded text-xs border border-border text-muted-foreground">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteTarget(blog._id)}
                          title="Delete post"
                          className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {blog.readTimeMinutes} min read
                    </span>
                    {blog.publishedAt && (
                      <span>{formatDate(blog.publishedAt)}</span>
                    )}
                    {!blog.publishedAt && (
                      <span>Created {formatDate(blog.createdAt)}</span>
                    )}
                    <span>{blog.blocks?.length || 0} blocks</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-muted-foreground">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">
            {status === 'draft' ? 'No draft posts' : status === 'published' ? 'No published posts' : 'No blog posts yet'}
          </p>
          <p className="text-xs mt-1">Click "New post" to write your first blog post.</p>
        </div>
      )}
    </div>
  )
}
