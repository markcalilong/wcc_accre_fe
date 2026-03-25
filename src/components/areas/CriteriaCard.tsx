import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { AreaCriteria, FileUploadMetadata } from '../../types/area';
import FileUploadComponent from './FileUploadComponent';

interface CriteriaCardProps {
  criteria: AreaCriteria;
  onUploadSuccess: (criteriaId: number, subcriteriaId: number | null, newUpload: any) => void | Promise<void>;
  onDeleteUpload: (criteriaId: number, subcriteriaId: number | null, uploadId: number) => void | Promise<void>;
  onUpdateUploadStatus: (criteriaId: number, subcriteriaId: number | null, uploadId: number, status: string, remarks: string) => void | Promise<void>;
  userRole?: string;
  canUpload?: boolean;
}

const CriteriaCard: React.FC<CriteriaCardProps> = ({
  criteria,
  onUploadSuccess,
  onDeleteUpload,
  onUpdateUploadStatus,
  userRole = '',
  canUpload = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusBadge = (uploads: FileUploadMetadata[]) => {
    if (uploads.length === 0) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-50 text-zinc-400 border border-zinc-100 uppercase tracking-wider">No Files</span>;
    
    const allApproved = uploads.every(u => u.fileStatus === 'Approved');
    const someReviewed = uploads.some(u => u.fileStatus === 'Reviewed');
    
    if (allApproved) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-wider">Approved</span>;
    if (someReviewed) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wider">Reviewed</span>;
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-wider">On-going Review</span>;
  };

  return (
    <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
      <div 
        className="p-6 cursor-pointer flex items-center justify-between gap-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4 overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-indigo-700">{criteria.code}</span>
          </div>
          <div className="overflow-hidden">
            <h3 className="text-sm font-bold text-zinc-900 truncate" title={criteria.desc}>
              {criteria.desc}
            </h3>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              {getStatusBadge(criteria.criteriaUploads)}
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                {criteria.subcriteria.length} Sub-criteria
              </span>
            </div>
          </div>
        </div>
        <div className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      {isExpanded && (
        <div className="px-6 pb-6 pt-2 border-t border-zinc-50 space-y-8">
          {/* Criteria Uploads Section */}
          <div className="p-5 rounded-2xl bg-zinc-50/50 border border-zinc-100">
            <FileUploadComponent
              uploads={criteria.criteriaUploads}
              onUploadSuccess={(newUpload) => onUploadSuccess(criteria.id, null, newUpload)}
              onDelete={(uploadId) => onDeleteUpload(criteria.id, null, uploadId)}
              onUpdateStatus={(uploadId, status, remarks) => onUpdateUploadStatus(criteria.id, null, uploadId, status, remarks)}
              userRole={userRole}
              canUpload={canUpload}
            />
          </div>

          {/* Sub-criteria Section */}
          {criteria.subcriteria.length > 0 && (
            <div className="space-y-6">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-2">Sub-criteria Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {criteria.subcriteria.map((sub) => (
                  <div key={sub.id} className="p-5 rounded-2xl bg-white border border-zinc-100 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-zinc-600">{sub.code}</span>
                      </div>
                      <p className="text-xs font-bold text-zinc-900 line-clamp-2" title={sub.desc}>
                        {sub.desc}
                      </p>
                    </div>
                    
                    <div className="pt-2 border-t border-zinc-50">
                      <FileUploadComponent
                        uploads={sub.subCriteriaUploads}
                        onUploadSuccess={(newUpload) => onUploadSuccess(criteria.id, sub.id, newUpload)}
                        onDelete={(uploadId) => onDeleteUpload(criteria.id, sub.id, uploadId)}
                        onUpdateStatus={(uploadId, status, remarks) => onUpdateUploadStatus(criteria.id, sub.id, uploadId, status, remarks)}
                        isSubcriteria
                        userRole={userRole}
                        canUpload={canUpload}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CriteriaCard;
