import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Area, AreaCriteria, FileUploadMetadata } from '../types/area';
import {
  Loader2, AlertCircle, RefreshCw, CheckCircle2, FileText, Clock, Eye, X, ExternalLink,
  ChevronDown, ChevronUp, User, Calendar, GraduationCap, Layers, Upload
} from 'lucide-react';
import { getUserPersonelRole, isApprover, isReviewer, hasManagementAccess, canUploadToCriteria } from '../utils/roles';

// A pending review/approve item (has an existing upload)
interface PendingReviewItem {
  type: 'review' | 'approve';
  upload: FileUploadMetadata;
  area: Area;
  criteria: AreaCriteria;
  subcriteriaCode?: string;
  subcriteriaDesc?: string;
  subcriteriaId?: number;
  isSubcriteria: boolean;
}

// A pending upload item (criteria/subcriteria that needs files from this user)
interface PendingUploadItem {
  type: 'upload';
  area: Area;
  criteria: AreaCriteria;
  subcriteriaCode?: string;
  subcriteriaDesc?: string;
  subcriteriaId?: number;
  isSubcriteria: boolean;
  existingUploadCount: number;
}

type PendingItem = PendingReviewItem | PendingUploadItem;

function PdfViewerModal({ url, fileName, onClose }: { url: string; fileName: string; onClose: () => void }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    const fetchPdf = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
        const blob = await response.blob();
        if (!cancelled) {
          objectUrl = URL.createObjectURL(blob);
          setBlobUrl(objectUrl);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setBlobUrl(`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`);
          setLoading(false);
        }
      }
    };
    fetchPdf();
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
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
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-600 hover:text-indigo-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all">
              <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
            </a>
            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all">
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
            <iframe src={blobUrl || url} className="w-full h-full border-0" title={`PDF Viewer - ${fileName}`} />
          )}
        </div>
      </div>
    </div>
  );
}

