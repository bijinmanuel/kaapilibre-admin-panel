'use client'
import { X, AlertTriangle } from 'lucide-react'

interface ConfirmModalProps {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onClose: () => void
  variant?: 'danger' | 'warning' | 'primary'
}

export function ConfirmModal({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onClose,
  variant = 'danger'
}: ConfirmModalProps) {
  const colors = {
    danger: { bg: 'bg-red-500', text: 'text-red-500', hover: 'hover:bg-red-600' },
    warning: { bg: 'bg-orange-500', text: 'text-orange-500', hover: 'hover:bg-orange-600' },
    primary: { bg: 'bg-primary', text: 'text-primary', hover: 'hover:bg-primary/90' },
  }

  const selected = colors[variant]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="p-6 text-center">
          <div className={`w-12 h-12 ${selected.text} bg-current/10 rounded-full flex items-center justify-center mx-auto mb-4`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          
          <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            {message}
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-sm bg-accent hover:bg-accent/80 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm()
                onClose()
              }}
              className={`flex-1 py-3 rounded-xl font-bold text-sm text-white ${selected.bg} ${selected.hover} transition-all active:scale-[0.98]`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
