'use client'
import { use, useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft, Loader2, Plus, Trash2, GripVertical, Type, Image,
  Quote, Heading, Upload, Globe, FileText, X, AlertTriangle,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  useBlog, useCreateBlog, useUpdateBlog, useDeleteBlog,
  useTogglePublish, useUploadCoverImage, useUploadBlockImage, useDeleteBlockImage,
  type BlogBlock,
} from '@/hooks/useBlog'
import { formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'

// ── Meta form schema ──────────────────────────────────────────────────────────
const metaSchema = z.object({
  title:   z.string().min(3, 'Title required'),
  excerpt: z.string().min(10, 'Excerpt required').max(300, 'Max 300 characters'),
  tags:    z.string(), // comma-separated, parsed on submit
})
type MetaForm = z.infer<typeof metaSchema>

// ── Block type config ─────────────────────────────────────────────────────────
const BLOCK_TYPES = [
  { type: 'heading',   icon: Heading, label: 'Heading',   hint: 'Section title' },
  { type: 'paragraph', icon: Type,    label: 'Paragraph', hint: 'Body text' },
  { type: 'quote',     icon: Quote,   label: 'Quote',     hint: 'Blockquote' },
  { type: 'image',     icon: Image,   label: 'Image',     hint: 'Photo with caption' },
] as const

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BlogEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: urlParam } = use(params)
  const router = useRouter()
  const isNew = urlParam === 'new'

  const { data: blog, isLoading } = useBlog(isNew ? '' : urlParam)
  const blogId = blog?._id ?? urlParam

  const createBlog    = useCreateBlog()
  const updateBlog    = useUpdateBlog()
  const deleteBlog    = useDeleteBlog()
  const togglePublish = useTogglePublish()
  const uploadCover   = useUploadCoverImage()
  const uploadBlock   = useUploadBlockImage()
  const deleteBlock   = useDeleteBlockImage()

  // Block state — local copy, saved on explicit save
  const [blocks, setBlocks]           = useState<BlogBlock[]>([])
  const [tagInput, setTagInput]       = useState('')
  const [showDelete, setShowDelete]   = useState(false)
  const [showBlockMenu, setShowBlockMenu] = useState(false)
  const [isDirty, setIsDirty]         = useState(false)
  const [createdId, setCreatedId]     = useState<string | null>(null) // after first create
  const fileInputRef = useRef<HTMLInputElement>(null)

  // The working ID — either from URL (existing) or from the just-created post
  const workingId = isNew ? (createdId ?? '') : blogId

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<MetaForm>({
    resolver: zodResolver(metaSchema),
    defaultValues: { title: '', excerpt: '', tags: '' },
  })

  // Populate form from fetched blog
  useEffect(() => {
    if (blog) {
      reset({
        title:   blog.title,
        excerpt: blog.excerpt,
        tags:    blog.tags.join(', '),
      })
      setBlocks(blog.blocks.sort((a, b) => a.order - b.order))
    }
  }, [blog, reset])

  // ── Save (meta + blocks) ────────────────────────────────────────────────────
  const onSave = async (meta: MetaForm) => {
    const tags = meta.tags.split(',').map(t => t.trim()).filter(Boolean)
    const orderedBlocks = blocks.map((b, i) => ({ ...b, order: i }))

    const payload = {
      title:   meta.title,
      excerpt: meta.excerpt,
      tags,
      blocks:  orderedBlocks,
    }

    try {
      if (isNew && !createdId) {
        // First save — create the post
        const res = await createBlog.mutateAsync({ ...payload, status: 'draft' } as any) as any
        const id = res?.data?._id
        if (id) {
          setCreatedId(id)
          router.replace(`/blog/${id}`)
          toast.success('Blog post created')
        }
      } else {
        await updateBlog.mutateAsync({ id: workingId, data: payload as any })
      }
      setIsDirty(false)
    } catch {}
  }

  // ── Publish / unpublish ─────────────────────────────────────────────────────
  const handleTogglePublish = async () => {
    if (!workingId) { toast.error('Save the post first'); return }
    await togglePublish.mutateAsync(workingId)
    toast.success(blog?.status === 'published' ? 'Moved to draft' : 'Published!')
  }

  // ── Block operations ────────────────────────────────────────────────────────
  const addBlock = (type: BlogBlock['type']) => {
    const newBlock: BlogBlock = {
      type,
      content: type !== 'image' ? '' : undefined,
      url: type === 'image' ? '' : undefined,
      caption: type === 'image' ? '' : undefined,
      order: blocks.length,
    }
    setBlocks(b => [...b, newBlock])
    setIsDirty(true)
    setShowBlockMenu(false)
  }

  const updateBlockContent = (idx: number, field: keyof BlogBlock, value: string) => {
    setBlocks(b => b.map((block, i) => i === idx ? { ...block, [field]: value } : block))
    setIsDirty(true)
  }

  const removeBlock = async (idx: number) => {
    const block = blocks[idx]
    // If image block with a publicId, delete from Cloudinary too
    if (block.type === 'image' && block.publicId && workingId) {
      deleteBlock.mutate({ id: workingId, publicId: block.publicId })
    }
    setBlocks(b => b.filter((_, i) => i !== idx))
    setIsDirty(true)
  }

  const moveBlock = (idx: number, dir: 'up' | 'down') => {
    const newBlocks = [...blocks]
    const swap = dir === 'up' ? idx - 1 : idx + 1
    if (swap < 0 || swap >= newBlocks.length) return
    ;[newBlocks[idx], newBlocks[swap]] = [newBlocks[swap], newBlocks[idx]]
    setBlocks(newBlocks)
    setIsDirty(true)
  }

  // ── Block image upload ──────────────────────────────────────────────────────
  const handleBlockImageUpload = async (idx: number, file: File) => {
    if (!workingId) { toast.error('Save the post first before uploading images'); return }
    try {
      const res = await uploadBlock.mutateAsync({ id: workingId, file }) as any
      const { url, publicId } = res?.data || {}
      setBlocks(b => b.map((block, i) =>
        i === idx ? { ...block, url, publicId } : block
      ))
      setIsDirty(true)
      toast.success('Image uploaded')
    } catch {}
  }

  // ── Cover image upload ──────────────────────────────────────────────────────
  const handleCoverUpload = async (file: File) => {
    if (!workingId) { toast.error('Save the post first before uploading a cover'); return }
    await uploadCover.mutateAsync({ id: workingId, file })
  }

  const isSaving = createBlog.isPending || updateBlog.isPending

  if (isLoading && !isNew) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
  }
  if (!isNew && !blog && !isLoading) {
    return <div className="text-muted-foreground p-4">Blog post not found</div>
  }

  const currentStatus = blog?.status ?? 'draft'

  return (
    <div>
      <PageHeader
        title={isNew ? 'New blog post' : (blog?.title || 'Edit post')}
        action={
          <div className="flex items-center gap-2">
            {isDirty && (
              <span className="text-xs text-yellow-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Unsaved changes
              </span>
            )}
            {/* Status badge */}
            {!isNew && (
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                currentStatus === 'published'
                  ? 'border-green-500/30 bg-green-500/10 text-green-500'
                  : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-500'
              }`}>
                {currentStatus === 'published' ? 'Published' : 'Draft'}
              </span>
            )}
            <button onClick={() => router.back()}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: blocks editor ─────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Meta fields */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Post details</p>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Title *</label>
              <input {...register('title')}
                placeholder="Your blog post title..."
                className="text-base font-medium"
                onChange={e => { register('title').onChange(e); setIsDirty(true) }}
              />
              {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Excerpt * <span className="text-muted-foreground/60">({watch('excerpt')?.length || 0}/300)</span>
              </label>
              <textarea {...register('excerpt')} rows={2}
                placeholder="A short summary shown in the blog listing..."
                onChange={e => { register('excerpt').onChange(e); setIsDirty(true) }}
              />
              {errors.excerpt && <p className="text-xs text-red-400 mt-1">{errors.excerpt.message}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Tags <span className="text-muted-foreground/60">comma-separated</span>
              </label>
              <input {...register('tags')} placeholder="coffee, brewing, origin"
                onChange={e => { register('tags').onChange(e); setIsDirty(true) }}
              />
            </div>
          </div>

          {/* Content blocks */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Content blocks ({blocks.length})
              </p>
              {blog?.readTimeMinutes && (
                <span className="text-xs text-muted-foreground">{blog.readTimeMinutes} min read</span>
              )}
            </div>

            {/* Block list */}
            <div className="space-y-3 mb-4">
              {blocks.length === 0 && (
                <div className="py-10 text-center border border-dashed border-border rounded-xl">
                  <Type className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No content yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Click "Add block" below to start writing</p>
                </div>
              )}

              {blocks.map((block, idx) => (
                <div key={idx} className="group relative rounded-xl border border-border bg-background">
                  {/* Block header */}
                  <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
                    <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex-1">
                      {BLOCK_TYPES.find(t => t.type === block.type)?.label ?? block.type}
                    </span>
                    {/* Move up/down */}
                    <button onClick={() => moveBlock(idx, 'up')} disabled={idx === 0}
                      className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                      ↑
                    </button>
                    <button onClick={() => moveBlock(idx, 'down')} disabled={idx === blocks.length - 1}
                      className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                      ↓
                    </button>
                    <button onClick={() => removeBlock(idx)}
                      className="p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Block content */}
                  <div className="px-3 pb-3">
                    {block.type === 'paragraph' && (
                      <textarea
                        value={block.content ?? ''}
                        onChange={e => updateBlockContent(idx, 'content', e.target.value)}
                        placeholder="Write your paragraph here..."
                        rows={4}
                        style={{ resize: 'vertical' }}
                      />
                    )}

                    {block.type === 'heading' && (
                      <input
                        value={block.content ?? ''}
                        onChange={e => updateBlockContent(idx, 'content', e.target.value)}
                        placeholder="Section heading..."
                        className="text-lg font-semibold"
                      />
                    )}

                    {block.type === 'quote' && (
                      <textarea
                        value={block.content ?? ''}
                        onChange={e => updateBlockContent(idx, 'content', e.target.value)}
                        placeholder="Enter quote text..."
                        rows={2}
                        style={{
                          borderLeft: '3px solid #d4a853',
                          borderRadius: '0 8px 8px 0',
                          paddingLeft: '12px',
                          fontStyle: 'italic',
                          resize: 'vertical',
                        }}
                      />
                    )}

                    {block.type === 'image' && (
                      <div className="space-y-2">
                        {/* Image preview or upload */}
                        {block.url ? (
                          <div className="relative rounded-lg overflow-hidden bg-muted group/img">
                            <img src={block.url} alt={block.caption || 'Block image'}
                              className="w-full max-h-64 object-cover" />
                            <button
                              type="button"
                              onClick={() => {
                                if (block.publicId && workingId) {
                                  deleteBlock.mutate({ id: workingId, publicId: block.publicId })
                                }
                                updateBlockContent(idx, 'url', '')
                                updateBlockContent(idx, 'publicId', '')
                              }}
                              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-red-500 flex items-center justify-center text-white transition-colors opacity-0 group-hover/img:opacity-100">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-border hover:border-primary/40 cursor-pointer transition-colors text-muted-foreground hover:text-foreground">
                            {uploadBlock.isPending ? (
                              <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                              <>
                                <Upload className="w-6 h-6 mb-2" />
                                <span className="text-xs">Click to upload image</span>
                                <span className="text-[10px] mt-1 text-muted-foreground/60">JPG, PNG, WebP · max 5MB</span>
                              </>
                            )}
                            <input type="file" accept="image/*" className="hidden"
                              onChange={e => {
                                const f = e.target.files?.[0]
                                if (f) handleBlockImageUpload(idx, f)
                                e.target.value = ''
                              }}
                            />
                          </label>
                        )}
                        {/* Caption */}
                        <input
                          value={block.caption ?? ''}
                          onChange={e => updateBlockContent(idx, 'caption', e.target.value)}
                          placeholder="Image caption (optional)..."
                          style={{ fontSize: '12px' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add block button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowBlockMenu(!showBlockMenu)}
                className="flex items-center justify-center gap-2 w-full h-10 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
                <Plus className="w-4 h-4" /> Add block
              </button>

              {/* Block type picker */}
              {showBlockMenu && (
                <div className="absolute bottom-12 left-0 right-0 rounded-xl border border-border bg-popover shadow-xl z-20 p-2">
                  <div className="grid grid-cols-2 gap-1.5">
                    {BLOCK_TYPES.map(({ type, icon: Icon, label, hint }) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => addBlock(type)}
                        className="flex items-center gap-2.5 p-3 rounded-lg hover:bg-accent text-left transition-colors group/btn">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(212,168,83,0.1)' }}>
                          <Icon className="w-4 h-4" style={{ color: '#d4a853' }} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{label}</p>
                          <p className="text-[10px] text-muted-foreground">{hint}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Save button */}
          <button
            type="button"
            onClick={handleSubmit(onSave)}
            disabled={isSaving}
            className="w-full h-11 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity"
            style={{ background: '#d4a853', color: '#1a1713' }}>
            {isSaving
              ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</>
              : isNew ? 'Create post' : 'Save changes'}
          </button>
        </div>

        {/* ── Right: cover image + publish controls ───────────────────── */}
        <div className="space-y-5">

          {/* Publish controls */}
          <div className={`rounded-xl border p-5 ${currentStatus === 'published' ? 'border-green-500/30 bg-green-500/5' : 'border-border bg-card'}`}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Status</p>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-foreground capitalize">{currentStatus}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {currentStatus === 'published'
                    ? blog?.publishedAt ? `Published ${formatDateTime(blog.publishedAt)}` : 'Live on website'
                    : 'Not visible to visitors'}
                </p>
              </div>
              <div className={`w-2.5 h-2.5 rounded-full ${currentStatus === 'published' ? 'bg-green-500' : 'bg-yellow-500'}`} />
            </div>
            <button
              type="button"
              onClick={handleTogglePublish}
              disabled={togglePublish.isPending || (isNew && !createdId)}
              className={`w-full h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-all ${
                currentStatus === 'published'
                  ? 'border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/10'
                  : 'border border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-500/10'
              }`}>
              {togglePublish.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : currentStatus === 'published'
                  ? <><FileText className="w-4 h-4" />Move to draft</>
                  : <><Globe className="w-4 h-4" />Publish now</>}
            </button>
            {isNew && !createdId && (
              <p className="text-[10px] text-muted-foreground mt-2 text-center">Save the post first to publish</p>
            )}
          </div>

          {/* Cover image */}
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Cover image</p>
            {blog?.coverImage?.url ? (
              <div className="relative rounded-lg overflow-hidden bg-muted mb-3 group/cover">
                <img src={blog.coverImage.url} alt="Cover" className="w-full h-40 object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center">
                  <label className="px-3 py-1.5 rounded-lg bg-white/90 text-xs font-medium text-gray-800 cursor-pointer hover:bg-white transition-colors">
                    Replace
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); e.target.value = '' }} />
                  </label>
                </div>
              </div>
            ) : (
              <label className={`flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-border hover:border-primary/40 cursor-pointer transition-colors text-muted-foreground hover:text-foreground mb-2 ${(!workingId) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {uploadCover.isPending ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 mb-2" />
                    <span className="text-xs">Upload cover image</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" disabled={!workingId || uploadCover.isPending}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); e.target.value = '' }} />
              </label>
            )}
            {!workingId && (
              <p className="text-[10px] text-muted-foreground text-center">Save the post first to upload cover</p>
            )}
          </div>

          {/* Post info (edit mode only) */}
          {!isNew && blog && (
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Info</p>
              <div className="space-y-2 text-xs">
                {[
                  ['Slug', blog.slug],
                  ['Author', blog.author?.name],
                  ['Created', formatDateTime(blog.createdAt)],
                  ['Updated', formatDateTime(blog.updatedAt)],
                  ['Read time', `${blog.readTimeMinutes} min`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="text-foreground font-mono text-[11px] truncate text-right">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delete */}
          {!isNew && (
            <div>
              {!showDelete ? (
                <button type="button" onClick={() => setShowDelete(true)}
                  className="w-full h-10 rounded-xl text-sm font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                  Delete post
                </button>
              ) : (
                <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 space-y-3">
                  <p className="text-sm font-medium text-red-400">Delete permanently?</p>
                  <p className="text-xs text-muted-foreground">All images will be removed from Cloudinary. This cannot be undone.</p>
                  <div className="flex gap-2">
                    <button type="button"
                      onClick={async () => { await deleteBlog.mutateAsync(blogId); router.push('/blog') }}
                      disabled={deleteBlog.isPending}
                      className="flex-1 h-9 rounded-lg text-sm bg-red-500 text-white disabled:opacity-60">
                      {deleteBlog.isPending ? 'Deleting...' : 'Yes, delete'}
                    </button>
                    <button type="button" onClick={() => setShowDelete(false)}
                      className="flex-1 h-9 rounded-lg text-sm border border-border text-muted-foreground hover:text-foreground">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
