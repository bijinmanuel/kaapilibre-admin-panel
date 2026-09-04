'use client'
import { useState, useEffect } from 'react'
import {
  X, Mail, Send, Loader2, Sparkles, Link2, Eye, Edit3,
  Smartphone, Monitor, Coffee, Award, Gift, MessageSquare, Check
} from 'lucide-react'
import { useSendCustomEmail, usePreviewCustomEmail } from '@/hooks/useData'

interface SendCustomEmailModalProps {
  isOpen: boolean
  onClose: () => void
  initialEmail?: string
  initialName?: string
  customerId?: string
}

interface EmailPreset {
  id: string
  name: string
  icon: typeof Coffee
  badge: string
  subject: string
  heading: string
  message: string
  highlightText?: string
  buttonText?: string
  buttonUrl?: string
  style: 'signature' | 'sage' | 'warm' | 'classic'
}

const EMAIL_PRESETS: EmailPreset[] = [
  {
    id: 'vip-tasting',
    name: 'VIP Roastery Invitation',
    icon: Award,
    style: 'signature',
    badge: '✦ PRIVATE ROASTERY INVITATION ✦',
    subject: 'Private Invitation: Exclusive Roastery Reserve Tasting',
    heading: 'An Invitation to the Hearth of Old World Coffee.',
    message: `We are privileged to invite you to an exclusive tasting session for our newest single-estate micro-lot harvest.\n\nCrafted from high-altitude shade-grown cherries in Wayanad and rested to perfection, this limited roaster reserve features notes of wild wildflower honey, toasted cacao, and a velvety lingering finish.\n\n- Exclusive first access before general release\n- Curated brewing recipe card from our Master Roaster\n- Complimentary artisanal keepsake with your order`,
    highlightText: 'VIP ACCESS CODE: RESERVE-TASTING-2026',
    buttonText: 'EXPLORE PRIVATE RESERVE',
    buttonUrl: 'https://kaapilibre.com/products',
  },
  {
    id: 'fresh-harvest',
    name: 'Fresh Harvest & Flavor Guide',
    icon: Coffee,
    style: 'sage',
    badge: '✦ FRESH ROAST DISPATCH ✦',
    subject: 'Fresh From the Roaster: Notes on Your Coffee',
    heading: 'Freshly Roasted. Properly Rested. Made for You.',
    message: `Our roasting guild has just finished batch-crafting our signature beans. Every lot is given the dedicated resting period required for delicate oils and aromatic compounds to fully develop.\n\n> "Great coffee is not made in haste; it is an earthy keepsake born from soil, mist, and careful craft."\n\nFor the optimum cup, we recommend brewing with water at 92°C-94°C and allowing the grounds to bloom for 45 seconds before a slow, spiral pour.`,
    highlightText: 'PRO TIP: Best brewed within 14-28 days of roast date',
    buttonText: 'VIEW BREWING GUIDES',
    buttonUrl: 'https://kaapilibre.com/about',
  },
  {
    id: 'member-courtesy',
    name: 'Member Courtesy Offer',
    icon: Gift,
    style: 'warm',
    badge: '✦ COMPLIMENTARY ROASTERY GIFT ✦',
    subject: 'A Token of Appreciation from KaapiLibre',
    heading: 'An Earthy Keepsake, Dedicated to Your Ritual.',
    message: `Thank you for making KaapiLibre a cherished part of your morning ritual. As a heartfelt gesture of appreciation for your journey with us, we have reserved a special courtesy on your upcoming selection.\n\nExplore our single-estate beans and small-batch blends curated exclusively for discerning coffee lovers.`,
    highlightText: 'USE CODE: HEIRLOOM15 FOR 15% OFF YOUR NEXT ORDER',
    buttonText: 'CLAIM MEMBER COURTESY',
    buttonUrl: 'https://kaapilibre.com/products',
  },
  {
    id: 'concierge-note',
    name: 'Roaster Concierge Follow-up',
    icon: MessageSquare,
    style: 'signature',
    badge: '✦ ROASTER CONCIERGE NOTE ✦',
    subject: 'A Personal Note Regarding Your Coffee Experience',
    heading: 'Honoured to Share This Ritual with You.',
    message: `We hope your recent batch of KaapiLibre has brought warmth, aroma, and quiet moments of reflection to your cups.\n\nIf you ever need personalized grind recommendations, water temperature guidance, or origin details about the estates we partner with, our roastery team is always just a reply away.`,
    highlightText: 'Direct Roastery Line / WhatsApp: +91 94464 61166',
    buttonText: 'VISIT KAAPILIBRE BOUTIQUE',
    buttonUrl: 'https://kaapilibre.com',
  },
]

