'use client'

import { useState } from 'react'
import { Sparkles, X, PlusCircle, Check } from 'lucide-react'
import { CLAUSE_TEMPLATES } from '@/lib/policyDefaults'

interface InsertTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  onInsert: (html: string) => void
}

export function InsertTemplateModal({
  isOpen,
  onClose,
  onInsert,
}: InsertTemplateModalProps) {
  const [selectedIdx, setSelectedIdx] = useState<number>(0)

  if (!isOpen) return null

  const handleApply = () => {
    const template = CLAUSE_TEMPLATES[selectedIdx]
    if (template) {
      onInsert(template.html)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl bg-card border border-border shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span>Insert Pre-written Policy Clause</span>
              <p className="text-[11px] font-normal text-muted-foreground">
                Add standard compliance clauses or tables with one click
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Templates Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
          {CLAUSE_TEMPLATES.map((tmpl, idx) => {
            const isSelected = idx === selectedIdx
            return (
              <div
                key={tmpl.name}
                onClick={() => setSelectedIdx(idx)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/10 ring-1 ring-primary/40'
                    : 'border-border bg-muted/30 hover:bg-muted/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-semibold text-foreground">{tmpl.name}</h4>
                  {isSelected && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                  {tmpl.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* Live Preview Box */}
        <div className="p-3.5 rounded-xl bg-[#0b1114] border border-border/80 text-xs">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#598aa6] block mb-2">
            Live Template Preview
          </span>
          <div
            className="text-gray-300 max-h-[140px] overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: CLAUSE_TEMPLATES[selectedIdx]?.html || '' }}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Insert Clause into Policy</span>
          </button>
        </div>
      </div>
    </div>
  )
}
