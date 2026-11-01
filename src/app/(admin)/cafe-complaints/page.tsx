'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  CheckCircle2,
  Send,
  ChevronDown,
  ChevronUp,
  Store,
  Video,
  Paperclip,
  Maximize2,
  X,
  Shield,
  User,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { cn } from '@/lib/utils';

export interface MediaAttachment {
  url: string;
  type: 'image' | 'video';
  name: string;
}

const STATUS_BADGE: Record<string, string> = {
  open: 'border-red-500/30 bg-red-500/10 text-red-500',
  in_progress: 'border-blue-500/30 bg-blue-500/10 text-blue-500',
  resolved: 'border-green-500/30 bg-green-500/10 text-green-500',
  closed: 'border-border bg-muted/40 text-muted-foreground',
};

const PRIORITY_BADGE: Record<string, string> = {
  high: 'border-red-500/30 bg-red-500/10 text-red-500',
  medium: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-500',
  low: 'border-border bg-muted/40 text-muted-foreground',
};

const ATTACHMENT_MARKER_REGEX = /\n*\[\[ATTACHMENTS:([\s\S]*?)\]\]$/;

const processMediaFile = (file: File): Promise<MediaAttachment> => {
  return new Promise((resolve, reject) => {
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isImage && !isVideo) {
      reject(new Error('Only image and video files are supported'));
      return;
    }

    if (isVideo) {
      if (file.size > 4 * 1024 * 1024) {
        reject(new Error('Video clip must be under 4 MB'));
        return;
      }
      const reader = new FileReader();
      reader.onload = () =>
        resolve({ url: String(reader.result || ''), type: 'video', name: file.name });
      reader.onerror = () => reject(new Error('Failed to read video file'));
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const MAX_DIM = 1200;
        let width = img.width;
        let height = img.height;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ url: String(event.target?.result || ''), type: 'image', name: file.name });
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve({
          url: canvas.toDataURL('image/jpeg', 0.78),
          type: 'image',
          name: file.name,
        });
      };
      img.onerror = () => reject(new Error('Invalid image file'));
      img.src = String(event.target?.result || '');
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
};

const serializeMessageWithAttachments = (
  text: string,
  attachments: MediaAttachment[]
): string => {
  const cleanText = text.trim();
  if (!attachments || attachments.length === 0) return cleanText;
  return `${cleanText}\n\n[[ATTACHMENTS:${JSON.stringify(attachments)}]]`;
};

const parseMessageAndAttachments = (msg: any): {
  cleanText: string;
  attachments: MediaAttachment[];
} => {
  const rawText = String(msg?.message || '');
  const explicitAttachments: MediaAttachment[] = Array.isArray(msg?.attachments)
    ? msg.attachments.map((item: any) =>
        typeof item === 'string'
          ? {
              url: item,
              type:
                item.startsWith('data:video/') || /\.(mp4|webm|mov)$/i.test(item)
                  ? 'video'
                  : 'image',
              name: 'Attachment',
            }
          : {
              url: item.url,
              type: item.type === 'video' ? 'video' : 'image',
              name: item.name || 'Attachment',
            }
      )
    : [];

  const match = rawText.match(ATTACHMENT_MARKER_REGEX);
  if (!match) {
    return { cleanText: rawText, attachments: explicitAttachments };
  }

  const cleanText = rawText.replace(ATTACHMENT_MARKER_REGEX, '').trim();
  let embeddedAttachments: MediaAttachment[] = [];
  try {
    const parsed = JSON.parse(match[1]);
    if (Array.isArray(parsed)) {
      embeddedAttachments = parsed.filter((a) => a && a.url);
    }
  } catch {
    // Ignore malformed JSON
  }

  const seenUrls = new Set(explicitAttachments.map((a) => a.url));
  const combined = [...explicitAttachments];
  for (const att of embeddedAttachments) {
    if (!seenUrls.has(att.url)) {
      seenUrls.add(att.url);
      combined.push(att);
    }
  }

  return { cleanText, attachments: combined };
};

