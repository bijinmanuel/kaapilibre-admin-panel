'use client'

import { useRef, useEffect, useState } from 'react'
import {
  Heading2,
  Heading3,
  Type,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Link2,
  Table as TableIcon,
  Quote,
  Undo2,
  Redo2,
  RemoveFormatting,
  Sparkles,
  HelpCircle,
  Save,
  Loader2,
} from 'lucide-react'
import { InsertLinkModal } from './InsertLinkModal'
import { InsertTemplateModal } from './InsertTemplateModal'

export interface VisualEditorProps {
  value: string
  onChange: (html: string) => void
  onSave?: () => void
  isSaving?: boolean
  isDirty?: boolean
  onOpenTemplates?: () => void
}

export function VisualEditor({
  value,
  onChange,
  onSave,
  isSaving = false,
  isDirty = false,
  onOpenTemplates,
}: VisualEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const isInternalUpdate = useRef(false)

  // Modals state
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [savedSelection, setSavedSelection] = useState<Range | null>(null)
  const [selectedText, setSelectedText] = useState('')

  // Sync external HTML value into editor only when needed
  useEffect(() => {
    if (editorRef.current && !isInternalUpdate.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value
      }
    }
  }, [value])

  const handleInput = () => {
    if (!editorRef.current) return
    isInternalUpdate.current = true
    const newHtml = editorRef.current.innerHTML
    onChange(newHtml)
    setTimeout(() => {
      isInternalUpdate.current = false
    }, 50)
  }

  // Execute standard formatting commands while preventing focus loss
  const execCmd = (command: string, arg: string | undefined = undefined) => {
    editorRef.current?.focus()
    document.execCommand(command, false, arg)
    handleInput()
  }

  // Save selection before opening link modal
  const handleOpenLinkModal = () => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0)
      setSavedSelection(range)
      setSelectedText(range.toString())
    } else {
      setSavedSelection(null)
      setSelectedText('')
    }
    setIsLinkModalOpen(true)
  }

  // Apply link from modal
  const handleInsertLink = (url: string, linkText?: string) => {
    editorRef.current?.focus()
    if (savedSelection) {
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(savedSelection)
    }

    if (linkText && (!savedSelection || savedSelection.collapsed)) {
      const linkHtml = `<a href="${url}">${linkText}</a>`
      document.execCommand('insertHTML', false, linkHtml)
    } else {
      document.execCommand('createLink', false, url)
    }
    handleInput()
  }

  // Insert responsive table
  const handleInsertTable = () => {
    const tableHtml = `
<table style="width: 100%; border-collapse: collapse; margin: 1.25rem 0;">
  <thead>
    <tr style="border-bottom: 2px solid rgba(255,255,255,0.15); text-align: left;">
      <th style="padding: 10px 12px; font-weight: 600;">Header 1</th>
      <th style="padding: 10px 12px; font-weight: 600;">Header 2</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
      <td style="padding: 10px 12px;">Detail 1</td>
      <td style="padding: 10px 12px;">Detail 2</td>
    </tr>
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
      <td style="padding: 10px 12px;">Detail 3</td>
      <td style="padding: 10px 12px;">Detail 4</td>
    </tr>
  </tbody>
</table>
<p></p>
`
    execCmd('insertHTML', tableHtml)
  }

  // Insert Callout Box
  const handleInsertCallout = () => {
    const calloutHtml = `
<blockquote style="border-left: 4px solid #598aa6; background: rgba(89, 138, 166, 0.1); padding: 12px 16px; margin: 16px 0; border-radius: 6px;">
  <strong>Important Note:</strong> Enter special terms, policy conditions, or customer notice here.
</blockquote>
<p></p>
`
    execCmd('insertHTML', calloutHtml)
  }

  // Insert Clause Template from modal
  const handleInsertClause = (html: string) => {
    execCmd('insertHTML', html + '<p></p>')
  }

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-xs">
      {/* ── Visual Formatting Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-1 p-2.5 bg-muted/40 border-b border-border select-none">
        <div className="flex items-center gap-0.5 flex-wrap">
          {/* Paragraph Style Selector */}
          <div className="flex items-center gap-0.5 bg-background border border-border/80 rounded-lg p-0.5 mr-1">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                execCmd('formatBlock', '<p>')
              }}
              title="Normal Text Paragraph"
              className="px-2 py-1 rounded text-xs font-medium hover:bg-muted text-foreground flex items-center gap-1 transition-colors"
            >
              <Type className="w-3.5 h-3.5" />
              <span>Normal</span>
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                execCmd('formatBlock', '<h2>')
              }}
              title="Main Clause Heading (H2)"
              className="px-2 py-1 rounded text-xs font-semibold hover:bg-muted text-foreground flex items-center gap-1 transition-colors"
            >
              <Heading2 className="w-3.5 h-3.5" />
              <span>Heading</span>
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                execCmd('formatBlock', '<h3>')
              }}
              title="Sub-clause Heading (H3)"
              className="px-2 py-1 rounded text-xs font-medium hover:bg-muted text-foreground flex items-center gap-1 transition-colors"
            >
              <Heading3 className="w-3.5 h-3.5" />
              <span>Subheading</span>
            </button>
          </div>

          {/* Text Styling */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                execCmd('bold')
              }}
              title="Bold (Ctrl+B)"
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                execCmd('italic')
              }}
              title="Italic (Ctrl+I)"
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                execCmd('underline')
              }}
              title="Underline (Ctrl+U)"
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <Underline className="w-4 h-4" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                execCmd('strikeThrough')
              }}
              title="Strikethrough"
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <Strikethrough className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-4 bg-border mx-1" />

          {/* Lists */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                execCmd('insertUnorderedList')
              }}
              title="Bullet Points List"
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                execCmd('insertOrderedList')
              }}
              title="Numbered List"
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-4 bg-border mx-1" />

          {/* Special Inserts */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                handleOpenLinkModal()
              }}
              title="Insert or Edit Link"
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <Link2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                handleInsertCallout()
              }}
              title="Insert Callout Note Box"
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <Quote className="w-4 h-4" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                handleInsertTable()
              }}
              title="Insert Structured Table"
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                setIsTemplateModalOpen(true)
              }}
              title="Insert Pre-written Legal Clause"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors ml-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Clause Templates</span>
            </button>
          </div>
        </div>

        {/* History & Direct Save Button in Toolbar */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault()
              execCmd('undo')
            }}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault()
              execCmd('redo')
            }}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault()
              execCmd('removeFormat')
            }}
            title="Clear Formatting"
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <RemoveFormatting className="w-4 h-4" />
          </button>

          {/* Prominent Save Changes Button on Toolbar */}
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ml-1.5 shadow-md cursor-pointer disabled:opacity-50 ${
                isDirty
                  ? 'bg-amber-500 hover:bg-amber-600 text-black ring-2 ring-amber-400/40'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── User-friendly Guide Banner ── */}
      <div className="px-4 py-2 bg-muted/20 border-b border-border/60 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium text-foreground">Visual WYSIWYG Mode:</span>
          <span>Click anywhere below and type naturally. No HTML tags to worry about!</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] hidden sm:inline text-muted-foreground/80">
            Press <kbd className="px-1 py-0.5 bg-muted rounded border border-border">Ctrl+S</kbd> to save
          </span>
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="text-xs font-bold text-amber-500 hover:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Policy</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Main Visual Editor Surface ── */}
      <div className="p-6 md:p-8 flex-1 overflow-y-auto max-h-[640px]">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onBlur={handleInput}
          className="policy-visual-editor w-full min-h-[460px] focus:outline-none"
        />
      </div>

      {/* ── Bottom Editor Save Row ── */}
      {onSave && (
        <div className="px-6 py-3.5 bg-muted/30 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={`w-2.5 h-2.5 rounded-full ${isDirty ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="font-medium text-foreground">
              {isDirty ? 'You have unsaved policy modifications' : 'All edits saved to storefront'}
            </span>
          </div>

          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : (
              <Save className="w-4 h-4 text-black" />
            )}
            <span>{isSaving ? 'Saving Changes...' : 'Save Policy Changes'}</span>
          </button>
        </div>
      )}

      {/* Modals */}
      <InsertLinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onInsert={handleInsertLink}
        selectedText={selectedText}
      />

      <InsertTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onInsert={handleInsertClause}
      />
    </div>
  )
}
