'use client'

import { RotateCcw, AlertTriangle, X } from 'lucide-react'

interface ResetTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  policyName: string
}

export function ResetTemplateModal({
  isOpen,
  onClose,
  onConfirm,
  policyName,
}: ResetTemplateModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-foreground">
            Reset to Official Default Template?
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This will replace the current content of <strong className="text-foreground">{policyName}</strong> with KaapiLibre's official standard legal policy template. Any unsaved edits will be discarded.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-muted/40 hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 transition-all shadow-md"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Content</span>
          </button>
        </div>
      </div>
    </div>
  )
}