export default function CafeComplaintsAdminPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replyAttachments, setReplyAttachments] = useState<Record<string, MediaAttachment[]>>({});
  const [lightboxMedia, setLightboxMedia] = useState<MediaAttachment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submittingTicketId, setSubmittingTicketId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const fetchComplaints = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = (await api.get(`/cafe-portal/admin/complaints?status=${statusFilter}`)) as any;
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : [];
      setComplaints(list);
      if (list.length > 0 && !expandedId) setExpandedId(list[0]._id);
    } catch (err: any) {
      if (!silent) toast.error(err.message || 'Failed to load cafe complaints');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints(false);
  }, [statusFilter]);

  const handleSelectReplyFiles = async (
    ticketId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const existing = replyAttachments[ticketId] || [];
    const remaining = 4 - existing.length;
    if (remaining <= 0) {
      toast.error('Maximum 4 attachments per reply');
      e.target.value = '';
      return;
    }

    try {
      const processed = await Promise.all(
        Array.from(files)
          .slice(0, remaining)
          .map((f) => processMediaFile(f))
      );
      setReplyAttachments((prev) => ({
        ...prev,
        [ticketId]: [...(prev[ticketId] || []), ...processed],
      }));
    } catch (err: any) {
      toast.error(err.message || 'Could not attach file');
    } finally {
      e.target.value = '';
    }
  };

  const handleReply = async (ticketId: string) => {
    const text = (replyText[ticketId] || '').trim();
    const attached = replyAttachments[ticketId] || [];
    if (!text && attached.length === 0) return;

    const finalMessage = serializeMessageWithAttachments(
      text || 'Attached media response.',
      attached
    );

    const optimisticMsg = {
      _id: `temp-${Date.now()}`,
      sender: 'admin',
      senderName: 'Roastery Support',
      message: finalMessage,
      attachments: attached,
      sentAt: new Date().toISOString(),
    };

    // Clear input & optimistically append message in-place without reloading the page
    setReplyText((prev) => ({ ...prev, [ticketId]: '' }));
    setReplyAttachments((prev) => ({ ...prev, [ticketId]: [] }));
    setComplaints((prev) =>
      prev.map((t) =>
        t._id === ticketId
          ? { ...t, messages: [...(t.messages || []), optimisticMsg] }
          : t
      )
    );

    setSubmittingTicketId(ticketId);
    try {
      const res = (await api.post(`/cafe-portal/admin/complaints/${ticketId}/reply`, {
        message: finalMessage,
        attachments: attached,
      })) as any;

      const updatedTicket = res?.data?._id ? res.data : res?._id ? res : null;
      if (updatedTicket) {
        setComplaints((prev) =>
          prev.map((t) => (t._id === ticketId ? updatedTicket : t))
        );
      } else {
        fetchComplaints(true);
      }
      toast.success('Reply sent to cafe');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reply');
      fetchComplaints(true);
    } finally {
      setSubmittingTicketId(null);
    }
  };

  const handleStatusChange = async (ticketId: string, status: string) => {
    // Optimistically update status in-place
    setComplaints((prev) =>
      prev.map((t) => (t._id === ticketId ? { ...t, status } : t))
    );
    try {
      await api.patch(`/cafe-portal/admin/complaints/${ticketId}/status`, { status });
      toast.success(`Ticket marked as ${status.replace('_', ' ')}`);
      fetchComplaints(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
      fetchComplaints(true);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cafe Complaints & Quality Feedback"
        description="Inspect photo & video proof from partner cafes and respond to quality tickets"
        action={
          <div className="flex flex-wrap items-center gap-1.5 bg-muted/60 border border-border p-1 rounded-xl text-xs">
            {['all', 'open', 'in_progress', 'resolved', 'closed'].map((st) => {
              const active = statusFilter === st;
              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg capitalize font-medium transition-colors',
                    active
                      ? 'font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  style={active ? { background: '#d4a853', color: '#1a1713' } : {}}
                >
                  {st.replace('_', ' ')}
                </button>
              );
            })}
          </div>
        }
      />

      {isLoading ? (
        <div className="p-12 flex flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground bg-card rounded-xl border border-border">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span>Loading cafe complaints...</span>
        </div>
      ) : complaints.length === 0 ? (
        <div className="p-12 text-center bg-card rounded-xl border border-border">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-foreground">No complaints found</p>
          <p className="text-xs text-muted-foreground mt-1">
            {statusFilter === 'all'
              ? 'Partner cafes have not raised any complaints yet.'
              : `No complaints matching "${statusFilter.replace('_', ' ')}" status.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((ticket) => {
            const isExpanded = expandedId === ticket._id;
            const cafeObj = typeof ticket.cafeId === 'object' ? ticket.cafeId : null;
            const cafeName = cafeObj?.name || ticket.cafeName || 'Cafe Partner';
            const currentReplyAttachments = replyAttachments[ticket._id] || [];

            return (
              <div
                key={ticket._id}
                className="bg-card rounded-xl border border-border overflow-hidden transition-colors"
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : ticket._id)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-accent/40 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-bold" style={{ color: '#d4a853' }}>
                        {ticket.ticketNumber}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-muted border border-border text-foreground font-semibold flex items-center gap-1">
                        <Store className="w-3 h-3 text-primary" /> {cafeName}
                      </span>
                      {ticket.category && (
                        <span
                          className="px-2 py-0.5 rounded-md border capitalize font-medium"
                          style={{
                            background: 'rgba(212,168,83,0.1)',
                            borderColor: 'rgba(212,168,83,0.25)',
                            color: '#d4a853',
                          }}
                        >
                          {ticket.category?.replace(/_/g, ' ')}
                        </span>
                      )}
                      {ticket.priority && (
                        <span
                          className={cn(
                            'uppercase text-[10px] font-bold px-2 py-0.5 rounded-full border',
                            PRIORITY_BADGE[ticket.priority] ||
                              'border-border bg-muted text-muted-foreground'
                          )}
                        >
                          {ticket.priority} priority
                        </span>
                      )}
                      {ticket.status && (
                        <span
                          className={cn(
                            'capitalize text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                            STATUS_BADGE[ticket.status] ||
                              'border-border bg-muted text-muted-foreground'
                          )}
                        >
                          {ticket.status.replace('_', ' ')}
                        </span>
                      )}
                      {ticket.orderNumber && (
                        <span className="font-mono text-muted-foreground">
                          Order: {ticket.orderNumber}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-foreground">{ticket.subject}</h3>
                    <p className="text-xs text-muted-foreground">
                      Opened{' '}
                      {ticket.createdAt
                        ? format(new Date(ticket.createdAt), 'dd MMM yyyy, hh:mm a')
                        : '—'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={ticket.status}
                      onChange={(e) => handleStatusChange(ticket._id, e.target.value)}
                      style={{ width: 'auto' }}
                      className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold bg-background text-foreground"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Review</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : ticket._id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-5 border-t border-border bg-muted/20 space-y-4">
                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                      {ticket.messages?.map((msg: any, idx: number) => {
                        const isAdmin = msg.sender === 'admin';
                        const { cleanText, attachments } = parseMessageAndAttachments(msg);

                        return (
                          <div
                            key={msg._id || idx}
                            className={cn('flex gap-3', isAdmin && 'flex-row-reverse')}
                          >
                            <div
                              className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                                isAdmin ? 'bg-primary/10' : 'bg-muted border border-border'
                              )}
                            >
                              {isAdmin ? (
                                <Shield className="w-4 h-4" style={{ color: '#d4a853' }} />
                              ) : (
                                <User className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>

                            <div
                              className={cn(
                                'max-w-xl space-y-1 flex flex-col',
                                isAdmin ? 'items-end' : 'items-start'
                              )}
                            >
                              <span className="text-[11px] text-muted-foreground px-1">
                                {msg.senderName || (isAdmin ? 'Roastery Support' : cafeName)} ·{' '}
                                {format(
                                  new Date(msg.sentAt || ticket.createdAt),
                                  'dd MMM, hh:mm a'
                                )}
                              </span>
                              <div
                                className={cn(
                                  'p-3.5 rounded-2xl text-xs leading-relaxed space-y-2.5',
                                  isAdmin
                                    ? 'rounded-tr-sm text-foreground'
                                    : 'bg-card text-foreground border border-border rounded-tl-sm'
                                )}
                                style={
                                  isAdmin
                                    ? {
                                        background: 'rgba(212,168,83,0.12)',
                                        border: '1px solid rgba(212,168,83,0.25)',
                                      }
                                    : {}
                                }
                              >
                                {cleanText && <p className="whitespace-pre-wrap">{cleanText}</p>}

                                {/* Photo & Video Attachments */}
                                {attachments.length > 0 && (
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                                    {attachments.map((att, attIdx) => (
                                      <div
                                        key={attIdx}
                                        onClick={() => setLightboxMedia(att)}
                                        className="group relative rounded-xl overflow-hidden border border-border bg-black cursor-pointer aspect-square flex items-center justify-center"
                                      >
                                        {att.type === 'video' ? (
                                          <div className="relative w-full h-full flex items-center justify-center">
                                            <video
                                              src={att.url}
                                              className="w-full h-full object-cover"
                                              muted
                                              playsInline
                                            />
                                            <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                                              <span className="px-2 py-1 rounded-full bg-black/75 text-white text-[10px] font-medium flex items-center gap-1">
                                                <Video className="w-3 h-3 text-amber-400" /> Play
                                              </span>
                                            </div>
                                          </div>
                                        ) : (
                                          <>
                                            <img
                                              src={att.url}
                                              alt={att.name || 'Attachment'}
                                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                                              <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100" />
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Admin Reply Input + Media Attachment */}
                    <div className="pt-3 border-t border-border space-y-2.5">
                      {currentReplyAttachments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {currentReplyAttachments.map((att, i) => (
                            <div
                              key={i}
                              className="relative w-16 h-16 rounded-xl overflow-hidden border border-border bg-card"
                            >
                              {att.type === 'video' ? (
                                <video src={att.url} className="w-full h-full object-cover" muted />
                              ) : (
                                <img
                                  src={att.url}
                                  alt={att.name}
                                  className="w-full h-full object-cover"
                                />
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  setReplyAttachments((prev) => ({
                                    ...prev,
                                    [ticket._id]: (prev[ticket._id] || []).filter(
                                      (_, idx) => idx !== i
                                    ),
                                  }))
                                }
                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/75 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <input
                          ref={(el) => {
                            fileInputRefs.current[ticket._id] = el;
                          }}
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          className="hidden"
                          onChange={(e) => handleSelectReplyFiles(ticket._id, e)}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[ticket._id]?.click()}
                          className="px-3 py-2.5 rounded-xl bg-background border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center gap-1.5 shrink-0"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>Attach</span>
                        </button>
                        <input
                          type="text"
                          placeholder={`Reply to ${cafeName}...`}
                          value={replyText[ticket._id] || ''}
                          onChange={(e) =>
                            setReplyText({ ...replyText, [ticket._id]: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleReply(ticket._id);
                          }}
                          className="flex-1 px-4 py-2.5 rounded-xl bg-background border border-border text-xs text-foreground"
                        />
                        <button
                          disabled={
                            submittingTicketId === ticket._id ||
                            (!(replyText[ticket._id] || '').trim() &&
                              currentReplyAttachments.length === 0)
                          }
                          onClick={() => handleReply(ticket._id)}
                          className="px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 transition-all hover:opacity-90 shrink-0"
                          style={{ background: '#d4a853', color: '#1a1713' }}
                        >
                          {submittingTicketId === ticket._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>Send Reply</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Fullscreen Lightbox for Admin Inspection */}
      {lightboxMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setLightboxMedia(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-card rounded-3xl overflow-hidden border border-border shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border text-foreground">
              <span className="text-xs font-medium truncate">
                {lightboxMedia.name || 'Cafe Quality Attachment'}
              </span>
              <button
                type="button"
                onClick={() => setLightboxMedia(null)}
                className="p-1.5 rounded-xl bg-muted hover:bg-accent text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-black max-h-[78vh]">
              {lightboxMedia.type === 'video' ? (
                <video
                  src={lightboxMedia.url}
                  controls
                  autoPlay
                  className="max-h-[72vh] w-auto rounded-xl"
                />
              ) : (
                <img
                  src={lightboxMedia.url}
                  alt={lightboxMedia.name}
                  className="max-h-[72vh] w-auto object-contain rounded-xl"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
