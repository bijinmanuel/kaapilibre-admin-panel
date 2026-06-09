'use client';

import { useState, useEffect, useRef } from 'react';
import { FinanceLayout } from '@/components/finance/FinanceLayout';
import { EmptyState } from '@/components/finance/EmptyState';
import { LoadingState } from '@/components/finance/LoadingState';
import { ErrorState } from '@/components/finance/ErrorState';
import { DateRangePicker, DateRange } from '@/components/finance/DateRangePicker';
import { formatINR } from '@/utils/finance';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Plus, Check, X, Trash2, Edit2, FileText, IndianRupee,
  AlertCircle, ChevronDown, CheckCircle2, User, HelpCircle, ArrowUpRight,
  Upload, Loader2, Paperclip
} from 'lucide-react';

interface ExpenseItem {
  _id: string;
  title: string;
  category: 'Rent' | 'Salary' | 'Inventory' | 'Utility' | 'Marketing' | 'Maintenance' | 'Other';
  amount: number;
  entry_date: string;
  notes?: string;
  receipt_image?: string;
  status: 'pending' | 'approved' | 'rejected' | 'voided';
  rejection_reason?: string;
  created_by?: {
    _id: string;
    name: string;
    email: string;
  };
  approved_by?: {
    name: string;
  };
}