function getFileUrl(upload: FileUploadMetadata): string | null {
  const fileData = Array.isArray(upload.fileUpload) ? upload.fileUpload[0] : upload.fileUpload;
  const url = (fileData as any)?.url || (fileData as any)?.data?.attributes?.url;
  if (!url) return null;
  return url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL || 'http://localhost:1337'}${url}`;
}

export default function PendingTasks() {
  const navigate = useNavigate();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [viewingPdf, setViewingPdf] = useState<{ url: string; fileName: string } | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);
  const [expandedArea, setExpandedArea] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'upload' | 'review' | 'approve'>('all');

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('jwt');
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [areasData, userResult] = await Promise.all([
        api.getAreas(token),
        api.getMe(token).catch(() => null),
      ]);
      setAreas(areasData);
      setUserData(userResult);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const personelRoleName = useMemo(() => userData ? getUserPersonelRole(userData) : '', [userData]);
  const isAdmin = useMemo(() => hasManagementAccess(personelRoleName), [personelRoleName]);
  const userCanApprove = useMemo(() => isApprover(personelRoleName), [personelRoleName]);
  const userCanReview = useMemo(() => isReviewer(personelRoleName), [personelRoleName]);

  // Collect user's program codes
  const userProgramCodes = useMemo(() => {
    const codes: string[] = [];
    const userOwnProgram = typeof userData?.academic_program === 'string'
      ? userData.academic_program
      : userData?.academic_program?.programCode;
    if (userOwnProgram && userOwnProgram.trim()) {
      codes.push(userOwnProgram.toLowerCase().trim());
    }
    const roleCoveredPrograms = userData?.personel_role?.coveredPrograms || [];
    for (const cp of roleCoveredPrograms) {
      const code = cp.academic_program?.programCode;
      if (code && !codes.includes(code.toLowerCase().trim())) {
        codes.push(code.toLowerCase().trim());
      }
    }
    return codes;
  }, [userData]);

  const userCoveredAreas = useMemo(() => {
    return userData?.personel_role?.coveredAreas?.map(
      (a: any) => a.area_with_permission.toLowerCase().trim()
    ) || [];
  }, [userData]);

  // Build pending items list
  const pendingItems = useMemo(() => {
    const items: PendingItem[] = [];

    areas.forEach(area => {
      // Filter by coveredAreas (non-admin must have area in coveredAreas)
      if (!isAdmin && userCoveredAreas.length > 0) {
        if (!userCoveredAreas.includes(area.area.toLowerCase().trim())) return;
      }

      area.areaCriteria.forEach(criteria => {
        // Filter by program
        if (!isAdmin && userProgramCodes.length > 0 && criteria.academic_program?.programCode) {
          if (!userProgramCodes.includes(criteria.academic_program.programCode.toLowerCase().trim())) return;
        }

        const canUpload = userData ? canUploadToCriteria(userData, area.area, criteria.code) : false;

        // === UPLOAD TASKS (for uploaders) ===
        // Show criteria/subcriteria where user can upload but no files exist yet (or no approved files)
        if (canUpload) {
          const criteriaUploads = criteria.criteriaUploads || [];
          // If criteria has subcriteria, check each subcriteria individually
          if (criteria.subcriteria && criteria.subcriteria.length > 0) {
            criteria.subcriteria.forEach(sub => {
              const subUploads = sub.subCriteriaUploads || [];
              // Show as pending upload if no uploads exist or none are approved
              const hasApproved = subUploads.some(u => u.fileStatus === 'Approved');
              if (!hasApproved) {
                items.push({
                  type: 'upload',
                  area,
                  criteria,
                  isSubcriteria: true,
                  subcriteriaCode: sub.code,
                  subcriteriaDesc: sub.desc,
                  subcriteriaId: sub.id,
                  existingUploadCount: subUploads.length,
                });
              }
            });
          } else {
            // No subcriteria — check criteria-level uploads
            const hasApproved = criteriaUploads.some(u => u.fileStatus === 'Approved');
            if (!hasApproved) {
              items.push({
                type: 'upload',
                area,
                criteria,
                isSubcriteria: false,
                existingUploadCount: criteriaUploads.length,
              });
            }
          }
        }

        // === REVIEW TASKS (for reviewers) ===
        if (userCanReview) {
          criteria.criteriaUploads?.forEach(upload => {
            if (upload.fileStatus === 'On-going Review') {
              items.push({ type: 'review', upload, area, criteria, isSubcriteria: false });
            }
          });
          criteria.subcriteria?.forEach(sub => {
            sub.subCriteriaUploads?.forEach(upload => {
              if (upload.fileStatus === 'On-going Review') {
                items.push({
                  type: 'review', upload, area, criteria, isSubcriteria: true,
                  subcriteriaCode: sub.code, subcriteriaDesc: sub.desc, subcriteriaId: sub.id
                });
              }
            });
          });
        }

        // === APPROVE TASKS (for approvers) ===
        if (userCanApprove) {
          criteria.criteriaUploads?.forEach(upload => {
            if (upload.fileStatus === 'Reviewed') {
              items.push({ type: 'approve', upload, area, criteria, isSubcriteria: false });
            }
          });
          criteria.subcriteria?.forEach(sub => {
            sub.subCriteriaUploads?.forEach(upload => {
              if (upload.fileStatus === 'Reviewed') {
                items.push({
                  type: 'approve', upload, area, criteria, isSubcriteria: true,
                  subcriteriaCode: sub.code, subcriteriaDesc: sub.desc, subcriteriaId: sub.id
                });
              }
            });
          });
        }
      });
    });

    return items;
  }, [areas, isAdmin, userCoveredAreas, userProgramCodes, userCanApprove, userCanReview, userData]);

  // Filter items by active tab
  const filteredItems = useMemo(() => {
    if (activeTab === 'all') return pendingItems;
    return pendingItems.filter(i => i.type === activeTab);
  }, [pendingItems, activeTab]);

  // Group items by area
  const groupedByArea = useMemo(() => {
    const groups: Record<string, { area: Area; items: PendingItem[] }> = {};
    filteredItems.forEach(item => {
      const key = item.area.documentId || String(item.area.id);
      if (!groups[key]) groups[key] = { area: item.area, items: [] };
      groups[key].items.push(item);
    });
    return Object.values(groups);
  }, [filteredItems]);

  // Counts
  const uploadCount = useMemo(() => pendingItems.filter(i => i.type === 'upload').length, [pendingItems]);
  const reviewCount = useMemo(() => pendingItems.filter(i => i.type === 'review').length, [pendingItems]);
  const approveCount = useMemo(() => pendingItems.filter(i => i.type === 'approve').length, [pendingItems]);

  const handleUpdateStatus = async (item: PendingReviewItem, newStatus: string) => {
    const token = localStorage.getItem('jwt');
    if (!token || !item.area.documentId) return;

    setUpdating(item.upload.id);
    try {
      const currentArea = await api.getAreaById(token, item.area.documentId);
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

      const updatedCriteria = currentArea.areaCriteria.map((c: any) => {
        if (c.id !== item.criteria.id) return c;

        if (!item.isSubcriteria) {
          return {
            ...c,
            criteriaUploads: c.criteriaUploads.map((u: any) => {
              if (u.id !== item.upload.id) return u;
              const approverUpdate = newStatus === 'Approved' ? { approver: currentUser.id } : {};
              return { ...u, fileStatus: newStatus, ...approverUpdate };
            })
          };
        } else {
          return {
            ...c,
            subcriteria: c.subcriteria.map((s: any) => {
              if (s.id !== item.subcriteriaId) return s;
              return {
                ...s,
                subCriteriaUploads: s.subCriteriaUploads.map((u: any) => {
                  if (u.id !== item.upload.id) return u;
                  const approverUpdate = newStatus === 'Approved' ? { approver: currentUser.id } : {};
                  return { ...u, fileStatus: newStatus, ...approverUpdate };
                })
              };
            })
          };
        }
      });

      // Clean criteria for update
      const cleanedCriteria = updatedCriteria.map((c: any) => ({
        ...(typeof c.id === 'number' ? { id: c.id } : {}),
        code: c.code,
        desc: c.desc,
        academic_program: c.academic_program?.id || c.academic_program || null,
        academic_year: c.academic_year?.id || c.academic_year || null,
        criteriaUploads: (c.criteriaUploads || []).map((u: any) => {
          const fileData = Array.isArray(u.fileUpload) ? u.fileUpload[0] : u.fileUpload;
          const uploaderData = Array.isArray(u.uploader) ? u.uploader[0] : u.uploader;
          const approverData = Array.isArray(u.approver) ? u.approver[0] : u.approver;
          return {
            ...(typeof u.id === 'number' ? { id: u.id } : {}),
            fileName: u.fileName,
            fileStatus: u.fileStatus,
            remarks: u.remarks,
            fileUpload: fileData?.id || fileData?.data?.id || fileData,
            uploader: uploaderData?.id || uploaderData?.data?.id || uploaderData,
            approver: approverData?.id || approverData?.data?.id || approverData,
          };
        }),
        subcriteria: (c.subcriteria || []).map((s: any) => ({
          ...(typeof s.id === 'number' ? { id: s.id } : {}),
          code: s.code,
          desc: s.desc,
          subCriteriaUploads: (s.subCriteriaUploads || []).map((u: any) => {
            const fileData = Array.isArray(u.fileUpload) ? u.fileUpload[0] : u.fileUpload;
            const uploaderData = Array.isArray(u.uploader) ? u.uploader[0] : u.uploader;
            const approverData = Array.isArray(u.approver) ? u.approver[0] : u.approver;
            return {
              ...(typeof u.id === 'number' ? { id: u.id } : {}),
              fileName: u.fileName,
              fileStatus: u.fileStatus,
              remarks: u.remarks,
              fileUpload: fileData?.id || fileData?.data?.id || fileData,
              uploader: uploaderData?.id || uploaderData?.data?.id || uploaderData,
              approver: approverData?.id || approverData?.data?.id || approverData,
            };
          })
        }))
      }));

      await api.updateArea(token, item.area.documentId, { areaCriteria: cleanedCriteria });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-zinc-500 font-medium">Loading pending tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 rounded-3xl bg-rose-50 border border-rose-100 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
        <h3 className="text-lg font-bold text-rose-900">Failed to load data</h3>
        <p className="text-rose-600/80">{error}</p>
        <button onClick={fetchData} className="px-6 py-2 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {viewingPdf && (
        <PdfViewerModal url={viewingPdf.url} fileName={viewingPdf.fileName} onClose={() => setViewingPdf(null)} />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-zinc-900 tracking-tight">Pending Tasks</h1>
          <p className="text-zinc-500 mt-2 text-lg">Your pending uploads, reviews, and approvals.</p>
        </div>
        <button onClick={fetchData}
          className="p-4 bg-white border border-zinc-100 text-zinc-400 hover:text-indigo-600 rounded-2xl hover:bg-zinc-50 transition-all shadow-sm">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className={`grid grid-cols-1 gap-6 ${uploadCount > 0 ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
        {uploadCount > 0 && (
          <button
            onClick={() => setActiveTab(activeTab === 'upload' ? 'all' : 'upload')}
            className={`bg-white rounded-2xl border shadow-sm p-6 text-left transition-all ${
              activeTab === 'upload' ? 'border-violet-300 ring-2 ring-violet-100' : 'border-zinc-100 hover:border-violet-200'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                <Upload className="w-5 h-5 text-violet-500" />
              </div>
              <p className="text-sm font-bold text-violet-600 uppercase tracking-wider">Needs Upload</p>
            </div>
            <p className="text-4xl font-bold text-zinc-900">{uploadCount}</p>
            <p className="text-sm text-zinc-400 mt-1">Criteria</p>
          </button>
        )}
        {reviewCount > 0 && (
          <button
            onClick={() => setActiveTab(activeTab === 'review' ? 'all' : 'review')}
            className={`bg-white rounded-2xl border shadow-sm p-6 text-left transition-all ${
              activeTab === 'review' ? 'border-amber-300 ring-2 ring-amber-100' : 'border-zinc-100 hover:border-amber-200'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-sm font-bold text-amber-600 uppercase tracking-wider">Needs Review</p>
            </div>
            <p className="text-4xl font-bold text-zinc-900">{reviewCount}</p>
            <p className="text-sm text-zinc-400 mt-1">Documents</p>
          </button>
        )}
        {approveCount > 0 && (
          <button
            onClick={() => setActiveTab(activeTab === 'approve' ? 'all' : 'approve')}
            className={`bg-white rounded-2xl border shadow-sm p-6 text-left transition-all ${
              activeTab === 'approve' ? 'border-blue-300 ring-2 ring-blue-100' : 'border-zinc-100 hover:border-blue-200'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-sm font-bold text-blue-600 uppercase tracking-wider">Needs Approval</p>
            </div>
            <p className="text-4xl font-bold text-zinc-900">{approveCount}</p>
            <p className="text-sm text-zinc-400 mt-1">Documents</p>
          </button>
        )}
        <button
          onClick={() => setActiveTab('all')}
          className={`bg-white rounded-2xl border shadow-sm p-6 text-left transition-all ${
            activeTab === 'all' ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-zinc-100 hover:border-indigo-200'
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <Layers className="w-5 h-5 text-indigo-500" />
            </div>
            <p className="text-sm font-bold text-indigo-600 uppercase tracking-wider">Total Pending</p>
          </div>
          <p className="text-4xl font-bold text-zinc-900">{pendingItems.length}</p>
          <p className="text-sm text-zinc-400 mt-1">Items</p>
        </button>
      </div>

      {/* Task List grouped by area */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-zinc-100 border-dashed">
            <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
            <p className="text-lg font-bold text-zinc-400">All caught up!</p>
            <p className="text-sm text-zinc-400 mt-1">
              {activeTab === 'all'
                ? 'No pending tasks at this time.'
                : `No pending ${activeTab} tasks.`}
            </p>
          </div>
        ) : (
          groupedByArea.map(({ area, items }) => {
            const areaKey = area.documentId || String(area.id);
            const isExpanded = expandedArea === null || expandedArea === areaKey;
            return (
              <div key={areaKey} className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedArea(expandedArea === areaKey ? null : areaKey)}
                  className="w-full flex items-center justify-between p-5 hover:bg-zinc-50/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                      <Layers className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 uppercase">{area.area}</h3>
                      <p className="text-xs text-zinc-400">{items.length} pending item{items.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {items.filter(i => i.type === 'upload').length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-100">
                        {items.filter(i => i.type === 'upload').length} upload
                      </span>
                    )}
                    {items.filter(i => i.type === 'review').length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                        {items.filter(i => i.type === 'review').length} review
                      </span>
                    )}
                    {items.filter(i => i.type === 'approve').length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                        {items.filter(i => i.type === 'approve').length} approve
                      </span>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-zinc-100 divide-y divide-zinc-50">
                    {items.map((item, idx) => {
                      if (item.type === 'upload') {
                        // Upload task row
                        return (
                          <div key={`upload-${item.criteria.id}-${item.subcriteriaId || 'main'}-${idx}`} className="p-5 hover:bg-zinc-50/30 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <Upload className="w-4 h-4 text-violet-500 shrink-0" />
                                  <p className="text-sm font-bold text-zinc-900">
                                    {item.isSubcriteria
                                      ? `${item.criteria.code} > ${item.subcriteriaCode}`
                                      : item.criteria.code}
                                    {' '}<span className="font-normal text-zinc-500">needs file upload</span>
                                  </p>
                                </div>
                                <div className="flex items-center flex-wrap gap-2 mt-2 ml-6">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-50 text-zinc-500 border border-zinc-100">
                                    {item.isSubcriteria ? item.subcriteriaDesc : item.criteria.desc}
                                  </span>
                                  {item.criteria.academic_program?.programCode && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                                      <GraduationCap className="w-3 h-3" /> {item.criteria.academic_program.programCode}
                                    </span>
                                  )}
                                  {item.criteria.academic_year?.schoolyear && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-50 text-zinc-500 border border-zinc-100">
                                      <Calendar className="w-3 h-3" /> {item.criteria.academic_year.schoolyear}
                                    </span>
                                  )}
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-100 uppercase tracking-wider">
                                    {item.existingUploadCount > 0 ? `${item.existingUploadCount} file(s) uploaded, not yet approved` : 'No files uploaded'}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => navigate(`/dashboard/areas/${area.documentId || area.id}`)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-violet-500 hover:bg-violet-600 rounded-lg transition-all shrink-0"
                              >
                                <Upload className="w-3 h-3" />
                                Go to Upload
                              </button>
                            </div>
                          </div>
                        );
                      }

                      // Review / Approve task row
                      const reviewItem = item as PendingReviewItem;
                      const fileUrl = getFileUrl(reviewItem.upload);
                      const isUpdating = updating === reviewItem.upload.id;

                      return (
                        <div key={`${reviewItem.upload.id}-${idx}`} className="p-5 hover:bg-zinc-50/30 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              {/* File name */}
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-zinc-400 shrink-0" />
                                {fileUrl ? (
                                  <button
                                    onClick={() => setViewingPdf({ url: fileUrl, fileName: reviewItem.upload.fileName })}
                                    className="text-sm font-bold text-indigo-600 hover:text-indigo-800 truncate transition-colors text-left"
                                  >
                                    {reviewItem.upload.fileName}
                                  </button>
                                ) : (
                                  <p className="text-sm font-bold text-zinc-900 truncate">{reviewItem.upload.fileName}</p>
                                )}
                              </div>

                              {/* Meta info */}
                              <div className="flex items-center flex-wrap gap-2 mt-2 ml-6">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-50 text-zinc-500 border border-zinc-100">
                                  {reviewItem.criteria.code}{reviewItem.isSubcriteria ? ` > ${reviewItem.subcriteriaCode}` : ''}
                                </span>
                                {reviewItem.criteria.academic_program?.programCode && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                                    <GraduationCap className="w-3 h-3" /> {reviewItem.criteria.academic_program.programCode}
                                  </span>
                                )}
                                {reviewItem.criteria.academic_year?.schoolyear && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-50 text-zinc-500 border border-zinc-100">
                                    <Calendar className="w-3 h-3" /> {reviewItem.criteria.academic_year.schoolyear}
                                  </span>
                                )}
                                {reviewItem.upload.uploader && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-50 text-zinc-500 border border-zinc-100">
                                    <User className="w-3 h-3" /> {(reviewItem.upload.uploader as any).username || 'Unknown'}
                                  </span>
                                )}
                                {reviewItem.type === 'review' && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-wider">
                                    Needs Review
                                  </span>
                                )}
                                {reviewItem.type === 'approve' && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wider">
                                    Needs Approval
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                              {fileUrl && (
                                <button
                                  onClick={() => setViewingPdf({ url: fileUrl, fileName: reviewItem.upload.fileName })}
                                  className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                  title="View PDF"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              )}
                              {userCanReview && reviewItem.type === 'review' && (
                                <button
                                  onClick={() => handleUpdateStatus(reviewItem, 'Reviewed')}
                                  disabled={isUpdating}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-all disabled:opacity-50"
                                >
                                  {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                                  Review
                                </button>
                              )}
                              {userCanApprove && reviewItem.type === 'approve' && (
                                <button
                                  onClick={() => handleUpdateStatus(reviewItem, 'Approved')}
                                  disabled={isUpdating}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-all disabled:opacity-50"
                                >
                                  {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                  Approve
                                </button>
                              )}
                              <button
                                onClick={() => navigate(`/dashboard/areas/${area.documentId || area.id}`)}
                                className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-all"
                                title="Go to area"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
