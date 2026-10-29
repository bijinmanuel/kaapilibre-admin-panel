'use client';

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Send,
  ChevronDown,
  ChevronUp,
  Store,
  Shield,
  User,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { cn } from '@/lib/utils';

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

export default function CafeComplaintsAdminPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const res = (await api.get(
        `/cafe-portal/admin/complaints?status=${statusFilter}`
      )) as any;
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
      toast.error(err.message || 'Failed to load cafe complaints');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter]);

  const handleReply = async (ticketId: string) => {
    const message = (replyText[ticketId] || '').trim();
    if (!message) return;

    setIsSubmitting(true);
    try {
      await api.post(`/cafe-portal/admin/complaints/${ticketId}/reply`, { message });
      toast.success('Reply sent to cafe');
      setReplyText((prev) => ({ ...prev, [ticketId]: '' }));
      fetchComplaints();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (ticketId: string, status: string) => {
    try {
      await api.patch(`/cafe-portal/admin/complaints/${ticketId}/status`, { status });
      toast.success(`Ticket marked as ${status.replace('_', ' ')}`);
      fetchComplaints();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cafe Complaints & Quality Feedback"
        description="Manage roast quality reports, shipment issues, and support threads from partner cafes"
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
                  style={
                    active
                      ? { background: '#d4a853', color: '#1a1713' }
                      : {}
                  }
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
                      <span
                        className="font-mono font-bold"
                        style={{ color: '#d4a853' }}
                      >
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
                          {ticket.category.replace(/_/g, ' ')}
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
                    <h3 className="text-base font-semibold text-foreground">
                      {ticket.subject}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Opened{' '}
                      {ticket.createdAt
                        ? format(new Date(ticket.createdAt), 'dd MMM yyyy, hh:mm a')
                        : '—'}
                    </p>
                  </div>

                  <div
                    className="flex items-center gap-3"
                    onClick={(e) => e.stopPropagation()}
                  >
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
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                      {ticket.messages?.map((msg: any, idx: number) => {
                        const isAdmin = msg.sender === 'admin';
                        return (
                          <div
                            key={msg._id || idx}
                            className={cn(
                              'flex gap-3',
                              isAdmin && 'flex-row-reverse'
                            )}
                          >
                            <div
                              className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                                isAdmin ? 'bg-primary/10' : 'bg-muted border border-border'
                              )}
                            >
                              {isAdmin ? (
                                <Shield
                                  className="w-4 h-4"
                                  style={{ color: '#d4a853' }}
                                />
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
                                {msg.senderName ||
                                  (isAdmin ? 'Roastery Support' : cafeName)}{' '}
                                ·{' '}
                                {msg.sentAt
                                  ? format(new Date(msg.sentAt), 'dd MMM, hh:mm a')
                                  : ''}
                              </span>
                              <div
                                className={cn(
                                  'p-3.5 rounded-2xl text-xs leading-relaxed',
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
                                {msg.message}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-border">
                      <input
                        type="text"
                        placeholder={`Reply to ${cafeName}...`}
                        value={replyText[ticket._id] || ''}
                        onChange={(e) =>
                          setReplyText({
                            ...replyText,
                            [ticket._id]: e.target.value,
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleReply(ticket._id);
                        }}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-background border border-border text-xs text-foreground"
                      />
                      <button
                        disabled={
                          isSubmitting || !(replyText[ticket._id] || '').trim()
                        }
                        onClick={() => handleReply(ticket._id)}
                        className="px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 transition-all hover:opacity-90 flex-shrink-0"
                        style={{ background: '#d4a853', color: '#1a1713' }}
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Reply</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