export default function ExpensesModulePage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  // Filters
  const [selectedType, setSelectedType] = useState<string>(''); // direct / indirect / financial
  const [selectedStatus, setSelectedStatus] = useState<string>(''); // pending / approved / rejected
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: '', endDate: '' });
  const [page, setPage] = useState(1);

  // Data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modal / Form state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<'Rent' | 'Salary' | 'Inventory' | 'Utility' | 'Marketing' | 'Maintenance' | 'Other'>('Other');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState('');
  const [formReceipt, setFormReceipt] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getCategoryType = (cat: string): 'direct' | 'indirect' | 'financial' => {
    if (cat === 'Inventory') return 'direct';
    if (cat === 'Other') return 'financial';
    return 'indirect'; // Rent, Salary, Utility, Marketing, Maintenance
  };

  const loadExpenses = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
      });

      if (selectedStatus) params.append('status', selectedStatus);
      if (dateRange.startDate) params.append('from', dateRange.startDate);
      if (dateRange.endDate) params.append('to', dateRange.endDate);

      const response: any = await api.get(`/finance/expenses?${params.toString()}`);
      if (response?.success) {
        // Filter by category type if selected (frontend-side filter for direct/indirect/financial)
        let data = response.data || [];
        if (selectedType) {
          data = data.filter((item: any) => getCategoryType(item.category) === selectedType);
        }
        setExpenses(data);
        setTotalPages(response.meta?.totalPages || 1);
        setTotalAmount(response.stats?.totalAmount || 0);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch expenses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [selectedType, selectedStatus, dateRange, page]);

  const handleOpenCreate = () => {
    setEditingExpense(null);
    setFormTitle('');
    setFormCategory('Other');
    setFormAmount('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormNotes('');
    setFormReceipt('');
    setShowFormModal(true);
  };

  const handleOpenEdit = (exp: ExpenseItem) => {
    setEditingExpense(exp);
    setFormTitle(exp.title);
    setFormCategory(exp.category);
    setFormAmount(exp.amount.toString());
    setFormDate(new Date(exp.entry_date).toISOString().split('T')[0]);
    setFormNotes(exp.notes || '');
    setFormReceipt(exp.receipt_image || '');
    setShowFormModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed as receipts.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Receipt image must be smaller than 5MB.');
      return;
    }

    try {
      setUploadingReceipt(true);
      const formData = new FormData();
      formData.append('image', file);

      const res: any = await api.post('/finance/expenses/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res?.success) {
        setFormReceipt(res.data.url);
        toast.success('Receipt uploaded successfully');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload receipt');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error('Title is required');
      return;
    }
    const valAmt = Number(formAmount);
    if (!formAmount || isNaN(valAmt) || valAmt <= 0) {
      toast.error('Enter a valid positive amount');
      return;
    }

    // EXP-06: Receipt required above ₹5,000
    if (valAmt > 5000 && (!formReceipt || formReceipt.trim() === '')) {
      toast.error('Receipt attachment is required for expenses above ₹5,000 (EXP-06).');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: formTitle,
        category: formCategory,
        amount: valAmt,
        entry_date: new Date(formDate),
        notes: formNotes,
        receipt_image: formReceipt,
      };

      let res: any;
      if (editingExpense) {
        res = await api.patch(`/finance/expenses/${editingExpense._id}`, payload);
      } else {
        res = await api.post('/finance/expenses', payload);
      }

      if (res?.success) {
        toast.success(editingExpense ? 'Expense claim updated successfully' : 'Expense claim submitted successfully');
        setShowFormModal(false);
        loadExpenses();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit expense claim');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = (id: string) => {
    toast('Approve this expense claim?', {
      description: 'This will post the ledger transaction.',
      action: {
        label: 'Confirm',
        onClick: async () => {
          try {
            const res: any = await api.patch(`/finance/expenses/${id}/approve`);
            if (res?.success) {
              toast.success('Expense claim approved successfully');
              loadExpenses();
            }
          } catch (err: any) {
            toast.error(err.message || 'Approval failed');
          }
        }
      }
    });
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) return;

    try {
      setSubmitting(true);
      const res: any = await api.patch(`/finance/expenses/${showRejectModal}/reject`, {
        rejection_reason: rejectionReason,
      });
      if (res?.success) {
        toast.success('Expense claim rejected successfully');
        setShowRejectModal(null);
        setRejectionReason('');
        loadExpenses();
      }
    } catch (err: any) {
      toast.error(err.message || 'Rejection failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    toast('Delete this expense claim?', {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            const res: any = await api.delete(`/finance/expenses/${id}`);
            if (res?.success) {
              toast.success('Expense claim deleted successfully');
              loadExpenses();
            }
          } catch (err: any) {
            toast.error(err.message || 'Failed to delete expense claim');
          }
        }
      }
    });
  };

  return (
    <FinanceLayout
      title="Expenses Claim Module"
      description="Record operational spending, upload receipts, and manage the approval workflow."
    >
      {/* Total amount summary card */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        <div className="bg-card border border-border rounded-xl p-6 relative overflow-hidden flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Filtered Spending</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{formatINR(totalAmount)}</h3>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-md"
            style={{ backgroundColor: '#d4a853', color: '#1a1713' }}
          >
            <Plus className="w-4 h-4" /> Create Expense Claim
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Status buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold">Status:</span>
            <div className="flex flex-wrap gap-1 bg-black/5 dark:bg-black/40 p-1 rounded-xl border border-border">
              {[
                { id: '', label: 'All Status' },
                { id: 'pending', label: 'Pending' },
                { id: 'approved', label: 'Approved' },
                { id: 'rejected', label: 'Rejected' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedStatus(s.id);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedStatus === s.id
                      ? 'shadow-sm font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-black/10 dark:hover:bg-white/5'
                  }`}
                  style={selectedStatus === s.id ? { backgroundColor: '#d4a853', color: '#1a1713' } : {}}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            {/* Category Type Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-semibold">Category Type:</span>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setPage(1);
                }}
                className="bg-black/5 dark:bg-black/40 border border-border rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-[#d4a853] min-w-[180px]"
              >
                <option value="">All Types (Direct/Indirect)</option>
                <option value="direct">Direct Expense</option>
                <option value="indirect">Indirect Expense</option>
                <option value="financial">Financial / Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Date range picker */}
        <div className="pt-4 border-t border-border">
          <DateRangePicker onChange={setDateRange} />
        </div>
      </div>

      {/* Expenses Table */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadExpenses} />
      ) : expenses.length === 0 ? (
        <EmptyState
          title="No expense claims found"
          description="There are no pending or approved claims registered under these criteria."
        />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-secondary border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
              <tr>
                <th className="text-left px-5 py-4 font-semibold">Date</th>
                <th className="text-left px-5 py-4 font-semibold">Title / Claim</th>
                <th className="text-left px-5 py-4 font-semibold">Category</th>
                <th className="text-left px-5 py-4 font-semibold">Type</th>
                <th className="text-right px-5 py-4 font-semibold">Amount</th>
                <th className="text-left px-5 py-4 font-semibold">Submitted By</th>
                <th className="text-center px-5 py-4 font-semibold">Status</th>
                <th className="text-right px-5 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground/90">
              {expenses.map((item) => {
                const type = getCategoryType(item.category);
                const isOwnClaim = item.created_by?._id === user?.id;

                return (
                  <tr key={item._id} className="hover:bg-secondary/50 transition-colors group">
                    <td className="px-5 py-4 text-muted-foreground whitespace-nowrap">
                      {new Date(item.entry_date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-4 font-medium">
                      <div>
                        {item.title}
                        {item.notes && <p className="text-[10px] text-muted-foreground font-normal mt-0.5">{item.notes}</p>}
                        {item.rejection_reason && item.status === 'rejected' && (
                          <p className="text-[10px] text-red-400 font-normal mt-0.5 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Reason: {item.rejection_reason}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary border border-border text-muted-foreground">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          type === 'direct'
                            ? 'bg-blue-500/10 text-blue-400'
                            : type === 'indirect'
                            ? 'bg-[#d4a853]/10 text-[#d4a853]'
                            : 'bg-purple-500/10 text-purple-400'
                        }`}
                      >
                        {type}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-foreground">
                      {formatINR(item.amount)}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground whitespace-nowrap">
                      {item.created_by?.name || '-'}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          item.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : item.status === 'rejected'
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-yellow-500/10 text-yellow-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end items-center gap-1.5">
                        {/* Receipt Icon Link */}
                        {item.receipt_image && (
                          <a
                            href={item.receipt_image}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground"
                            title="View Receipt"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {/* Edit Flow (Pending or Rejected, for Owner or Admin) */}
                        {item.status !== 'approved' && (isOwnClaim || isAdmin) && (
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Edit claim"
                            className="p-1 rounded bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Deletion (Only pending/rejected, for Owner or Admin) */}
                        {item.status !== 'approved' && (isOwnClaim || isAdmin) && (
                          <button
                            onClick={() => handleDelete(item._id)}
                            title="Delete claim"
                            className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Admin Approvals & Rejections (Self-approval block is enforced at backend) */}
                        {item.status === 'pending' && isAdmin && !isOwnClaim && (
                          <>
                            <button
                              onClick={() => handleApprove(item._id)}
                              title="Approve expense"
                              className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setShowRejectModal(item._id)}
                              title="Reject expense"
                              className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Previous
          </button>
          <span className="text-xs text-muted-foreground font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Next
          </button>
        </div>
      )}

      {/* Create / Edit Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-base font-bold text-foreground mb-4">
              {editingExpense ? 'Edit Expense Claim' : 'Create Expense Claim'}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Expense Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e: any) => setFormCategory(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-[#d4a853]"
                  required
                >
                  <option value="Rent">Rent (Indirect)</option>
                  <option value="Salary">Salary (Indirect)</option>
                  <option value="Inventory">Inventory (Direct)</option>
                  <option value="Utility">Utility (Indirect)</option>
                  <option value="Marketing">Marketing (Indirect)</option>
                  <option value="Maintenance">Maintenance (Indirect)</option>
                  <option value="Other">Other (Financial)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Title / Reason
                </label>
                <input
                  type="text"
                  placeholder="e.g. Electricity bill May or Coffee bag packaging"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-[#d4a853]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="2500.00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-[#d4a853]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Bill/Invoice Date
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-[#d4a853]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Receipt Attachment {Number(formAmount) > 5000 && <span className="text-red-400">* Required</span>}
                </label>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {uploadingReceipt ? (
                  <div className="w-full bg-secondary border border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-5 h-5 text-[#d4a853] animate-spin" />
                    <span>Uploading receipt...</span>
                  </div>
                ) : formReceipt ? (
                  <div className="w-full bg-secondary border border-border rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/10 flex-shrink-0 flex items-center justify-center border border-border">
                        {formReceipt.startsWith('http') ? (
                          <img src={formReceipt} alt="Receipt thumbnail" className="w-full h-full object-cover" />
                        ) : (
                          <Paperclip className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">Receipt Uploaded</p>
                        <a 
                          href={formReceipt} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[10px] text-[#d4a853] hover:underline truncate block"
                        >
                          View full image
                        </a>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormReceipt('')}
                      className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-muted-foreground hover:text-red-400 transition-colors"
                      title="Remove receipt"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-secondary hover:bg-secondary/70 border border-dashed border-border hover:border-[#d4a853]/50 rounded-xl p-6 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground transition-all group"
                  >
                    <Upload className="w-6 h-6 text-muted-foreground/60 group-hover:text-[#d4a853] transition-colors" />
                    <span className="group-hover:text-foreground transition-colors font-medium">Click to upload receipt</span>
                    <span className="text-[10px] text-muted-foreground/60">JPEG, PNG, or WebP up to 5MB</span>
                  </button>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  placeholder="Additional context about this payment..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-[#d4a853] h-20 resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 border border-border rounded-xl text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50"
                  style={{ backgroundColor: '#d4a853', color: '#1a1713' }}
                >
                  {submitting ? 'Saving...' : editingExpense ? 'Update Claim' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
            <h3 className="text-base font-bold text-foreground mb-2">Reject Expense Claim</h3>
            <p className="text-xs text-muted-foreground mb-4">Provide a reason for rejecting this claim. This is required.</p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <textarea
                  placeholder="e.g. Receipt is blurry or amount exceeds department budget."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-[#d4a853] h-24 resize-none"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectModal(null);
                    setRejectionReason('');
                  }}
                  className="px-4 py-2 border border-border rounded-xl text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !rejectionReason.trim()}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 transition-colors disabled:opacity-40"
                >
                  {submitting ? 'Rejecting...' : 'Reject Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </FinanceLayout>
  );
}