const STYLES_CONFIG = [
  {
    id: 'signature',
    name: 'Noir & Gold',
    desc: 'Obsidian luxury, gold foil accents & Mama Africa art',
    color: '#d4a853',
    border: 'rgba(212,168,83,0.4)',
  },
  {
    id: 'sage',
    name: 'Forest & Sage',
    desc: 'Artisanal roastery charcoal with earthy moss green',
    color: '#7aa366',
    border: 'rgba(122,163,102,0.4)',
  },
  {
    id: 'warm',
    name: 'Warm Amber',
    desc: 'Deep roasted espresso with rich amber highlights',
    color: '#f59e0b',
    border: 'rgba(245,158,11,0.4)',
  },
]

export function SendCustomEmailModal({
  isOpen,
  onClose,
  initialEmail = '',
  initialName = '',
  customerId,
}: SendCustomEmailModalProps) {
  const [recipientEmail, setRecipientEmail] = useState(initialEmail)
  const [recipientName, setRecipientName] = useState(initialName)
  const [subject, setSubject] = useState('')
  const [heading, setHeading] = useState('')
  const [badge, setBadge] = useState('✦ PRIVATE ROASTERY DISPATCH ✦')
  const [message, setMessage] = useState('')
  const [highlightText, setHighlightText] = useState('')
  const [showHighlight, setShowHighlight] = useState(false)
  const [showCTA, setShowCTA] = useState(false)
  const [buttonText, setButtonText] = useState('')
  const [buttonUrl, setButtonUrl] = useState('')
  const [style, setStyle] = useState<'signature' | 'sage' | 'warm' | 'classic'>('signature')

  // UI state
  const [activeTab, setActiveTab] = useState<'compose' | 'preview'>('compose')
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [previewHtml, setPreviewHtml] = useState<string>('')
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)

  const sendEmailMutation = useSendCustomEmail()
  const previewMutation = usePreviewCustomEmail()

  useEffect(() => {
    if (isOpen) {
      setRecipientEmail(initialEmail)
      setRecipientName(initialName)
      if (!subject) {
        applyPreset(EMAIL_PRESETS[0])
      }
    }
  }, [isOpen, initialEmail, initialName])

  const applyPreset = (preset: EmailPreset) => {
    setSubject(preset.subject)
    setHeading(preset.heading)
    setBadge(preset.badge)
    setMessage(preset.message)
    setStyle(preset.style)
    if (preset.highlightText) {
      setHighlightText(preset.highlightText)
      setShowHighlight(true)
    } else {
      setHighlightText('')
      setShowHighlight(false)
    }
    if (preset.buttonText && preset.buttonUrl) {
      setButtonText(preset.buttonText)
      setButtonUrl(preset.buttonUrl)
      setShowCTA(true)
    } else {
      setButtonText('')
      setButtonUrl('')
      setShowCTA(false)
    }
  }

  // Generate real-time server preview when switching to preview tab
  useEffect(() => {
    if (activeTab === 'preview' && isOpen) {
      setIsLoadingPreview(true)
      previewMutation.mutateAsync({
        recipientName: recipientName.trim() || 'Valued Customer',
        subject: subject.trim() || 'Exclusive Update from KaapiLibre',
        message: message.trim() || 'Your message will appear formatted here with artisanal typography.',
        buttonText: showCTA && buttonText.trim() ? buttonText.trim() : undefined,
        buttonUrl: showCTA && buttonUrl.trim() ? buttonUrl.trim() : undefined,
        style: style,
        badge: badge.trim() || undefined,
        heading: heading.trim() || undefined,
        highlightText: showHighlight && highlightText.trim() ? highlightText.trim() : undefined,
      })
        .then((res: any) => {
          setPreviewHtml(res?.data?.html || '')
        })
        .catch(() => {
          // fallback
        })
        .finally(() => {
          setIsLoadingPreview(false)
        })
    }
  }, [activeTab, subject, heading, badge, message, highlightText, showHighlight, showCTA, buttonText, buttonUrl, style, recipientName])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recipientEmail && !customerId) return
    if (!subject.trim() || !message.trim()) return

    await sendEmailMutation.mutateAsync({
      to: recipientEmail ? recipientEmail.trim() : undefined,
      customerId: customerId,
      recipientName: recipientName.trim() || undefined,
      subject: subject.trim(),
      heading: heading.trim() || undefined,
      badge: badge.trim() || undefined,
      message: message.trim(),
      highlightText: showHighlight && highlightText.trim() ? highlightText.trim() : undefined,
      buttonText: showCTA && buttonText.trim() ? buttonText.trim() : undefined,
      buttonUrl: showCTA && buttonUrl.trim() ? buttonUrl.trim() : undefined,
      style: style,
    })

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div
        className="relative w-full max-w-4xl rounded-2xl border border-border/80 bg-[#0d1114] text-foreground shadow-2xl overflow-hidden my-4 sm:my-8 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Gradient Bar */}
        <div
          className="h-1 w-full"
          style={{
            background:
              style === 'sage'
                ? 'linear-gradient(90deg, #5b824a 0%, #7aa366 50%, #9cb88c 100%)'
                : style === 'warm'
                ? 'linear-gradient(90deg, #d97706 0%, #fbbf24 50%, #b45309 100%)'
                : 'linear-gradient(90deg, #c8963e 0%, #e5b869 50%, #b88636 100%)',
          }}
        />

        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-border/40 bg-[#080b0d]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner"
              style={{
                background:
                  style === 'sage'
                    ? 'rgba(122,163,102,0.15)'
                    : style === 'warm'
                    ? 'rgba(245,158,11,0.15)'
                    : 'rgba(212,168,83,0.15)',
                color:
                  style === 'sage'
                    ? '#7aa366'
                    : style === 'warm'
                    ? '#f59e0b'
                    : '#d4a853',
              }}
            >
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white tracking-wide">
                  KaapiLibre Email Studio
                </h3>
                <span
                  className="px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase rounded border"
                  style={{
                    color: style === 'sage' ? '#7aa366' : style === 'warm' ? '#f59e0b' : '#d4a853',
                    borderColor: style === 'sage' ? 'rgba(122,163,102,0.3)' : style === 'warm' ? 'rgba(245,158,11,0.3)' : 'rgba(212,168,83,0.3)',
                    backgroundColor: 'rgba(0,0,0,0.4)',
                  }}
                >
                  Artisanal Dispatch
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Craft a captivating, luxury keepsake email that sticks with every customer
              </p>
            </div>
          </div>

          {/* Right Header Navigation & Actions */}
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-border/60 bg-background/50 p-0.5">
              <button
                type="button"
                onClick={() => setActiveTab('compose')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'compose'
                    ? 'bg-[#1a2126] text-white shadow-sm'
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                Compose
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'preview'
                    ? 'bg-[#1a2126] text-white shadow-sm'
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Live Preview
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0a0d0f]">
          {activeTab === 'compose' ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 1. Quick Presets Bar */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  ✦ One-Click Artisanal Templates
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {EMAIL_PRESETS.map((preset) => {
                    const Icon = preset.icon
                    const isSelected = subject === preset.subject
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-[#d4a853] bg-[#d4a853]/10 text-white shadow-sm'
                            : 'border-border/40 bg-background/40 hover:border-border/80 text-muted-foreground hover:text-white'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'bg-[#d4a853] text-black' : 'bg-white/5 text-muted-foreground'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{preset.name}</p>
                          <span className="text-[10px] text-muted-foreground/80 capitalize">{preset.style}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 2. Theme / Atmosphere Selector */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  ✦ Aesthetic Theme
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {STYLES_CONFIG.map((s) => {
                    const isSelected = style === s.id
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setStyle(s.id as any)}
                        className={`flex flex-col p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                          isSelected
                            ? 'bg-black/60 shadow-md'
                            : 'border-border/30 bg-black/20 hover:border-border/60 opacity-80 hover:opacity-100'
                        }`}
                        style={{
                          borderColor: isSelected ? s.color : undefined,
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold" style={{ color: s.color }}>
                            {s.name}
                          </span>
                          {isSelected && (
                            <span
                              className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                              style={{ backgroundColor: s.color, color: '#000000' }}
                            >
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-tight">{s.desc}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 3. Recipient Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Recipient Email <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="customer@example.com"
                      className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background/60 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-[#d4a853] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Recipient Name <span className="text-xs text-muted-foreground/60">(Optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="e.g. Bijin Manuel"
                      className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background/60 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-[#d4a853] transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Subject & Header Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Email Subject Line <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Private Invitation: Exclusive Roastery Reserve"
                    className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background/60 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-[#d4a853] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Eyebrow Badge Tag
                  </label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="✦ PRIVATE DISPATCH ✦"
                    className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background/60 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-[#d4a853] transition-colors uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Inner Headline / Title <span className="text-xs text-muted-foreground/60">(Displayed in luxury font atop the message)</span>
                </label>
                <input
                  type="text"
                  value={heading}
                  onChange={(e) => setHeading(e.target.value)}
                  placeholder="e.g. An Invitation to the Hearth of Old World Coffee."
                  className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background/60 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-[#d4a853] transition-colors"
                />
              </div>

              {/* 5. Message Body */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-muted-foreground">
                    Email Message Content <span className="text-red-400">*</span>
                  </label>
                  <span className="text-[11px] text-muted-foreground/70">
                    Separate paragraphs with blank lines · Start lines with <code className="text-[#d4a853]">- </code> for bullets · Use <code className="text-[#d4a853]">&gt; </code> for quotes
                  </span>
                </div>
                <textarea
                  required
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your crafted message here... It will automatically be rendered with generous leading and luxury typography."
                  className="w-full p-3.5 rounded-xl border border-border/60 bg-background/60 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-[#d4a853] transition-colors resize-y min-h-[140px] font-sans leading-relaxed"
                />
              </div>

              {/* 6. Optional Highlight Box (Coupon / Tasting Notes / Code) */}
              <div className="border border-border/40 rounded-xl p-3.5 bg-black/20 space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowHighlight(!showHighlight)}
                    className="flex items-center gap-2 text-xs font-semibold transition-colors"
                    style={{ color: style === 'sage' ? '#7aa366' : style === 'warm' ? '#f59e0b' : '#d4a853' }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {showHighlight ? 'Remove Highlight / Access Code Box' : '+ Add Special Highlight / Access Code Box'}
                  </button>
                  <span className="text-[10px] text-muted-foreground">
                    Renders an artisanal dashed box in the email
                  </span>
                </div>

                {showHighlight && (
                  <div>
                    <input
                      type="text"
                      value={highlightText}
                      onChange={(e) => setHighlightText(e.target.value)}
                      placeholder="e.g. VIP CODE: RESERVE-2026 or PRO TIP: Best brewed at 93°C"
                      className="w-full h-10 px-3 rounded-lg border border-border/60 bg-background/80 text-sm text-foreground font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:border-[#d4a853] transition-colors"
                    />
                  </div>
                )}
              </div>

              {/* 7. Action Button Link */}
              <div className="border border-border/40 rounded-xl p-3.5 bg-black/20 space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowCTA(!showCTA)}
                    className="flex items-center gap-2 text-xs font-semibold transition-colors"
                    style={{ color: style === 'sage' ? '#7aa366' : style === 'warm' ? '#f59e0b' : '#d4a853' }}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    {showCTA ? 'Remove Action Button' : '+ Add Call to Action Button'}
                  </button>
                  <span className="text-[10px] text-muted-foreground">
                    Bulletproof responsive button
                  </span>
                </div>

                {showCTA && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Button Text
                      </label>
                      <input
                        type="text"
                        value={buttonText}
                        onChange={(e) => setButtonText(e.target.value)}
                        placeholder="e.g. EXPLORE PRIVATE RESERVE"
                        className="w-full h-9 px-3 rounded-lg border border-border/60 bg-background/80 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-[#d4a853] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Button Target URL
                      </label>
                      <input
                        type="url"
                        value={buttonUrl}
                        onChange={(e) => setButtonUrl(e.target.value)}
                        placeholder="https://kaapilibre.com/products"
                        className="w-full h-9 px-3 rounded-lg border border-border/60 bg-background/80 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-[#d4a853] transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>
            </form>
          ) : (
            /* LIVE PREVIEW TAB */
            <div className="flex flex-col items-center justify-center space-y-3 min-h-[460px]">
              {/* Preview Bar */}
              <div className="flex items-center justify-between w-full max-w-xl pb-2 border-b border-border/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Viewing As Customer:</span>
                  <span className="font-semibold text-white">{recipientName || 'Valued Customer'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex rounded-md border border-border/60 bg-background/50 p-0.5">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('desktop')}
                      className={`p-1.5 rounded text-xs transition-colors ${
                        previewDevice === 'desktop' ? 'bg-white/15 text-white' : 'text-muted-foreground hover:text-white'
                      }`}
                      title="Desktop View (580px)"
                    >
                      <Monitor className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('mobile')}
                      className={`p-1.5 rounded text-xs transition-colors ${
                        previewDevice === 'mobile' ? 'bg-white/15 text-white' : 'text-muted-foreground hover:text-white'
                      }`}
                      title="Mobile View (375px)"
                    >
                      <Smartphone className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Iframe Preview Container */}
              <div
                className={`w-full transition-all duration-300 rounded-xl overflow-hidden shadow-2xl border border-border/60 bg-black ${
                  previewDevice === 'mobile' ? 'max-w-[390px] h-[640px]' : 'max-w-[620px] h-[640px]'
                }`}
              >
                {isLoadingPreview ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin text-[#d4a853]" />
                    <p className="text-xs">Generating luxury artisanal preview...</p>
                  </div>
                ) : (
                  <iframe
                    srcDoc={previewHtml}
                    title="Email Preview"
                    className="w-full h-full border-0 bg-black"
                    sandbox="allow-same-origin allow-popups"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/40 bg-[#080b0d]">
          <div className="text-xs text-muted-foreground">
            {activeTab === 'compose' ? (
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className="flex items-center gap-1.5 text-[#d4a853] hover:underline"
              >
                <Eye className="w-3.5 h-3.5" />
                Switch to Live Preview before sending
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('compose')}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-white"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Back to editor
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm border border-border/60 text-muted-foreground hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={sendEmailMutation.isPending || !subject.trim() || !message.trim() || (!recipientEmail && !customerId)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all shadow-lg disabled:opacity-50"
              style={{
                background:
                  style === 'sage'
                    ? 'linear-gradient(135deg, #7aa366 0%, #567e45 100%)'
                    : style === 'warm'
                    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                    : 'linear-gradient(135deg, #e5b869 0%, #b88636 100%)',
                color: '#0a0806',
              }}
            >
              {sendEmailMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Dispatching Email...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Dispatch Email
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
