import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Trash2, Loader2, CheckCircle2, Clock, AlertCircle, Eye, X, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';
import { FileUploadMetadata } from '../../types/area';
import { canApprove, canReview, canDelete as canDeleteFile, getAvailableStatuses } from '../../utils/roles';

interface FileUploadComponentProps {
  uploads: FileUploadMetadata[];
  onUploadSuccess: (newUpload: any) => void;
  onDelete: (uploadId: number) => void;
  onUpdateStatus: (uploadId: number, status: string, remarks: string) => void;
  isSubcriteria?: boolean;
  userRole?: string;
}

function getFileUrl(upload: FileUploadMetadata): string | null {
  const fileData = Array.isArray(upload.fileUpload) ? upload.fileUpload[0] : upload.fileUpload;
  const url = (fileData as any)?.url || (fileData as any)?.data?.attributes?.url || (Array.isArray((fileData as any)?.data) ? (fileData as any)?.data[0]?.attributes?.url : undefined);
  if (!url) return null;
  return url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL || 'http://localhost:1337'}${url}`;
}

function PdfViewerModal({ url, fileName, onClose }: { url: string; fileName: string; onClose: () => void }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    const fetchPdf = async () => {
      try {
        // Fetch PDF as blob to bypass X-Frame-Options / iframe restrictions
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
        const blob = await response.blob();
        if (!cancelled) {
          objectUrl = URL.createObjectURL(blob);
          setBlobUrl(objectUrl);
          setLoading(false);
        }
      } catch {
        // Fallback: use Google Docs Viewer to render the PDF
        if (!cancelled) {
          const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
          setBlobUrl(googleViewerUrl);
          setLoading(false);
        }
      }
    };
    fetchPdf();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-5xl h-[90vh] mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50">
          <div className="flex items-center gap-3 overflow-hidden">
            <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
            <h3 className="text-sm font-bold text-zinc-900 truncate">{fileName}</h3>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-600 hover:text-indigo-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in New Tab
            </a>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 bg-zinc-100">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-sm text-zinc-500">Loading PDF...</p>
            </div>
          ) : (
            <iframe
              src={blobUrl || url}
              className="w-full h-full border-0"
              title={`PDF Viewer - ${fileName}`}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function FileUploadComponent({
  uploads,
  onUploadSuccess,
  onDelete,
  onUpdateStatus,
  isSubcriteria = false,
  userRole = ''
}: FileUploadComponentProps) {
  const roleKey = userRole.toLowerCase().replace(/\s+/g, '_');
  const hasReviewAccess = canReview(roleKey);
  const hasApproveAccess = canApprove(roleKey);
  const hasDeleteAccess = canDeleteFile(roleKey);
  const availableStatuses = getAvailableStatuses(roleKey);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewingPdf, setViewingPdf] = useState<{ url: string; fileName: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const token = localStorage.getItem('jwt');
    if (!token) return;

    setUploading(true);
    setError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type !== 'application/pdf') {
          setError('Only PDF files are allowed');
          continue;
        }

        // 1. Upload file to Strapi
        const uploadedFile = await api.uploadFile(token, file);

        const user = JSON.parse(localStorage.getItem('user') || '{}');

        // 2. Create metadata entry (this will be handled by the parent component's updateArea call)
        onUploadSuccess({
          fileUpload: { id: uploadedFile.id, name: uploadedFile.name, url: uploadedFile.url },
          fileName: file.name,
          fileStatus: 'On-going Review',
          remarks: '',
          uploader: { id: user.id, username: user.username }
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload files');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-wider"><CheckCircle2 className="w-3 h-3" /> Approved</span>;
      case 'Reviewed':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wider"><FileText className="w-3 h-3" /> Reviewed</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-wider"><Clock className="w-3 h-3" /> On-going Review</span>;
    }
  };

  return (
    <div className="space-y-4">
      {viewingPdf && (
        <PdfViewerModal
          url={viewingPdf.url}
          fileName={viewingPdf.fileName}
          onClose={() => setViewingPdf(null)}
        />
      )}

      <div className="flex items-center justify-between gap-4">
        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
          {isSubcriteria ? 'Sub-Criteria Uploads' : 'Criteria Uploads'}
        </h4>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-white bg-[#4a86f7] hover:bg-blue-600 rounded-lg transition-all disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
          Upload PDF
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf"
          multiple
          className="hidden"
        />
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-2">
        {uploads.length === 0 ? (
          <p className="text-xs text-zinc-400 italic py-2">No files uploaded yet.</p>
        ) : (
          uploads.map((upload, index) => {
            const fileUrl = getFileUrl(upload);
            return (
              <div key={upload.id || `new-upload-${index}-${upload.fileName}`} className="group flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-100 hover:border-zinc-200 transition-all">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-white border border-zinc-100 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="overflow-hidden">
                    {fileUrl ? (
                      <button
                        onClick={() => setViewingPdf({ url: fileUrl, fileName: upload.fileName })}
                        className="text-sm font-bold text-indigo-600 hover:text-indigo-800 truncate block transition-colors text-left"
                        title={`View ${upload.fileName}`}
                      >
                        {upload.fileName}
                      </button>
                    ) : (
                      <p className="text-sm font-bold text-zinc-900 truncate" title={upload.fileName}>
                        {upload.fileName}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                      {getStatusBadge(upload.fileStatus)}
                      {upload.remarks && (
                        <span className="text-[10px] text-zinc-400 truncate max-w-[150px]">
                          • {upload.remarks}
                        </span>
                      )}
                      {upload.uploader && (
                        <span className="text-[10px] text-zinc-400">
                          • By {upload.uploader.username}
                        </span>
                      )}
                      {upload.approver && (
                        <span className="text-[10px] text-emerald-500 font-medium">
                          • Approved by {upload.approver.username}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {fileUrl && (
                    <button
                      onClick={() => setViewingPdf({ url: fileUrl, fileName: upload.fileName })}
                      className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      title="View PDF"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {hasReviewAccess && availableStatuses.length > 0 && (
                    <select
                      value={upload.fileStatus}
                      onChange={(e) => onUpdateStatus(upload.id, e.target.value, upload.remarks || '')}
                      className="text-[10px] font-bold bg-white border border-zinc-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {availableStatuses.map(s => (
                        <option key={s} value={s}>{s === 'On-going Review' ? 'Reviewing' : s}</option>
                      ))}
                    </select>
                  )}
                  {hasDeleteAccess && (
                    <button
                      onClick={() => onDelete(upload.id)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
