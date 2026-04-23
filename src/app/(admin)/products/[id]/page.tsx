'use client'
import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Loader2, X, Upload, ToggleLeft, ToggleRight, Trash2, Star } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useProduct, useUpdateProduct, useCreateProduct, useDeleteProduct, useToggleProduct, useUploadProductImage, useDeleteProductImage, useSetPrimaryImage } from '@/hooks/useProducts'

const schema = z.object({
  name:     z.string().min(2, 'Name required'),
  origin:   z.string().min(1, 'Origin required'),
  region:   z.string().min(1, 'Region required'),
  variety:  z.enum(['Arabica', 'Robusta']),
  process:  z.enum(['Washed', 'Natural', 'Honey']),
  altitude: z.string().min(1, 'Altitude required'),
  roast:    z.string().min(1, 'Roast required'),
  story:    z.string().min(10, 'Story must be at least 10 characters'),
  badge:    z.string().optional(),
  price100: z.preprocess(v => parseFloat(String(v)), z.number().positive('Must be > 0')),
  price250: z.preprocess(v => parseFloat(String(v)), z.number().positive('Must be > 0')),
  price500: z.preprocess(v => parseFloat(String(v)), z.number().positive('Must be > 0')),
})

// The URL param is either "new" or a MongoDB _id
// Products page links using product._id so all mutations work directly
export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: urlParam } = use(params)
  const router = useRouter()
  const isNew = urlParam === 'new'

  // Fetch using the URL param — could be _id or slug, backend handles both
  const { data: product, isLoading } = useProduct(isNew ? '' : urlParam)

  // The actual MongoDB _id to use for all mutations
  const productId = product?._id ?? urlParam

  const create      = useCreateProduct()
  const update      = useUpdateProduct()
  const del         = useDeleteProduct()
  const toggle      = useToggleProduct()
  const uploadImage    = useUploadProductImage()
  const deleteImage    = useDeleteProductImage()
  const setPrimary     = useSetPrimaryImage()

  const [flavourNotes, setFlavourNotes] = useState<string[]>([])
  const [noteInput, setNoteInput]       = useState('')
  const [showDelete, setShowDelete]     = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: { variety: 'Arabica', process: 'Washed' },
  })

  useEffect(() => {
    if (product) {
      reset({
        name:     product.name,
        origin:   product.origin,
        region:   product.region,
        variety:  product.variety,
        process:  product.process,
        altitude: product.altitude,
        roast:    product.roast,
        story:    product.story,
        badge:    product.badge || '',
        price100: product.prices['100g'],
        price250: product.prices['250g'],
        price500: product.prices['500g'],
      })
      setFlavourNotes(product.flavourNotes || [])
    }
  }, [product, reset])

  const onSubmit = async (data: any) => {
    const payload = {
      name: data.name, origin: data.origin, region: data.region,
      variety: data.variety, process: data.process, altitude: data.altitude,
      roast: data.roast, story: data.story,
      badge: data.badge || undefined,
      flavourNotes,
      prices: {
        '100g': data.price100,
        '250g': data.price250,
        '500g': data.price500,
      },
    }
    if (isNew) {
      const res = await create.mutateAsync(payload as any)
      const created = (res as any)?.data
      // After create, redirect using _id so future edits work correctly
      if (created?._id) router.replace(`/products/${created._id}`)
      else router.push('/products')
    } else {
      // Always use product._id for update — slug may change if name changes
      await update.mutateAsync({ id: productId, data: payload as any })
    }
  }

  const handleDelete = async () => {
    await del.mutateAsync(productId)
    router.push('/products')
  }

  const addNote = () => {
    const trimmed = noteInput.trim()
    if (trimmed && !flavourNotes.includes(trimmed)) {
      setFlavourNotes(n => [...n, trimmed])
      setNoteInput('')
    }
  }

  const isPending = create.isPending || update.isPending

  if (isLoading && !isNew) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
  }
  if (!isNew && !product && !isLoading) {
    return <div className="text-muted-foreground p-4">Product not found</div>
  }

  const ErrorMsg = ({ field }: { field: string }) =>
    errors[field] ? <p className="text-xs text-red-400 mt-1">{errors[field]?.message as string}</p> : null

  return (
    <div>
      <PageHeader
        title={isNew ? 'Add product' : (product?.name || 'Edit product')}
        action={
          <div className="flex items-center gap-3">
            {/* Inactive badge — visible when product is not active */}
            {!isNew && product && !product.isActive && (
              <span className="text-xs px-3 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 font-medium">
                Inactive — not visible on storefront
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
        {/* Left — main form */}
        <div className="lg:col-span-2 space-y-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Basic info</p>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Product name *</label>
                <input {...register('name')} placeholder="e.g. Bale Mountain Natural" />
                <ErrorMsg field="name" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Origin *</label>
                  <input {...register('origin')} placeholder="e.g. Ethiopia" />
                  <ErrorMsg field="origin" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Region *</label>
                  <input {...register('region')} placeholder="e.g. Bale Mountains" />
                  <ErrorMsg field="region" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Variety *</label>
                  <select {...register('variety')}>
                    <option value="Arabica">Arabica</option>
                    <option value="Robusta">Robusta</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Process *</label>
                  <select {...register('process')}>
                    <option value="Washed">Washed</option>
                    <option value="Natural">Natural</option>
                    <option value="Honey">Honey</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Altitude *</label>
                  <input {...register('altitude')} placeholder="e.g. 1900–2200m" />
                  <ErrorMsg field="altitude" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Roast *</label>
                  <input {...register('roast')} placeholder="e.g. Light" />
                  <ErrorMsg field="roast" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  Badge <span className="text-muted-foreground/60">(optional)</span>
                </label>
                <input {...register('badge')} placeholder="e.g. Bestseller, Limited, New" />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Story *</label>
                <textarea {...register('story')} rows={4}
                  placeholder="Tell the story of this bean — origin, farm, what makes it special..." />
                <ErrorMsg field="story" />
              </div>
            </div>

            {/* Prices */}
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Prices (₹) *</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">100g</label>
                  <input type="number" min={1} step={1} {...register('price100')} placeholder="350" />
                  <ErrorMsg field="price100" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">250g</label>
                  <input type="number" min={1} step={1} {...register('price250')} placeholder="750" />
                  <ErrorMsg field="price250" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">500g</label>
                  <input type="number" min={1} step={1} {...register('price500')} placeholder="1400" />
                  <ErrorMsg field="price500" />
                </div>
              </div>
            </div>

            {/* Flavour notes */}
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Flavour notes</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {flavourNotes.map(note => (
                  <span key={note} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border border-border bg-secondary text-foreground">
                    {note}
                    <button type="button" onClick={() => setFlavourNotes(n => n.filter(x => x !== note))}
                      className="text-muted-foreground hover:text-foreground transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {flavourNotes.length === 0 && (
                  <p className="text-xs text-muted-foreground">No notes yet — add some below</p>
                )}
              </div>
              <div className="flex gap-2">
                <input value={noteInput} onChange={e => setNoteInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addNote() } }}
                  placeholder="e.g. Blueberry, Dark Chocolate — press Enter to add" />
                <button type="button" onClick={addNote}
                  className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors whitespace-nowrap flex-shrink-0">
                  Add
                </button>
              </div>
            </div>

            <button type="submit" disabled={isPending}
              className="flex items-center justify-center gap-2 w-full h-11 rounded-lg font-medium text-sm disabled:opacity-60 transition-opacity"
              style={{ background: '#d4a853', color: '#1a1713' }}>
              {isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" />{isNew ? 'Creating...' : 'Saving...'}</>
                : isNew ? 'Create product' : 'Save changes'}
            </button>
          </form>
        </div>

        {/* Right panel — only for existing products */}
        {!isNew && product && (
          <div className="space-y-5">

            {/* Active / Inactive toggle */}
            <div className={`rounded-xl border p-5 ${product.isActive ? 'border-border bg-card' : 'border-red-500/30 bg-red-500/5'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {product.isActive ? 'Active' : 'Inactive'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {product.isActive ? 'Visible on storefront' : 'Hidden from storefront'}
                  </p>
                </div>
                <button type="button" onClick={() => toggle.mutate(productId)}>
                  {product.isActive
                    ? <ToggleRight className="w-8 h-8 text-green-500" />
                    : <ToggleLeft className="w-8 h-8 text-red-400" />}
                </button>
              </div>
            </div>

            {/* Images */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Images ({product.images?.length || 0})
                </p>
                {product.images?.length > 0 && (
                  <p className="text-[10px] text-muted-foreground">Hover to manage</p>
                )}
              </div>

              {/* Image grid */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {product.images?.map(img => (
                  <div key={img.publicId} className="relative rounded-lg overflow-hidden aspect-square bg-muted group">
                    <img src={img.url} alt="product" className="w-full h-full object-cover" />

                    {/* Primary badge */}
                    {img.isPrimary && (
                      <span className="absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 rounded font-medium z-10"
                        style={{ background: '#d4a853', color: '#1a1713' }}>
                        Primary
                      </span>
                    )}

                    {/* Hover overlay with actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                      {/* Set primary — only show on non-primary images */}
                      {!img.isPrimary && (
                        <button
                          type="button"
                          title="Set as primary"
                          onClick={() => setPrimary.mutate({ productId, publicId: img.publicId })}
                          disabled={setPrimary.isPending}
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                          style={{ background: 'rgba(212,168,83,0.9)', color: '#1a1713' }}>
                          {setPrimary.isPending
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Star className="w-3.5 h-3.5" />}
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        type="button"
                        title="Delete image"
                        onClick={() => deleteImage.mutate({ productId, publicId: img.publicId })}
                        disabled={deleteImage.isPending}
                        className="w-8 h-8 rounded-full bg-red-500/90 flex items-center justify-center hover:bg-red-500 transition-colors">
                        {deleteImage.isPending
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                          : <Trash2 className="w-3.5 h-3.5 text-white" />}
                      </button>
                    </div>
                  </div>
                ))}

                {product.images?.length === 0 && (
                  <div className="col-span-2 flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Upload className="w-6 h-6 mb-2 opacity-40" />
                    <p className="text-xs">No images yet</p>
                  </div>
                )}
              </div>

              {/* Upload button */}
              <label className="flex items-center justify-center gap-2 w-full h-10 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                {uploadImage.isPending ? 'Uploading...' : 'Upload image'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadImage.isPending}
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) {
                      uploadImage.mutate({ id: productId, file: f })
                      e.target.value = ''  // reset so same file can be re-uploaded
                    }
                  }}
                />
              </label>

              {product.images?.length > 0 && (
                <p className="text-[10px] text-muted-foreground mt-2 text-center">
                  First uploaded image is set as primary automatically. Hover any image to change primary or delete.
                </p>
              )}
            </div>

            {/* Stock */}
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Stock levels</p>
              <div className="space-y-3">
                {(['100g', '250g', '500g'] as const).map(w => {
                  const v = product.stock?.[w]
                  const low = v && v.qty <= v.reorderAt
                  return (
                    <div key={w} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{w}</span>
                      <span className={`text-sm font-medium ${low ? 'text-red-400' : 'text-foreground'}`}>
                        {v?.qty ?? 0}
                        <span className="text-xs text-muted-foreground ml-1">/ {v?.reorderAt ?? 10} reorder</span>
                      </span>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Manage in <a href="/inventory" className="underline" style={{ color: '#d4a853' }}>Inventory →</a>
              </p>
            </div>

            {/* Delete */}
            <div>
              {!showDelete ? (
                <button type="button" onClick={() => setShowDelete(true)}
                  className="w-full h-10 rounded-lg text-sm font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                  Delete product
                </button>
              ) : (
                <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 space-y-3">
                  <p className="text-sm text-red-400 font-medium">Delete permanently?</p>
                  <p className="text-xs text-muted-foreground">This cannot be undone.</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={handleDelete} disabled={del.isPending}
                      className="flex-1 h-9 rounded-lg text-sm bg-red-500 text-white disabled:opacity-60">
                      {del.isPending ? 'Deleting...' : 'Yes, delete'}
                    </button>
                    <button type="button" onClick={() => setShowDelete(false)}
                      className="flex-1 h-9 rounded-lg text-sm border border-border text-muted-foreground hover:text-foreground">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
