'use client'

import { useState, useMemo } from 'react'
import {
  HelpCircle, Plus, Search, Filter, CheckCircle2, AlertCircle,
  ArrowUp, ArrowDown, Edit3, Trash2, Globe, Eye, EyeOff,
  Sparkles, Check, X, Loader2
} from 'lucide-react'
import {
  useFaqs,
  useCreateFaq,
  useUpdateFaq,
  useDeleteFaq,
  useToggleWebsiteFaq,
  useToggleVisibilityFaq,
  useReorderFaqs,
} from '@/hooks/useFaq'
import type { Faq, CreateFaqData, UpdateFaqData } from '@/types'
import { toast } from 'sonner'

const CATEGORY_SUGGESTIONS = [
  'Coffee & Origin',
  'Brewing Guide',
  'Orders & Freshness',
  'Subscription',
  'Storage & Care',
  'General',
]

export default function FaqManagementPage() {
  const { data, isLoading, error } = useFaqs()
  const createFaq = useCreateFaq()
  const updateFaq = useUpdateFaq()
  const deleteFaq = useDeleteFaq()
  const toggleWebsite = useToggleWebsiteFaq()
  const toggleVisibility = useToggleVisibilityFaq()
  const reorderFaqs = useReorderFaqs()

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'website' | 'not-website'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null)
  const [deletingFaq, setDeletingFaq] = useState<Faq | null>(null)

  // Form State
  const [formData, setFormData] = useState<CreateFaqData>({
    question: '',
    answer: '',
    category: 'General',
    isSelectedForWebsite: false,
    isVisible: true,
  })

  const faqs = data?.faqs || []
  const selectedCount = data?.selectedForWebsiteCount ?? faqs.filter(f => f.isSelectedForWebsite).length

  // Categories list
  const availableCategories = useMemo(() => {
    const cats = new Set<string>()
    faqs.forEach((f) => {
      if (f.category) cats.add(f.category)
    })
    return Array.from(cats)
  }, [faqs])

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesSearch =
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.category?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesFilter =
        activeFilter === 'all'
          ? true
          : activeFilter === 'website'
          ? faq.isSelectedForWebsite
          : !faq.isSelectedForWebsite

      const matchesCategory =
        selectedCategory === 'all' || faq.category === selectedCategory

      return matchesSearch && matchesFilter && matchesCategory
    })
  }, [faqs, searchQuery, activeFilter, selectedCategory])

  // Reorder Handler (move up or down)
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= faqs.length) return

    const newOrder = [...faqs]
    const temp = newOrder[index]
    newOrder[index] = newOrder[targetIndex]
    newOrder[targetIndex] = temp

    reorderFaqs.mutate(newOrder.map((f) => f._id))
  }

  // Open Create Modal
  const openCreateModal = () => {
    setFormData({
      question: '',
      answer: '',
      category: 'General',
      isSelectedForWebsite: selectedCount < 6,
      isVisible: true,
    })
    setIsCreateOpen(true)
  }

  // Open Edit Modal
  const openEditModal = (faq: Faq) => {
    setEditingFaq(faq)
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || 'General',
      isSelectedForWebsite: faq.isSelectedForWebsite,
      isVisible: faq.isVisible,
    })
  }

  // Save Form (Create or Update)
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error('Question and Answer are required')
      return
    }

    if (editingFaq) {
      updateFaq.mutate(
        { id: editingFaq._id, data: formData },
        {
          onSuccess: () => {
            setEditingFaq(null)
          },
        }
      )
    } else {
      createFaq.mutate(formData, {
        onSuccess: () => {
          setIsCreateOpen(false)
        },
      })
    }
  }

  // Delete Action
  const confirmDelete = () => {
    if (!deletingFaq) return
    deleteFaq.mutate(deletingFaq._id, {
      onSuccess: () => setDeletingFaq(null),
    })
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-[#d4a853]/10 text-[#d4a853] border border-[#d4a853]/20">
              <HelpCircle className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Frequently Asked Questions
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage FAQs and choose exactly which 6 questions are served to the storefront website in the public{' '}
            <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs text-[#d4a853]">/api/v1/faq</code>{' '}
            endpoint.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#d4a853] hover:bg-[#c29642] text-black font-medium text-sm transition-all shadow-lg shadow-[#d4a853]/20 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Add New FAQ</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total FAQs */}
        <div className="p-5 rounded-2xl border border-border bg-card/60 backdrop-blur-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total FAQs
            </p>
            <HelpCircle className="w-4 h-4 text-muted-foreground/60" />
          </div>
          <p className="text-3xl font-semibold mt-2 text-foreground">{faqs.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Available in knowledge base</p>
        </div>

        {/* Website Selection Status */}
        <div className="p-5 rounded-2xl border border-[#d4a853]/30 bg-[#d4a853]/5 backdrop-blur-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-[#d4a853]">
              Storefront Website Selection
            </p>
            <Globe className="w-4 h-4 text-[#d4a853]" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-3xl font-semibold text-foreground">{selectedCount}</p>
            <span className="text-base text-muted-foreground font-medium">/ 6 recommended</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            {selectedCount === 6 ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Optimal website count (6 of 6)
              </span>
            ) : selectedCount < 6 ? (
              <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> {6 - selectedCount} more needed for 6
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-blue-400 font-medium">
                <Sparkles className="w-3.5 h-3.5" /> Top 6 will be displayed on website
              </span>
            )}
          </div>
        </div>

        {/* Visibility Status */}
        <div className="p-5 rounded-2xl border border-border bg-card/60 backdrop-blur-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Visibility Status
            </p>
            <Eye className="w-4 h-4 text-muted-foreground/60" />
          </div>
          <div className="flex items-baseline gap-3 mt-2">
            <div>
              <span className="text-2xl font-semibold text-foreground">
                {faqs.filter((f) => f.isVisible).length}
              </span>
              <span className="text-xs text-muted-foreground ml-1.5">published</span>
            </div>
            <span className="text-muted-foreground/40">•</span>
            <div>
              <span className="text-2xl font-semibold text-muted-foreground">
                {faqs.filter((f) => !f.isVisible).length}
              </span>
              <span className="text-xs text-muted-foreground ml-1.5">hidden</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Global published vs drafted</p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-card/40">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search questions or answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-[#d4a853] text-foreground placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="inline-flex p-1 rounded-xl bg-background border border-border text-xs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeFilter === 'all'
                  ? 'bg-[#d4a853] text-black font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({faqs.length})
            </button>
            <button
              onClick={() => setActiveFilter('website')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeFilter === 'website'
                  ? 'bg-[#d4a853] text-black font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              ⭐ On Website ({selectedCount})
            </button>
            <button
              onClick={() => setActiveFilter('not-website')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeFilter === 'not-website'
                  ? 'bg-[#d4a853] text-black font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Other ({faqs.length - selectedCount})
            </button>
          </div>

          {/* Category Filter */}
          {availableCategories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs bg-background border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-[#d4a853]"
            >
              <option value="all">All Categories</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* FAQs List */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#d4a853]" />
          <p className="text-sm text-muted-foreground">Loading FAQs...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl border border-destructive/30 bg-destructive/10 text-center">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
          <p className="text-sm font-medium text-destructive">Failed to load FAQs</p>
          <p className="text-xs text-muted-foreground mt-1">
            Please make sure the backend is running and connected.
          </p>
        </div>
      ) : filteredFaqs.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-card/20">
          <HelpCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-base font-medium text-foreground">No FAQs found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {searchQuery || activeFilter !== 'all'
              ? 'Try changing your search keywords or filter options.'
              : 'Create your first FAQ to get started.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('')
                setActiveFilter('all')
                setSelectedCategory('all')
              }}
              className="mt-4 px-3 py-1.5 text-xs text-[#d4a853] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFaqs.map((faq, index) => {
            const isSelected = faq.isSelectedForWebsite
            return (
              <div
                key={faq._id}
                className={`group p-5 rounded-2xl border transition-all duration-200 ${
                  isSelected
                    ? 'border-[#d4a853]/40 bg-[#161410]/70 hover:border-[#d4a853]/60 shadow-[0_4px_20px_-8px_rgba(212,168,83,0.12)]'
                    : 'border-border/60 bg-card/40 hover:border-border hover:bg-card/70'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Reorder + Content */}
                  <div className="flex items-start gap-4 flex-1">
                    {/* Reorder arrows */}
                    <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
                      <button
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0}
                        title="Move Up"
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] font-mono font-medium text-muted-foreground">
                        {index + 1}
                      </span>
                      <button
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === filteredFaqs.length - 1}
                        title="Move Down"
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Question and Answer */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {faq.category && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 border border-white/10 text-muted-foreground">
                            {faq.category}
                          </span>
                        )}
                        {isSelected ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#d4a853]/20 border border-[#d4a853]/40 text-[#d4a853] flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Selected for Website
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground/60">
                            Knowledge Base Only
                          </span>
                        )}
                        {!faq.isVisible && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-destructive/10 text-destructive border border-destructive/20">
                            Hidden / Inactive
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-medium text-foreground tracking-tight">
                        {faq.question}
                      </h4>

                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>

                  {/* Right: Quick Website Toggle + Actions */}
                  <div className="flex items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-border/40 shrink-0">
                    {/* Primary Website Selection Button */}
                    <button
                      onClick={() => toggleWebsite.mutate(faq._id)}
                      disabled={toggleWebsite.isPending}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-[#d4a853]/20 text-[#d4a853] border border-[#d4a853]/50 hover:bg-[#d4a853]/30'
                          : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground border border-border'
                      }`}
                      title={
                        isSelected
                          ? 'Click to remove from storefront website'
                          : 'Click to feature on storefront website'
                      }
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isSelected ? 'bg-[#d4a853] animate-pulse' : 'bg-muted-foreground/40'
                        }`}
                      />
                      <span>{isSelected ? 'Show on Website' : 'Select for Website'}</span>
                    </button>

                    {/* Quick Visibility Toggle */}
                    <button
                      onClick={() => toggleVisibility.mutate(faq._id)}
                      title={faq.isVisible ? 'Hide FAQ' : 'Publish FAQ'}
                      className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {faq.isVisible ? (
                        <Eye className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => openEditModal(faq)}
                      title="Edit FAQ"
                      className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-[#d4a853] transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setDeletingFaq(faq)}
                      title="Delete FAQ"
                      className="p-2 rounded-xl border border-border hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── CREATE / EDIT MODAL ────────────────────────────────────────────── */}
      {(isCreateOpen || editingFaq) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#d4a853]/10 text-[#d4a853]">
                  <HelpCircle className="w-4 h-4" />
                </span>
                <h3 className="text-lg font-semibold text-foreground">
                  {editingFaq ? 'Edit FAQ' : 'Add New FAQ'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsCreateOpen(false)
                  setEditingFaq(null)
                }}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Question */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  Question <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Which grind size should I choose?"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-[#d4a853]"
                />
              </div>

              {/* Answer */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  Answer <span className="text-destructive">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide a clear, helpful explanation for customers..."
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-[#d4a853] resize-none leading-relaxed"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  Category
                </label>
                <input
                  type="text"
                  placeholder="e.g. Coffee & Origin"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-[#d4a853] mb-2"
                />
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORY_SUGGESTIONS.map((sug) => (
                    <button
                      type="button"
                      key={sug}
                      onClick={() => setFormData({ ...formData, category: sug })}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                        formData.category === sug
                          ? 'border-[#d4a853] text-[#d4a853] bg-[#d4a853]/10'
                          : 'border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checkboxes */}
              <div className="p-4 rounded-xl border border-border bg-background/50 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isSelectedForWebsite}
                    onChange={(e) =>
                      setFormData({ ...formData, isSelectedForWebsite: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-border text-[#d4a853] focus:ring-[#d4a853] accent-[#d4a853]"
                  />
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      Display on Storefront Website
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Include this FAQ in the public /get request for the website (recommended 6).
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer select-none border-t border-border/50 pt-2.5">
                  <input
                    type="checkbox"
                    checked={formData.isVisible}
                    onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                    className="w-4 h-4 rounded border-border text-[#d4a853] focus:ring-[#d4a853] accent-[#d4a853]"
                  />
                  <div>
                    <p className="text-xs font-medium text-foreground">Published & Active</p>
                    <p className="text-[11px] text-muted-foreground">
                      When disabled, this FAQ is drafted and hidden from all public views.
                    </p>
                  </div>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false)
                    setEditingFaq(null)
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-border hover:bg-muted text-muted-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createFaq.isPending || updateFaq.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#d4a853] hover:bg-[#c29642] text-black transition-all shadow-md shadow-[#d4a853]/20 disabled:opacity-50"
                >
                  {createFaq.isPending || updateFaq.isPending ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </span>
                  ) : editingFaq ? (
                    'Save Changes'
                  ) : (
                    'Create FAQ'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ─────────────────────────────────────── */}
      {deletingFaq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-destructive/30 bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-destructive/10 text-destructive">
                <Trash2 className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-foreground">Delete FAQ?</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-foreground/80 p-3 rounded-xl bg-background border border-border">
              &ldquo;{deletingFaq.question}&rdquo;
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingFaq(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium border border-border hover:bg-muted text-muted-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteFaq.isPending}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-all shadow-md disabled:opacity-50"
              >
                {deleteFaq.isPending ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
