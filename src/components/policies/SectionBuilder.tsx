'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Copy,
  GripVertical,
  Sparkles,
  FileText,
  AlertCircle,
  HelpCircle,
  Save,
  Loader2,
} from 'lucide-react'
import {
  parseHtmlToSections,
  sectionsToHtml,
  type PolicySection,
} from '@/lib/policyDefaults'

export interface SectionBuilderProps {
  value: string
  onChange: (html: string) => void
  onSave?: () => void
  isSaving?: boolean
  isDirty?: boolean
  onOpenTemplates?: () => void
}

export function SectionBuilder({
  value,
  onChange,
  onSave,
  isSaving = false,
  isDirty = false,
  onOpenTemplates,
}: SectionBuilderProps) {
  const [preamble, setPreamble] = useState('')
  const [sections, setSections] = useState<PolicySection[]>([])
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)

  // Parse HTML into sections on mount or external reset
  useEffect(() => {
    const parsed = parseHtmlToSections(value)
    setPreamble(parsed.preamble)
    setSections(parsed.sections)
    if (parsed.sections.length > 0 && !activeSectionId) {
      setActiveSectionId(parsed.sections[0].id)
    }
  }, [value])

  const commitChanges = (newPreamble: string, newSections: PolicySection[]) => {
    setPreamble(newPreamble)
    setSections(newSections)
    const newHtml = sectionsToHtml(newPreamble, newSections)
    onChange(newHtml)
  }

  // Update Section Title
  const handleUpdateTitle = (id: string, newTitle: string) => {
    const updated = sections.map((sec) =>
      sec.id === id ? { ...sec, title: newTitle } : sec
    )
    commitChanges(preamble, updated)
  }

  // Update Section Content
  const handleUpdateContent = (id: string, newContent: string) => {
    const updated = sections.map((sec) =>
      sec.id === id ? { ...sec, content: newContent } : sec
    )
    commitChanges(preamble, updated)
  }

  // Add New Section
  const handleAddSection = () => {
    const newNum = sections.length + 1
    const newSection: PolicySection = {
      id: 'sec-' + Math.random().toString(36).substring(2, 9),
      title: `${newNum}. New Policy Clause`,
      content: `<p>Enter details and conditions for this section...</p>`,
    }
    const updated = [...sections, newSection]
    setActiveSectionId(newSection.id)
    commitChanges(preamble, updated)
  }

  // Delete Section
  const handleDeleteSection = (id: string) => {
    if (sections.length <= 1) {
      alert('A policy must contain at least one section.')
      return
    }
    const updated = sections.filter((sec) => sec.id !== id)
    commitChanges(preamble, updated)
  }

  // Duplicate Section
  const handleDuplicateSection = (sec: PolicySection) => {
    const newSec: PolicySection = {
      id: 'sec-' + Math.random().toString(36).substring(2, 9),
      title: `${sec.title} (Copy)`,
      content: sec.content,
    }
    const index = sections.findIndex((s) => s.id === sec.id)
    const updated = [...sections]
    updated.splice(index + 1, 0, newSec)
    setActiveSectionId(newSec.id)
    commitChanges(preamble, updated)
  }

  // Move Section Up
  const handleMoveUp = (index: number) => {
    if (index <= 0) return
    const updated = [...sections]
    const temp = updated[index - 1]
    updated[index - 1] = updated[index]
    updated[index] = temp
    commitChanges(preamble, updated)
  }

  // Move Section Down
  const handleMoveDown = (index: number) => {
    if (index >= sections.length - 1) return
    const updated = [...sections]
    const temp = updated[index + 1]
    updated[index + 1] = updated[index]
    updated[index] = temp
    commitChanges(preamble, updated)
  }

  // Convert raw text into paragraphs if needed
  const handleTextareaChange = (id: string, rawText: string) => {
    if (rawText.includes('<p>') || rawText.includes('<ul>')) {
      handleUpdateContent(id, rawText)
      return
    }

    const paragraphs = rawText
      .split('\n\n')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
      .join('\n')

    handleUpdateContent(id, paragraphs || `<p>${rawText}</p>`)
  }

  // Helper to extract readable plain text for simpler textarea editing
  const getReadableText = (htmlContent: string) => {
    if (typeof window === 'undefined') return htmlContent
    if (htmlContent.includes('<table') || htmlContent.includes('<blockquote')) {
      return htmlContent
    }
    return htmlContent
      .replace(/<\/p><p>/gi, '\n\n')
      .replace(/<p>/gi, '')
      .replace(/<\/p>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<li>/gi, '• ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<\/?ul>/gi, '')
      .replace(/<\/?ol>/gi, '')
      .replace(/<\/?strong>/gi, '')
      .replace(/<\/?em>/gi, '')
  }

  return (
    <div className="space-y-4">
      {/* ── Guidance Banner ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-card border border-border">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span>Clause-by-Clause Section Builder</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your legal clauses as independent sections. Reorder with arrows or add new clauses without touching any code!
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleAddSection}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-card border border-border hover:bg-muted text-foreground text-xs font-medium transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-primary" />
            <span>Add New Clause</span>
          </button>

          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer ${
                isDirty
                  ? 'bg-amber-500 hover:bg-amber-600 text-black ring-2 ring-amber-400/40'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Optional Preamble / Intro Card ── */}
      {preamble && (
        <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Document Preamble / Intro Note
            </span>
          </div>
          <textarea
            value={getReadableText(preamble)}
            onChange={(e) => {
              const text = e.target.value
              const html = `<p>${text.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`
              commitChanges(html, sections)
            }}
            placeholder="Introduction text appearing before Section 1..."
            rows={2}
            className="text-xs bg-muted/30 w-full rounded-lg p-3 border border-border focus:border-primary resize-y"
          />
        </div>
      )}

      {/* ── Section Cards List ── */}
      <div className="space-y-4">
        {sections.map((section, idx) => {
          const isFirst = idx === 0
          const isLast = idx === sections.length - 1

          return (
            <div
              key={section.id}
              className="rounded-2xl border border-border/90 bg-card hover:border-border transition-all overflow-hidden shadow-xs"
            >
              {/* Section Card Header */}
              <div className="px-5 py-3.5 bg-muted/30 border-b border-border flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-bold flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </div>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => handleUpdateTitle(section.id, e.target.value)}
                    placeholder="e.g. 1. Acceptance of Terms"
                    className="font-semibold text-sm bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-foreground w-full"
                  />
                </div>

                {/* Section Action Controls */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMoveUp(idx)}
                    disabled={isFirst}
                    title="Move Clause Up"
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(idx)}
                    disabled={isLast}
                    title="Move Clause Down"
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDuplicateSection(section)}
                    title="Duplicate Clause"
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSection(section.id)}
                    title="Delete Clause"
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors ml-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Section Card Content */}
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Clause Body & Terms:</span>
                  <span>Type text naturally or use bullet lines starting with •</span>
                </div>

                <textarea
                  value={getReadableText(section.content)}
                  onChange={(e) => handleTextareaChange(section.id, e.target.value)}
                  placeholder="Enter the legal terms, conditions, or rules for this clause..."
                  rows={4}
                  className="w-full text-xs md:text-sm bg-muted/20 border border-border/80 rounded-xl p-3.5 text-foreground leading-relaxed focus:border-primary focus:outline-none resize-y"
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Bottom Add Section Button ── */}
      <button
        type="button"
        onClick={handleAddSection}
        className="w-full py-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-card/50 hover:bg-primary/5 text-muted-foreground hover:text-primary text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>Add Another Clause to this Policy</span>
      </button>

      {/* ── Bottom Section Save Row ── */}
      {onSave && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border shadow-md">
          <div>
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isDirty ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span>{isDirty ? 'Unsaved clause changes' : 'All clauses are saved'}</span>
            </h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Click save to immediately update this policy live on your storefront.
            </p>
          </div>

          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : (
              <Save className="w-4 h-4 text-black" />
            )}
            <span>{isSaving ? 'Saving Changes...' : 'Save All Changes'}</span>
          </button>
        </div>
      )}
    </div>
  )
}
