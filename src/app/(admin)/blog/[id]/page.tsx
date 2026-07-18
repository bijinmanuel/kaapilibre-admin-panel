'use client'
import { use, useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft, Loader2, Plus, Trash2, GripVertical, Type, Image,
  Quote, Heading, Upload, Globe, FileText, X, AlertTriangle,
  Eye, Smartphone, Laptop,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  useBlog, useCreateBlog, useUpdateBlog, useDeleteBlog,
  useTogglePublish, useUploadCoverImage, useUploadBlockImage, useDeleteBlockImage,
  type BlogBlock,
} from '@/hooks/useBlog'
import { formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'

// ── Meta form schema ──────────────────────────────────────────────────────────
const metaSchema = z.object({
  title: z.string().min(3, 'Title required'),
  excerpt: z.string().min(10, 'Excerpt required').max(300, 'Max 300 characters'),
  tags: z.string(), // comma-separated, parsed on submit
})
type MetaForm = z.infer<typeof metaSchema>

// ── Block type config ─────────────────────────────────────────────────────────
const BLOCK_TYPES = [
  { type: 'heading', icon: Heading, label: 'Heading', hint: 'Section title' },
  { type: 'paragraph', icon: Type, label: 'Paragraph', hint: 'Body text' },
  { type: 'quote', icon: Quote, label: 'Quote', hint: 'Blockquote' },
  { type: 'image', icon: Image, label: 'Image', hint: 'Photo with caption' },
] as const

const isUrl = (str?: string) => {
  if (!str) return false
  return str.startsWith('http://') || str.startsWith('https://')
}

const getDomainName = (urlStr: string) => {
  try {
    const url = new URL(urlStr)
    return url.hostname.replace('www.', '')
  } catch {
    return 'Link'
  }
}

const getImageLink = (imageObj?: { attribution?: string; attributes?: { key: string; value: string }[] }) => {
  if (!imageObj) return null
  if (imageObj.attribution && (imageObj.attribution.startsWith('http://') || imageObj.attribution.startsWith('https://'))) {
    return imageObj.attribution
  }
  const linkAttr = imageObj.attributes?.find(attr => attr.value && (attr.value.startsWith('http://') || attr.value.startsWith('https://')))
  if (linkAttr) {
    return linkAttr.value
  }
  return null
}

// ── Image Attributes Section Helper ──────────────────────────────────────────
interface ImageAttributesProps {
  caption: string
  altText: string
  attribution: string
  attributes: { key: string; value: string }[]
  onChange: (field: string, value: any) => void
  idKey: 'cover' | number
  addingAttrFor: 'cover' | number | null
  setAddingAttrFor: (val: 'cover' | number | null) => void
  newAttrKey: string
  setNewAttrKey: (val: string) => void
  newAttrVal: string
  setNewAttrVal: (val: string) => void
}

function ImageAttributesSection({
  caption,
  altText,
  attribution,
  attributes,
  onChange,
  idKey,
  addingAttrFor,
  setAddingAttrFor,
  newAttrKey,
  setNewAttrKey,
  newAttrVal,
  setNewAttrVal
}: ImageAttributesProps) {
  return (
    <div className="space-y-2 mt-3 pt-3 border-t border-border/40">
      <div>
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Caption</label>
        <input
          type="text"
          value={caption}
          onChange={e => onChange('caption', e.target.value)}
          placeholder="Image caption..."
          className="text-xs h-7 px-2 py-1 rounded-lg border border-border bg-background w-full"
          style={{ padding: '4px 8px' }}
        />
      </div>
      <div>
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Alt Text (SEO/Accessibility)</label>
        <input
          type="text"
          value={altText}
          onChange={e => onChange('altText', e.target.value)}
          placeholder="Describe the image..."
          className="text-xs h-7 px-2 py-1 rounded-lg border border-border bg-background w-full"
          style={{ padding: '4px 8px' }}
        />
      </div>
      <div>
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Attribution / Credit</label>
        <input
          type="text"
          value={attribution}
          onChange={e => onChange('attribution', e.target.value)}
          placeholder="Photo by... / Source..."
          className="text-xs h-7 px-2 py-1 rounded-lg border border-border bg-background w-full"
          style={{ padding: '4px 8px' }}
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">Custom Attributes</label>
        <div className="flex flex-wrap gap-1 mb-1">
          {attributes.map((attr, aIdx) => (
            <span key={aIdx} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-accent text-accent-foreground border border-border">
              <span className="font-semibold text-muted-foreground">{attr.key}:</span> {attr.value}
              <button
                type="button"
                onClick={() => {
                  const updated = attributes.filter((_, idx) => idx !== aIdx);
                  onChange('attributes', updated);
                }}
                className="text-muted-foreground hover:text-red-400 transition-colors ml-0.5"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
          {attributes.length === 0 && (
            <span className="text-[10px] text-muted-foreground/60 italic">No custom attributes</span>
          )}
        </div>

        {addingAttrFor === idKey ? (
          <div className="flex gap-1 items-center bg-background/50 p-1 rounded-lg border border-border mt-1">
            <input
              type="text"
              placeholder="Name"
              value={newAttrKey}
              onChange={e => setNewAttrKey(e.target.value)}
              className="text-[9px] h-6 px-1 py-0.5 rounded border border-border bg-background w-[40%]"
            />
            <input
              type="text"
              placeholder="Value"
              value={newAttrVal}
              onChange={e => setNewAttrVal(e.target.value)}
              className="text-[9px] h-6 px-1 py-0.5 rounded border border-border bg-background w-[40%]"
            />
            <button
              type="button"
              onClick={() => {
                if (newAttrKey.trim() && newAttrVal.trim()) {
                  const updated = [...attributes, { key: newAttrKey.trim(), value: newAttrVal.trim() }];
                  onChange('attributes', updated);
                  setNewAttrKey('');
                  setNewAttrVal('');
                  setAddingAttrFor(null);
                }
              }}
              className="p-1 rounded bg-[#d4a853] text-[#1a1713] hover:bg-[#c29642] transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => {
                setNewAttrKey('');
                setNewAttrVal('');
                setAddingAttrFor(null);
              }}
              className="p-1 rounded hover:bg-accent text-muted-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddingAttrFor(idKey)}
            className="inline-flex items-center gap-1 text-[10px] text-amber-500 hover:text-amber-400 font-medium transition-colors"
          >
            <Plus className="w-2.5 h-2.5" /> Add custom attribute
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BlogEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: urlParam } = use(params)
  const router = useRouter()
  const isNew = urlParam === 'new'

  const { data: blog, isLoading } = useBlog(isNew ? '' : urlParam)
  const blogId = blog?._id ?? urlParam

  const createBlog = useCreateBlog()
  const updateBlog = useUpdateBlog()
  const deleteBlog = useDeleteBlog()
  const togglePublish = useTogglePublish()
  const uploadCover = useUploadCoverImage()
  const uploadBlock = useUploadBlockImage()
  const deleteBlock = useDeleteBlockImage()

  const user = useAuthStore(s => s.user)

  // Preview state
  const [showPreview, setShowPreview] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)

  // Cover image metadata local states
  const [coverMetadata, setCoverMetadata] = useState<{
    caption?: string;
    altText?: string;
    attribution?: string;
    attributes?: { key: string; value: string }[];
  }>({})

  // Custom attributes adding state
  const [addingAttrFor, setAddingAttrFor] = useState<'cover' | number | null>(null)
  const [newAttrKey, setNewAttrKey] = useState('')
  const [newAttrVal, setNewAttrVal] = useState('')

  useEffect(() => {
    if (coverFile) {
      const url = URL.createObjectURL(coverFile)
      setCoverPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setCoverPreviewUrl('')
    }
  }, [coverFile])

  // Block state — local copy, saved on explicit save
  const [blocks, setBlocks] = useState<BlogBlock[]>([])
  const [tagInput, setTagInput] = useState('')
  const [showDelete, setShowDelete] = useState(false)
  const [showBlockMenu, setShowBlockMenu] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null) // after first create
  const fileInputRef = useRef<HTMLInputElement>(null)

  // The working ID — either from URL (existing) or from the just-created post
  const workingId = isNew ? (createdId ?? '') : blogId

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<MetaForm>({
    resolver: zodResolver(metaSchema),
    defaultValues: { title: '', excerpt: '', tags: '' },
  })

  const watchedTitle = watch('title')
  const watchedExcerpt = watch('excerpt')
  const watchedTags = watch('tags')

  const authorName = blog?.author?.name || user?.name || 'Kaapilibre Author'

  const wordCount = blocks.reduce((acc, b) => {
    if (b.type === 'paragraph' || b.type === 'heading' || b.type === 'quote') {
      return acc + (b.content?.trim().split(/\s+/).filter(Boolean).length || 0)
    }
    return acc
  }, 0)
  const readTime = Math.max(1, Math.ceil(wordCount / 200))

  // Populate form from fetched blog
  useEffect(() => {
    if (blog) {
      reset({
        title: blog.title,
        excerpt: blog.excerpt,
        tags: blog.tags.join(', '),
      })
      setBlocks(blog.blocks.sort((a, b) => a.order - b.order))
      setCoverMetadata({
        caption: blog.coverImage?.caption || '',
        altText: blog.coverImage?.altText || '',
        attribution: blog.coverImage?.attribution || '',
        attributes: blog.coverImage?.attributes || [],
      })
    }
  }, [blog, reset])

  // ── Save (meta + blocks) ────────────────────────────────────────────────────
  const onSave = async (meta: MetaForm) => {
    const tags = meta.tags.split(',').map(t => t.trim()).filter(Boolean)
    const orderedBlocks = blocks.map((b, i) => ({ ...b, order: i }))

    const payload = {
      title: meta.title,
      excerpt: meta.excerpt,
      tags,
      blocks: orderedBlocks,
      coverImage: blog?.coverImage ? {
        ...blog.coverImage,
        caption: coverMetadata.caption || '',
        altText: coverMetadata.altText || '',
        attribution: coverMetadata.attribution || '',
        attributes: coverMetadata.attributes || [],
      } : (coverFile ? {
        url: '',
        publicId: '',
        caption: coverMetadata.caption || '',
        altText: coverMetadata.altText || '',
        attribution: coverMetadata.attribution || '',
        attributes: coverMetadata.attributes || [],
      } : undefined)
    }

    try {
      if (isNew && !createdId) {
        // First save — create the post
        const res = await createBlog.mutateAsync({ ...payload, status: 'draft' } as any) as any
        const id = res?.data?._id
        if (id) {
          setCreatedId(id)
          if (coverFile) {
            try {
              await uploadCover.mutateAsync({ id, file: coverFile })
            } catch (err) {
              console.error('Failed to upload cover image:', err)
              toast.error('Post created, but cover image upload failed')
            }
          }
          router.replace(`/blog/${id}`)
          toast.success('Blog post created')
        }
      } else {
        await updateBlog.mutateAsync({ id: workingId, data: payload as any })
      }
      setIsDirty(false)
    } catch { }
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

  const updateBlockContent = (idx: number, field: keyof BlogBlock, value: any) => {
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
    } catch { }
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
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${currentStatus === 'published'
                  ? 'border-green-500/30 bg-green-500/10 text-green-500'
                  : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-500'
                }`}>
                {currentStatus === 'published' ? 'Published' : 'Draft'}
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-accent transition-colors"
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
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
                        {block.url && (
                          <ImageAttributesSection
                            caption={block.caption || ''}
                            altText={block.altText || ''}
                            attribution={block.attribution || ''}
                            attributes={block.attributes || []}
                            onChange={(field, val) => updateBlockContent(idx, field as any, val)}
                            idKey={idx}
                            addingAttrFor={addingAttrFor}
                            setAddingAttrFor={setAddingAttrFor}
                            newAttrKey={newAttrKey}
                            setNewAttrKey={setNewAttrKey}
                            newAttrVal={newAttrVal}
                            setNewAttrVal={setNewAttrVal}
                          />
                        )}
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
              className={`w-full h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-all ${currentStatus === 'published'
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
            ) : coverFile ? (
              <div className="relative rounded-lg overflow-hidden bg-muted mb-3 group/cover">
                <img src={URL.createObjectURL(coverFile)} alt="Cover Preview" className="w-full h-40 object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center">
                  <button type="button" onClick={() => setCoverFile(null)}
                    className="px-3 py-1.5 rounded-lg bg-red-500 text-xs font-medium text-white hover:bg-red-600 transition-colors">
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-border hover:border-primary/40 cursor-pointer transition-colors text-muted-foreground hover:text-foreground mb-2">
                {uploadCover.isPending ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 mb-2" />
                    <span className="text-xs">Upload cover image</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" disabled={uploadCover.isPending}
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) {
                      if (workingId) {
                        handleCoverUpload(f)
                      } else {
                        setCoverFile(f)
                        setIsDirty(true)
                      }
                    }
                    e.target.value = ''
                  }}
                />
              </label>
            )}
            {(blog?.coverImage?.url || coverFile) && (
              <ImageAttributesSection
                caption={coverMetadata.caption || ''}
                altText={coverMetadata.altText || ''}
                attribution={coverMetadata.attribution || ''}
                attributes={coverMetadata.attributes || []}
                onChange={(field, val) => {
                  setCoverMetadata(prev => ({ ...prev, [field]: val }));
                  setIsDirty(true);
                }}
                idKey="cover"
                addingAttrFor={addingAttrFor}
                setAddingAttrFor={setAddingAttrFor}
                newAttrKey={newAttrKey}
                setNewAttrKey={setNewAttrKey}
                newAttrVal={newAttrVal}
                setNewAttrVal={setNewAttrVal}
              />
            )}
            {!workingId && !coverFile && (
              <p className="text-[10px] text-muted-foreground text-center">Cover image will be uploaded when you create the post</p>
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

      {/* ── Fullscreen Preview Modal ───────────────────────────────── */}
      {showPreview && (
        <div className="fixed inset-0 bg-[#0d0c0a] z-50 overflow-y-auto text-[#f5f0e8] font-sans flex flex-col">
          {/* Header Toolbar */}
          <div className="sticky top-0 bg-[#161410] border-b border-white/10 px-6 py-4 flex items-center justify-between z-30">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#d4a853]" />
              <span className="font-medium text-sm typewriter uppercase tracking-wider text-white/80">Preview Mode</span>
            </div>

            {/* Device Toggle */}
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  previewDevice === 'desktop' ? 'bg-[#d4a853] text-[#1a1713]' : 'text-white/60 hover:text-white'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" /> Desktop
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  previewDevice === 'mobile' ? 'bg-[#d4a853] text-[#1a1713]' : 'text-white/60 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> Mobile
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="p-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Preview Workspace Area */}
          <div className="flex-1 bg-[#090807] overflow-y-auto relative py-12 px-4 flex justify-center">
            {/* Ambient Background Blobs (forced Dark style) */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[#598aa6]/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-[#598aa6]/3 blur-[100px] pointer-events-none" />

            <div
              className={`relative z-10 w-full transition-all duration-300 ${
                previewDevice === 'mobile'
                  ? 'max-w-[390px] border-[12px] border-[#1e1b16] rounded-[48px] px-6 py-10 bg-[#0d0c0a] shadow-2xl relative min-h-[750px] self-start mt-4 mb-4'
                  : 'max-w-[900px] px-6 md:px-12 bg-[#0d0c0a]/40'
              }`}
            >
              {/* If Mobile, draw the camera notch/pill overlay */}
              {previewDevice === 'mobile' && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-32 h-4 bg-[#1e1b16] rounded-full z-20 flex items-center justify-center">
                  <div className="w-3 h-3 bg-black rounded-full absolute left-4" />
                  <div className="w-12 h-1 bg-neutral-800 rounded-full" />
                </div>
              )}

              {/* Blog Title & Info Header */}
              <div className="space-y-6 mb-12">
                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {watchedTags && typeof watchedTags === 'string' && watchedTags.trim() ? (
                    watchedTags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full text-[10px] bg-white/5 text-amber-500 font-medium border border-white/10 tracking-widest uppercase typewriter"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-white/30 italic">No tags</span>
                  )}
                </div>

                {/* Title */}
                <div>
                  <h1 className="text-white font-light tracking-tight leading-[1.1] uppercase typewriter text-2xl md:text-4xl lg:text-5xl">
                    {watchedTitle || 'Untitled Post'}
                  </h1>
                  {watchedExcerpt && (
                    <p className="text-gray-400 text-sm md:text-base font-light italic mt-4 max-w-2xl leading-relaxed">
                      {watchedExcerpt}
                    </p>
                  )}
                </div>

                {/* Metadata Summary Row */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-y border-white/5 py-4 mt-6">
                  <div className="flex items-center gap-6 text-[10px] text-white/50 typewriter">
                    <span className="flex items-center gap-1.5">
                      <span className="text-[#598aa6]">BY</span> {authorName}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-[#598aa6]">DATE</span> {new Date(blog?.publishedAt || blog?.createdAt || new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-[#598aa6]">READ</span> {readTime} min read
                    </span>
                  </div>
                </div>
              </div>

              {/* Cover Image */}
              {(blog?.coverImage?.url || coverPreviewUrl) && (() => {
                const coverLink = getImageLink({
                  attribution: coverMetadata.attribution,
                  attributes: coverMetadata.attributes
                });
                return (
                  <div className="mb-12 space-y-2">
                    <div className="product-image-container w-full">
                      {coverLink ? (
                        <a href={coverLink} target="_blank" rel="noopener noreferrer" className="block cursor-pointer">
                          <div className="relative rounded-[32px] overflow-hidden bg-black/30 border border-white/10 shadow-2xl p-4 aspect-[16/9] w-full">
                            <img
                              src={blog?.coverImage?.url || coverPreviewUrl}
                              alt={coverMetadata.altText || watchedTitle}
                              className="w-full h-full object-cover rounded-[20px] p-2"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none rounded-[20px] m-4" />
                          </div>
                        </a>
                      ) : (
                        <div className="relative rounded-[32px] overflow-hidden bg-black/30 border border-white/10 shadow-2xl p-4 aspect-[16/9] w-full">
                          <img
                            src={blog?.coverImage?.url || coverPreviewUrl}
                            alt={coverMetadata.altText || watchedTitle}
                            className="w-full h-full object-cover rounded-[20px] p-2"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none rounded-[20px] m-4" />
                        </div>
                      )}
                    </div>
                    {(coverMetadata.caption || coverMetadata.attribution || (coverMetadata.attributes && coverMetadata.attributes.length > 0)) && (
                      <div className="flex flex-col items-end text-right space-y-1 text-[10px] text-white/40 font-mono tracking-wider px-4">
                        {coverMetadata.caption && <p className="text-xs text-white/90 font-light font-sans mb-0.5">{coverMetadata.caption}</p>}
                        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                          {coverMetadata.attribution && (
                            <span>
                              Credit:{' '}
                              {coverLink ? (
                                <a href={coverLink} target="_blank" rel="noopener noreferrer" className="text-[#598aa6] hover:underline hover:text-white transition-colors">
                                  {isUrl(coverMetadata.attribution) ? getDomainName(coverMetadata.attribution) : coverMetadata.attribution}
                                </a>
                              ) : (
                                coverMetadata.attribution
                              )}
                            </span>
                          )}
                          {coverMetadata.attributes?.map((attr, aIdx) => {
                            const isAttrUrl = isUrl(attr.value);
                            return (
                              <span key={attr.key} className="flex items-center gap-x-3">
                                {(coverMetadata.attribution || aIdx > 0) && <span className="text-white/10">|</span>}
                                {isAttrUrl ? (
                                  <a href={attr.value} target="_blank" rel="noopener noreferrer" className="text-[#598aa6] hover:underline hover:text-white transition-colors uppercase font-bold">
                                    {attr.key}
                                  </a>
                                ) : (
                                  <span>
                                    <span className="text-[#598aa6] uppercase font-bold">{attr.key}:</span> {attr.value}
                                  </span>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Article Content Blocks */}
              <article className="prose prose-invert max-w-none text-white/80 font-light text-sm md:text-base leading-[2.0] space-y-6 pb-16">
                <div className="space-y-8">
                  {blocks.length > 0 ? (
                    blocks.map((block, idx) => {
                      switch (block.type) {
                        case 'heading':
                          return (
                            <h2 key={idx} className="text-xl md:text-2xl font-light text-white uppercase tracking-tight mt-10 mb-4 typewriter">
                              {block.content}
                            </h2>
                          )
                        case 'paragraph':
                          return (
                            <p key={idx} className="text-gray-300 leading-relaxed font-light text-sm md:text-base mb-6 whitespace-pre-line">
                              {block.content}
                            </p>
                          )
                        case 'quote':
                          return (
                            <blockquote key={idx} className="border-l-2 border-amber-500 pl-6 py-2 my-8 italic text-white/90 text-base md:text-lg font-light bg-white/3 rounded-r-xl">
                              "{block.content}"
                            </blockquote>
                          )
                        case 'image': {
                          const blockLink = getImageLink(block);
                          return (
                            <div key={idx} className="my-10 space-y-2">
                              <div className="relative w-full aspect-[16/9] rounded-[24px] overflow-hidden bg-black/10 border border-white/5 p-2">
                                {blockLink ? (
                                  <a href={blockLink} target="_blank" rel="noopener noreferrer" className="block w-full h-full relative cursor-pointer">
                                    {block.url ? (
                                      <img
                                        src={block.url}
                                        alt={block.altText || block.caption || watchedTitle}
                                        className="w-full h-full object-cover rounded-[16px]"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 text-white/40 text-xs">
                                        <span>No image uploaded for this block</span>
                                      </div>
                                    )}
                                  </a>
                                ) : (
                                  block.url ? (
                                    <img
                                      src={block.url}
                                      alt={block.altText || block.caption || watchedTitle}
                                      className="w-full h-full object-cover rounded-[16px]"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 text-white/40 text-xs">
                                      <span>No image uploaded for this block</span>
                                    </div>
                                  )
                                )}
                              </div>
                              {(block.caption || block.attribution || (block.attributes && block.attributes.length > 0)) && (
                                <div className="flex flex-col items-end text-right space-y-1 text-[10px] text-white/40 font-mono tracking-wider">
                                  {block.caption && <p className="text-xs text-white/90 font-light font-sans mb-0.5">{block.caption}</p>}
                                  <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                                    {block.attribution && (
                                      <span>
                                        Credit:{' '}
                                        {blockLink ? (
                                          <a href={blockLink} target="_blank" rel="noopener noreferrer" className="text-[#598aa6] hover:underline hover:text-white transition-colors">
                                            {isUrl(block.attribution) ? getDomainName(block.attribution) : block.attribution}
                                          </a>
                                        ) : (
                                          block.attribution
                                        )}
                                      </span>
                                    )}
                                    {block.attributes?.map((attr, aIdx) => {
                                      const isAttrUrl = isUrl(attr.value);
                                      return (
                                        <span key={attr.key} className="flex items-center gap-x-3">
                                          {(block.attribution || aIdx > 0) && <span className="text-white/10">|</span>}
                                          {isAttrUrl ? (
                                            <a href={attr.value} target="_blank" rel="noopener noreferrer" className="text-[#598aa6] hover:underline hover:text-white transition-colors uppercase font-bold">
                                              {attr.key}
                                            </a>
                                          ) : (
                                            <span>
                                              <span className="text-[#598aa6] uppercase font-bold">{attr.key}:</span> {attr.value}
                                            </span>
                                          )}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        }
                        default:
                          return null
                      }
                    })
                  ) : (
                    <div className="py-12 text-center text-white/30 border border-dashed border-white/10 rounded-2xl">
                      <p className="text-sm">This post has no content blocks yet.</p>
                    </div>
                  )}
                </div>
              </article>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
