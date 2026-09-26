'use client'

import { useState } from 'react'
import { Link2, X, ExternalLink } from 'lucide-react'

interface InsertLinkModalProps {
  isOpen: boolean
  onClose: () => void
  onInsert: (url: string, text?: string) => void
  selectedText?: string
}

export function InsertLinkModal({
  isOpen,
  onClose,
  onInsert,
  selectedText = '',
}: InsertLinkModalProps) {
  const [url, setUrl] = useState('')
  const [text, setText] = useState(selectedText)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    let formattedUrl = url.trim()
    // Auto-prepend https:// if missing and not a relative or mailto link
    if (
      !formattedUrl.startsWith('http://') &&
      !formattedUrl.startsWith('https://') &&
      !formattedUrl.startsWith('/') &&
      !formattedUrl.startsWith('mailto:')
    ) {
      formattedUrl = 'https://' + formattedUrl
    }

    onInsert(formattedUrl, text.trim() || undefined)
    setUrl('')
    setText('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Link2 className="w-4 h-4" />
            </div>
            <span>Insert Hyperlink</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Web Address / URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. https://kaapilibre.com/privacy-policy or mailto:support@kaapilibre.com"
              autoFocus
              required
              className="text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Tip: You can use full web URLs, internal paths like <code className="bg-muted px-1 py-0.5 rounded">/cancellation-refund-policy</code>, or <code className="bg-muted px-1 py-0.5 rounded">mailto:support@kaapilibre.com</code>.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Display Text (Optional)</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={selectedText || 'Link text displayed to reader'}
              className="text-xs"
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
              type="submit"
              disabled={!url.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Apply Link</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
