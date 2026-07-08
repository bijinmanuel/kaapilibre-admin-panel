'use client'
import { useState, useRef } from 'react'
import {
  FileText,
  FileCode,
  Image as ImageIcon,
  Plus,
  Search,
  Trash2,
  Eye,
  Download,
  Loader2,
  X,
  Upload,
  Calendar,
  User,
  HardDrive,
  Edit
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { useCompanyDocuments, useUploadCompanyDocument, useDeleteCompanyDocument, useUpdateCompanyDocument, CompanyDocument } from '@/hooks/useCompanyDocuments'
import { getToken, API_URL_BASE, api } from '@/lib/api'

// Helper to format bytes to human readable format
function formatBytes(bytes: number, decimals = 1) {
  if (!bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [viewingDocument, setViewingDocument] = useState<CompanyDocument | null>(null)
  const [editingDocument, setEditingDocument] = useState<CompanyDocument | null>(null)
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState<CompanyDocument | null>(null)
  const [downloadingDocument, setDownloadingDocument] = useState<CompanyDocument | null>(null)

  const handleDownload = (doc: CompanyDocument) => {
    const token = getToken()
    const downloadUrl = `${API_URL_BASE}${doc.fileUrl}?token=${token}&download=true`
    window.location.href = downloadUrl
  }

  // API Hooks
  const { data: documents, isLoading } = useCompanyDocuments(searchQuery)
  const uploadDocMutation = useUploadCompanyDocument()
  const deleteDocMutation = useDeleteCompanyDocument()

  // Form State
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  // Drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const validateAndSetFile = (file: File) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid file type. Only PDF, Image (JPG/PNG/WebP/GIF), and Word Documents (DOC/DOCX) are allowed.')
      setSelectedFile(null)
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      setUploadError('File is too large. Maximum size is 15MB.')
      setSelectedFile(null)
      return
    }
    setUploadError(null)
    setSelectedFile(file)
    // Autopopulate title if empty
    if (!uploadForm.title) {
      const cleanName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
      setUploadForm(prev => ({ ...prev, title: cleanName }))
    }
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      setUploadError('Please select a file to upload.')
      return
    }
    if (!uploadForm.title.trim()) {
      setUploadError('Please enter a document title.')
      return
    }

    try {
      await uploadDocMutation.mutateAsync({
        title: uploadForm.title,
        description: uploadForm.description,
        file: selectedFile
      })
      // Reset state on success
      setUploadForm({ title: '', description: '' })
      setSelectedFile(null)
      setShowUploadModal(false)
    } catch (err: any) {
      setUploadError(err.message || 'Something went wrong during file upload.')
    }
  }

  // handleDeleteConfirm has been replaced by the DeleteDocumentConfirmationModal component workflow

  // Get icon based on file type
  const getDocIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-8 h-8 text-red-400" />
      case 'image':
        return <ImageIcon className="w-8 h-8 text-blue-400" />
      case 'doc':
        return <FileCode className="w-8 h-8 text-indigo-400" />
      default:
        return <FileText className="w-8 h-8 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Documents"
        description="Secure directory for internal company files, policies, reports, and assets"
        action={
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02] cursor-pointer"
            style={{ background: '#d4a853', color: '#1a1713' }}
          >
            <Plus className="w-4 h-4" /> Upload Document
          </button>
        }
      />

      {/* Control panel: Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card border border-border p-4 rounded-xl shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by title..."
            className="w-full pl-10 pr-4 py-2 bg-muted/30 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
          />
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
          <HardDrive className="w-4 h-4" />
          <span>Storage: Securely encrypted in transit & at rest</span>
        </div>
      </div>

      {/* Main Grid View */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border border-border bg-card/50 rounded-xl p-5 space-y-4 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-muted rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-muted rounded w-full" />
              <div className="flex items-center justify-between border-t border-border pt-4">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-4 bg-muted rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : documents && documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc) => (
            <div
              key={doc._id}
              className="border border-border bg-card hover:border-primary/30 transition-all rounded-xl p-5 flex flex-col justify-between group shadow-sm hover:shadow-md"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-muted/60 border border-border/50 rounded-xl">
                      {getDocIcon(doc.fileType)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-foreground text-sm leading-tight truncate group-hover:text-primary transition-colors" title={doc.title}>
                        {doc.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 truncate" title={doc.fileName}>
                        {doc.fileName}
                      </p>
                    </div>
                  </div>
                </div>

                {doc.description ? (
                  <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
                    {doc.description}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground/30 italic min-h-[2rem]">
                    No description provided
                  </p>
                )}
              </div>

              <div className="mt-5 space-y-3">
                {/* Metadata Row */}
                <div className="flex flex-col gap-1.5 border-t border-border pt-3.5 text-[11px] text-muted-foreground font-medium">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground/60" />
                    <span>Uploaded on {new Date(doc.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground/60" />
                    <span className="truncate">By {doc.uploadedBy?.name || 'Unknown Admin'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 border border-border text-muted-foreground">
                      {formatBytes(doc.fileSize)}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded capitalize" style={{ background: 'rgba(212,168,83,0.1)', color: '#d4a853', border: '1px solid rgba(212,168,83,0.2)' }}>
                      {doc.fileType}
                    </span>
                  </div>
                </div>

                {/* Actions Panel */}
                <div className="flex items-center gap-2 pt-1.5">
                  <button
                    onClick={() => setViewingDocument(doc)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-muted/50 border border-border hover:bg-accent text-foreground rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  <button
                    onClick={() => setDownloadingDocument(doc)}
                    className="flex items-center justify-center p-2 bg-muted/50 border border-border hover:bg-accent text-foreground rounded-lg transition-colors cursor-pointer"
                    title="Download original file"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingDocument(doc)}
                    className="p-2 border border-transparent hover:bg-accent text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
                    title="Edit document"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteDoc(doc)}
                    className="p-2 border border-transparent hover:bg-red-500/10 text-muted-foreground hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                    title="Delete document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-card border border-border rounded-2xl shadow-sm text-center p-6">
          <div className="p-4 bg-muted/60 border border-border rounded-full text-muted-foreground mb-4">
            <FileText className="w-10 h-10 text-muted-foreground/60" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No documents found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            {searchQuery ? "Your search did not return any matches. Try refiltering your terms." : "Securely store policies, records, layouts, and assets by uploading your first document."}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-6 flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02] cursor-pointer"
              style={{ background: '#d4a853', color: '#1a1713' }}
            >
              <Plus className="w-4 h-4" /> Upload First Document
            </button>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-bold text-foreground">Upload Document</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false)
                  setSelectedFile(null)
                  setUploadError(null)
                  setUploadForm({ title: '', description: '' })
                }}
                className="p-1.5 hover:bg-accent text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-5">
              {/* Title input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Document Title *</label>
                <input
                  type="text"
                  required
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Employee Handbook 2026"
                  className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                />
              </div>

              {/* Description input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description (Optional)</label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Provide details about the document contents or usage guidelines..."
                  rows={3}
                  className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground resize-none"
                />
              </div>

              {/* File drop zone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-semibold">Select File *</label>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors relative flex flex-col items-center justify-center min-h-[140px] ${
                    dragActive ? 'border-primary bg-primary/5' : 'border-border bg-muted/10 hover:bg-muted/20'
                  }`}
                >
                  <input
                    type="file"
                    id="doc-file-input"
                    accept=".pdf,.doc,.docx,image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="space-y-2 pointer-events-none flex flex-col items-center">
                    <div className="p-3 bg-muted border border-border rounded-xl text-muted-foreground">
                      <Upload className="w-5 h-5 text-muted-foreground/60" />
                    </div>
                    {selectedFile ? (
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground max-w-[320px] truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(selectedFile.size)} · Click or drag to change
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          Click to upload or drag & drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PDF, Word (DOC/DOCX), or Images · Max 15MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {uploadError && (
                <div className="text-xs bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg">
                  {uploadError}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  disabled={uploadDocMutation.isPending}
                  onClick={() => {
                    setShowUploadModal(false)
                    setSelectedFile(null)
                    setUploadError(null)
                    setUploadForm({ title: '', description: '' })
                  }}
                  className="px-4 py-2 border border-border text-foreground hover:bg-accent text-sm font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadDocMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                  style={{ background: '#d4a853', color: '#1a1713' }}
                >
                  {uploadDocMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                    </>
                  ) : (
                    'Upload'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Viewing Modal */}
      {viewingDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-card flex-shrink-0">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  {viewingDocument.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Type: <span className="uppercase font-medium text-foreground">{viewingDocument.fileType}</span> · Size: {formatBytes(viewingDocument.fileSize)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDownloadingDocument(viewingDocument)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/60 hover:bg-accent border border-border text-foreground rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
                <button
                  onClick={() => setViewingDocument(null)}
                  className="p-1.5 hover:bg-accent text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Secure Document Viewer */}
            <div className="flex-1 bg-muted/10 p-5 overflow-auto flex flex-col items-center justify-center">
              {viewingDocument.fileType === 'pdf' && (
                <iframe
                  src={`${API_URL_BASE}${viewingDocument.fileUrl}?token=${getToken()}#toolbar=0`}
                  title={viewingDocument.title}
                  className="w-full h-full border-0 rounded-lg shadow-sm bg-white"
                />
              )}

              {viewingDocument.fileType === 'image' && (
                <div className="relative max-w-full max-h-full flex items-center justify-center">
                  <img
                    src={`${API_URL_BASE}${viewingDocument.fileUrl}?token=${getToken()}`}
                    alt={viewingDocument.title}
                    className="object-contain rounded-lg shadow-md max-w-full max-h-[70vh] border border-border bg-black/20"
                  />
                </div>
              )}

              {viewingDocument.fileType === 'doc' && (
                <div className="max-w-md w-full border border-border bg-card p-8 rounded-2xl shadow-xl text-center space-y-5">
                  <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl inline-block">
                    <FileCode className="w-10 h-10 text-indigo-400" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-base font-bold text-foreground truncate">{viewingDocument.fileName}</h4>
                    <p className="text-xs text-muted-foreground">
                      Word documents cannot be displayed natively in the web browser. Please download the document to edit or review it on your device.
                    </p>
                  </div>
                  <button
                    onClick={() => setDownloadingDocument(viewingDocument)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.01] cursor-pointer"
                    style={{ background: '#d4a853', color: '#1a1713' }}
                  >
                    <Download className="w-4 h-4" /> Download Document
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteDoc && (
        <DeleteDocumentConfirmationModal
          documentId={confirmDeleteDoc._id}
          documentTitle={confirmDeleteDoc.title}
          onClose={() => setConfirmDeleteDoc(null)}
        />
      )}

      {/* Edit Modal */}
      {editingDocument && (
        <EditDocumentModal
          document={editingDocument}
          onClose={() => setEditingDocument(null)}
        />
      )}

      {/* Download Password Modal */}
      {downloadingDocument && (
        <DownloadPasswordModal
          document={downloadingDocument}
          onClose={() => setDownloadingDocument(null)}
        />
      )}
    </div>
  )
}

// Edit Document Modal Component
function EditDocumentModal({
  document,
  onClose
}: {
  document: CompanyDocument
  onClose: () => void
}) {
  const updateDocMutation = useUpdateCompanyDocument()
  const [title, setTitle] = useState(document.title)
  const [description, setDescription] = useState(document.description || '')
  const [password, setPassword] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const validateAndSetFile = (file: File) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid file type. Only PDF, Image (JPG/PNG/WebP/GIF), and Word Documents (DOC/DOCX) are allowed.')
      setSelectedFile(null)
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      setUploadError('File is too large. Maximum size is 15MB.')
      setSelectedFile(null)
      return
    }
    setUploadError(null)
    setSelectedFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      setUploadError('Password is required to confirm changes.')
      return
    }
    if (!title.trim()) {
      setUploadError('Title is required.')
      return
    }

    try {
      await updateDocMutation.mutateAsync({
        id: document._id,
        title,
        description,
        password,
        file: selectedFile || undefined
      })
      onClose()
    } catch (err: any) {
      setUploadError(err.message || 'Verification or update failed.')
    }
  }

  // Helper to format bytes
  const formatBytes = (bytes: number, decimals = 1) => {
    if (!bytes) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">Edit Document</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-accent text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Document Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Employee Handbook 2026"
              className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
            />
          </div>

          {/* Description input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details about the document..."
              rows={3}
              className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground resize-none"
            />
          </div>

          {/* File replacement drop zone */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-semibold">Replace File (Optional)</label>
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors relative flex flex-col items-center justify-center min-h-[140px] ${
                dragActive ? 'border-primary bg-primary/5' : 'border-border bg-muted/10 hover:bg-muted/20'
              }`}
            >
              <input
                type="file"
                id="edit-doc-file-input"
                accept=".pdf,.doc,.docx,image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="space-y-2 pointer-events-none flex flex-col items-center">
                <div className="p-3 bg-muted border border-border rounded-xl text-muted-foreground">
                  <Upload className="w-5 h-5 text-muted-foreground/60" />
                </div>
                {selectedFile ? (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground max-w-[320px] truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(selectedFile.size)} · Click or drag to change
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      Drag new file here or click to replace
                    </p>
                    <p className="text-xs text-muted-foreground truncate max-w-[320px]">
                      Current: {document.fileName} ({formatBytes(document.fileSize)})
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Password recheck verification */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Confirm Admin Password *</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your account password to confirm changes"
              className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
            />
          </div>

          {uploadError && (
            <div className="text-xs bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg">
              {uploadError}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              disabled={updateDocMutation.isPending}
              onClick={onClose}
              className="px-4 py-2 border border-border text-foreground hover:bg-accent text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateDocMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              style={{ background: '#d4a853', color: '#1a1713' }}
            >
              {updateDocMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Delete Document Confirmation Modal Component
function DeleteDocumentConfirmationModal({
  documentId,
  documentTitle,
  onClose
}: {
  documentId: string
  documentTitle: string
  onClose: () => void
}) {
  const deleteDocMutation = useDeleteCompanyDocument()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      setError('Password is required to confirm deletion.')
      return
    }

    try {
      await deleteDocMutation.mutateAsync({ id: documentId, password })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Verification or deletion failed.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">Confirm Delete</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-accent text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              Are you sure you want to permanently delete <strong className="text-foreground">{documentTitle}</strong>?
            </p>
            <p className="text-red-400/90 font-medium">
              This action will destroy the file record in the database and delete the asset from secure cloud storage. This cannot be undone.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Confirm Admin Password *</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your account password to confirm deletion"
              className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
            />
          </div>

          {error && (
            <div className="text-xs bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              disabled={deleteDocMutation.isPending}
              onClick={onClose}
              className="px-4 py-2 border border-border text-foreground hover:bg-accent text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={deleteDocMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              {deleteDocMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Deleting...
                </>
              ) : (
                'Delete Document'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Download Password Modal Component
function DownloadPasswordModal({
  document,
  onClose
}: {
  document: CompanyDocument
  onClose: () => void
}) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      setError('Password is required to confirm downloading.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await api.get(document.fileUrl, {
        params: { download: 'true' },
        headers: {
          'x-confirm-password': password
        },
        responseType: 'blob'
      })

      const blob = response as unknown as Blob
      const url = window.URL.createObjectURL(blob)
      const a = window.document.createElement('a')
      a.href = url
      a.download = document.fileName
      window.document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()

      onClose()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Incorrect password. Download cancelled.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">Confirm Download</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-accent text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              Please enter your password to confirm download of <strong className="text-foreground">{document.fileName}</strong>.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Confirm Admin Password *</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your account password to confirm download"
              className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
            />
          </div>

          {error && (
            <div className="text-xs bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2 border border-border text-foreground hover:bg-accent text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              style={{ background: '#d4a853', color: '#1a1713' }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                </>
              ) : (
                'Confirm & Download'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
