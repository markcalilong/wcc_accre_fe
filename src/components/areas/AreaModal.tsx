import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { Area } from '../../types/area';
import FileUploadComponent from './FileUploadComponent';

interface AreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  area?: Area | null;
}

export default function AreaModal({ isOpen, onClose, onSuccess, area }: AreaModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [campuses, setCampuses] = useState<any[]>([]);
  const [visitTypes, setVisitTypes] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    area: '',
    areaDesc: '',
    proposedExhibits: '',
    remarks: '',
    campus: '' as string,
    visit: '' as string,
    academic_program: '' as string,
    academic_year: '' as string,
    semester: '' as string,
    areaCriteria: [] as any[]
  });

  useEffect(() => {
    if (isOpen) {
      fetchOptions();
      if (area) {
        setFormData({
          area: area.area || '',
          areaDesc: area.areaDesc || '',
          proposedExhibits: area.proposedExhibits || '',
          remarks: area.remarks || '',
          campus: area.campus?.id?.toString() || '',
          visit: area.visit?.id?.toString() || '',
          academic_program: area.academic_program?.id?.toString() || '',
          academic_year: area.academic_year?.id?.toString() || '',
          semester: area.semester?.id?.toString() || '',
          areaCriteria: area.areaCriteria?.map(c => ({ ...c })) || []
        });
      } else {
        setFormData({
          area: '',
          areaDesc: '',
          proposedExhibits: '',
          remarks: '',
          campus: '',
          visit: '',
          academic_program: '',
          academic_year: '',
          semester: '',
          areaCriteria: []
        });
      }
    }
  }, [isOpen, area]);

  const fetchOptions = async () => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    try {
      const [programsData, yearsData, campusesData, visitTypesData, semestersData] = await Promise.all([
        api.getAcademicPrograms(token),
        api.getAcademicYears(token),
        api.getCampuses(token).catch(() => []),
        api.getVisitTypes(token).catch(() => []),
        api.getSemesters(token).catch(() => [])
      ]);
      setPrograms(programsData);
      setYears(yearsData);
      setCampuses(campusesData);
      setVisitTypes(visitTypesData);
      setSemesters(semestersData);
    } catch (err: any) {
      console.error('Failed to fetch options:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('jwt');
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      // Helper to clean up relations in components for Strapi submission
      const cleanUploads = (uploads: any[]) => uploads.map(u => {
        const fileData = Array.isArray(u.fileUpload) ? u.fileUpload[0] : u.fileUpload;
        const uploaderData = Array.isArray(u.uploader) ? u.uploader[0] : u.uploader;
        const approverData = Array.isArray(u.approver) ? u.approver[0] : u.approver;

        const { documentId: _uDocId, id: uId, ...restU } = u;
        return {
          ...restU,
          ...(typeof uId === 'number' ? { id: uId } : {}),
          fileUpload: fileData?.id || fileData?.data?.id || (Array.isArray(fileData?.data) ? fileData?.data[0]?.id : undefined) || fileData,
          uploader: uploaderData?.id || uploaderData?.data?.id || (Array.isArray(uploaderData?.data) ? uploaderData?.data[0]?.id : undefined) || uploaderData,
          approver: approverData?.id || approverData?.data?.id || (Array.isArray(approverData?.data) ? approverData?.data[0]?.id : undefined) || approverData,
        };
      });

      const payload = {
        area: formData.area,
        areaDesc: formData.areaDesc,
        proposedExhibits: formData.proposedExhibits,
        remarks: formData.remarks,
        campus: formData.campus ? Number(formData.campus) : null,
        visit: formData.visit ? Number(formData.visit) : null,
        academic_program: formData.academic_program ? Number(formData.academic_program) : null,
        academic_year: formData.academic_year ? Number(formData.academic_year) : null,
        semester: formData.semester ? Number(formData.semester) : null,
        areaCriteria: formData.areaCriteria.map(c => {
          const { documentId: _cDocId, id: cId, ...restC } = c;
          return {
            ...restC,
            ...(typeof cId === 'number' ? { id: cId } : {}),
            criteriaUploads: cleanUploads(c.criteriaUploads || []),
            subcriteria: (c.subcriteria || []).map((sc: any) => {
              const { documentId: _scDocId, id: scId, ...restSc } = sc;
              return {
                ...restSc,
                ...(typeof scId === 'number' ? { id: scId } : {}),
                subCriteriaUploads: cleanUploads(sc.subCriteriaUploads || [])
              };
            })
          };
        })
      };

      console.log('Submitting Area Payload:', payload);

      if (area) {
        // Detect criteria code changes for sync
        const oldCriteria = area.areaCriteria || [];
        const newCriteria = formData.areaCriteria || [];
        const oldToNewMap: Record<string, string | null> = {};
        let hasCodeChanges = false;

        for (const oldC of oldCriteria) {
          const matchingNew = newCriteria.find((nc: any) => nc.id === oldC.id);
          if (!matchingNew) {
            if (oldC.code) {
              oldToNewMap[oldC.code] = null;
              hasCodeChanges = true;
            }
          } else if (matchingNew.code !== oldC.code && oldC.code) {
            oldToNewMap[oldC.code] = matchingNew.code;
            hasCodeChanges = true;
          }
        }

        await api.updateArea(token, area.documentId || area.id, payload);

        if (hasCodeChanges) {
          try {
            await api.syncAllowedCriteria(token, area.area, oldToNewMap);
          } catch (syncErr) {
            console.warn('Failed to sync allowedCriteria in roles:', syncErr);
          }
        }
      } else {
        await api.createArea(token, payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to save area:', err);
      setError(err.message || 'Failed to save area');
    } finally {
      setLoading(false);
    }
  };

  const addCriteria = () => {
    setFormData({
      ...formData,
      areaCriteria: [
        ...formData.areaCriteria,
        { code: '', desc: '', subcriteria: [] }
      ]
    });
  };

  const removeCriteria = (index: number) => {
    const newCriteria = [...formData.areaCriteria];
    newCriteria.splice(index, 1);
    setFormData({ ...formData, areaCriteria: newCriteria });
  };

  const updateCriteria = (index: number, field: string, value: string) => {
    const newCriteria = [...formData.areaCriteria];
    newCriteria[index] = { ...newCriteria[index], [field]: value };
    setFormData({ ...formData, areaCriteria: newCriteria });
  };

  const addSubCriteria = (criteriaIndex: number) => {
    const newCriteria = [...formData.areaCriteria];
    const subcriteria = newCriteria[criteriaIndex].subcriteria || [];
    newCriteria[criteriaIndex] = {
      ...newCriteria[criteriaIndex],
      subcriteria: [...subcriteria, { code: '', desc: '' }]
    };
    setFormData({ ...formData, areaCriteria: newCriteria });
  };

  const removeSubCriteria = (criteriaIndex: number, subIndex: number) => {
    const newCriteria = [...formData.areaCriteria];
    const subcriteria = [...newCriteria[criteriaIndex].subcriteria];
    subcriteria.splice(subIndex, 1);
    newCriteria[criteriaIndex] = {
      ...newCriteria[criteriaIndex],
      subcriteria
    };
    setFormData({ ...formData, areaCriteria: newCriteria });
  };

  const updateSubCriteria = (criteriaIndex: number, subIndex: number, field: string, value: string) => {
    const newCriteria = [...formData.areaCriteria];
    const subcriteria = [...newCriteria[criteriaIndex].subcriteria];
    subcriteria[subIndex] = { ...subcriteria[subIndex], [field]: value };
    newCriteria[criteriaIndex] = {
      ...newCriteria[criteriaIndex],
      subcriteria
    };
    setFormData({ ...formData, areaCriteria: newCriteria });
  };

  // File Upload Handlers for Criteria
  const handleCriteriaUploadSuccess = (criteriaIndex: number, newUpload: any) => {
    const newCriteria = [...formData.areaCriteria];
    const uploads = newCriteria[criteriaIndex].criteriaUploads || [];
    newCriteria[criteriaIndex] = {
      ...newCriteria[criteriaIndex],
      criteriaUploads: [...uploads, newUpload]
    };
    setFormData({ ...formData, areaCriteria: newCriteria });
  };

  const handleCriteriaUploadDelete = (criteriaIndex: number, uploadId: number) => {
    const newCriteria = [...formData.areaCriteria];
    const uploads = newCriteria[criteriaIndex].criteriaUploads || [];
    newCriteria[criteriaIndex] = {
      ...newCriteria[criteriaIndex],
      criteriaUploads: uploads.filter((u: any) => u.id !== uploadId)
    };
    setFormData({ ...formData, areaCriteria: newCriteria });
  };

  const handleCriteriaUploadStatusUpdate = (criteriaIndex: number, uploadId: number, status: string, remarks: string) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const approverUpdate = status === 'Approved' ? { approver: { id: user.id, username: user.username } } : {};

    const newCriteria = [...formData.areaCriteria];
    const uploads = newCriteria[criteriaIndex].criteriaUploads || [];
    newCriteria[criteriaIndex] = {
      ...newCriteria[criteriaIndex],
      criteriaUploads: uploads.map((u: any) => u.id === uploadId ? { ...u, fileStatus: status, remarks, ...approverUpdate } : u)
    };
    setFormData({ ...formData, areaCriteria: newCriteria });
  };

  // File Upload Handlers for Sub-criteria
  const handleSubCriteriaUploadSuccess = (criteriaIndex: number, subIndex: number, newUpload: any) => {
    const newCriteria = [...formData.areaCriteria];
    const subcriteria = [...newCriteria[criteriaIndex].subcriteria];
    const uploads = subcriteria[subIndex].subCriteriaUploads || [];
    subcriteria[subIndex] = {
      ...subcriteria[subIndex],
      subCriteriaUploads: [...uploads, newUpload]
    };
    newCriteria[criteriaIndex] = { ...newCriteria[criteriaIndex], subcriteria };
    setFormData({ ...formData, areaCriteria: newCriteria });
  };

  const handleSubCriteriaUploadDelete = (criteriaIndex: number, subIndex: number, uploadId: number) => {
    const newCriteria = [...formData.areaCriteria];
    const subcriteria = [...newCriteria[criteriaIndex].subcriteria];
    const uploads = subcriteria[subIndex].subCriteriaUploads || [];
    subcriteria[subIndex] = {
      ...subcriteria[subIndex],
      subCriteriaUploads: uploads.filter((u: any) => u.id !== uploadId)
    };
    newCriteria[criteriaIndex] = { ...newCriteria[criteriaIndex], subcriteria };
    setFormData({ ...formData, areaCriteria: newCriteria });
  };

  const handleSubCriteriaUploadStatusUpdate = (criteriaIndex: number, subIndex: number, uploadId: number, status: string, remarks: string) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const approverUpdate = status === 'Approved' ? { approver: { id: user.id, username: user.username } } : {};

    const newCriteria = [...formData.areaCriteria];
    const subcriteria = [...newCriteria[criteriaIndex].subcriteria];
    const uploads = subcriteria[subIndex].subCriteriaUploads || [];
    subcriteria[subIndex] = {
      ...subcriteria[subIndex],
      subCriteriaUploads: uploads.map((u: any) => u.id === uploadId ? { ...u, fileStatus: status, remarks, ...approverUpdate } : u)
    };
    newCriteria[criteriaIndex] = { ...newCriteria[criteriaIndex], subcriteria };
    setFormData({ ...formData, areaCriteria: newCriteria });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">{area ? 'Edit Area' : 'Create New Area'}</h2>
            <p className="text-zinc-500 text-sm">Fill in the details for the accreditation area.</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl text-zinc-400 hover:text-zinc-900 transition-all shadow-sm">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Area Name</label>
                <input
                  required
                  type="text"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="e.g. Area I: Philosophy and Objectives"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={formData.areaDesc}
                  onChange={(e) => setFormData({ ...formData, areaDesc: e.target.value })}
                  className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                  placeholder="Describe the purpose of this area..."
                />
              </div>

              {/* Area-level scope: Campus, Visit Type, Program, Year, Semester */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Campus</label>
                  <select
                    value={formData.campus}
                    onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm appearance-none"
                  >
                    <option value="">No Campus</option>
                    {campuses.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.campusDesc}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Visit Type</label>
                  <select
                    value={formData.visit}
                    onChange={(e) => setFormData({ ...formData, visit: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm appearance-none"
                  >
                    <option value="">No Visit Type</option>
                    {visitTypes.map((v: any) => (
                      <option key={v.id} value={v.id}>{v.visitType}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Program</label>
                  <select
                    value={formData.academic_program}
                    onChange={(e) => setFormData({ ...formData, academic_program: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm appearance-none"
                  >
                    <option value="">No Program</option>
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.programCode || p.attributes?.programCode}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Academic Year</label>
                  <select
                    value={formData.academic_year}
                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm appearance-none"
                  >
                    <option value="">No Year</option>
                    {years.map(y => (
                      <option key={y.id} value={y.id}>{y.schoolyear || y.attributes?.schoolyear}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Semester</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm appearance-none"
                  >
                    <option value="">No Semester</option>
                    {semesters.map(s => (
                      <option key={s.id} value={s.id}>{s.semCode}</option>
                    ))}
                  </select>
                </div>
              </div>

            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Proposed Exhibits</label>
                <textarea
                  rows={3}
                  value={formData.proposedExhibits}
                  onChange={(e) => setFormData({ ...formData, proposedExhibits: e.target.value })}
                  className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                  placeholder="List proposed exhibits..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Remarks</label>
                <textarea
                  rows={3}
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                  placeholder="Any additional remarks..."
                />
              </div>
            </div>
          </div>

          <div className="space-y-6 pt-6 border-t border-zinc-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-900">Area Criteria</h3>
              <button
                type="button"
                onClick={addCriteria}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Criteria
              </button>
            </div>

            <div className="space-y-4">
              {formData.areaCriteria.map((c, idx) => (
                <div key={idx} className="p-6 rounded-[2rem] bg-zinc-50 border border-zinc-100 space-y-4 relative group">
                  <button
                    type="button"
                    onClick={() => removeCriteria(idx)}
                    className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-1 space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">Code</label>
                      <input
                        type="text"
                        value={c.code}
                        onChange={(e) => updateCriteria(idx, 'code', e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                        placeholder="e.g. I.1"
                      />
                    </div>
                    <div className="md:col-span-3 space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">Description</label>
                      <input
                        type="text"
                        value={c.desc}
                        onChange={(e) => updateCriteria(idx, 'desc', e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                        placeholder="Criteria description..."
                      />
                    </div>
                  </div>

                  {/* Criteria Uploads */}
                  <div className="mt-4 p-4 bg-white rounded-2xl border border-zinc-100">
                    <FileUploadComponent
                      uploads={c.criteriaUploads || []}
                      onUploadSuccess={(newUpload) => handleCriteriaUploadSuccess(idx, newUpload)}
                      onDelete={(uploadId) => handleCriteriaUploadDelete(idx, uploadId)}
                      onUpdateStatus={(uploadId, status, remarks) => handleCriteriaUploadStatusUpdate(idx, uploadId, status, remarks)}
                    />
                  </div>

                  {/* Sub-criteria section */}
                  <div className="mt-4 pl-6 border-l-2 border-indigo-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Sub-criteria</h4>
                      <button
                        type="button"
                        onClick={() => addSubCriteria(idx)}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add Sub-criteria
                      </button>
                    </div>

                    <div className="space-y-4">
                      {c.subcriteria?.map((sc: any, sIdx: number) => (
                        <div key={sIdx} className="p-4 bg-white rounded-2xl border border-zinc-100 space-y-3 group/sub relative">
                          <button
                            type="button"
                            onClick={() => removeSubCriteria(idx, sIdx)}
                            className="absolute top-2 right-2 p-1.5 text-zinc-300 hover:text-rose-500 opacity-0 group-hover/sub:opacity-100 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={sc.code}
                              onChange={(e) => updateSubCriteria(idx, sIdx, 'code', e.target.value)}
                              className="w-20 px-3 py-2 bg-zinc-50 border border-zinc-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-xs"
                              placeholder="Code"
                            />
                            <input
                              type="text"
                              value={sc.desc}
                              onChange={(e) => updateSubCriteria(idx, sIdx, 'desc', e.target.value)}
                              className="flex-1 px-3 py-2 bg-zinc-50 border border-zinc-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-xs"
                              placeholder="Sub-criteria description"
                            />
                          </div>

                          {/* Sub-criteria Uploads */}
                          <div className="pt-2 border-t border-zinc-50">
                            <FileUploadComponent
                              isSubcriteria
                              uploads={sc.subCriteriaUploads || []}
                              onUploadSuccess={(newUpload) => handleSubCriteriaUploadSuccess(idx, sIdx, newUpload)}
                              onDelete={(uploadId) => handleSubCriteriaUploadDelete(idx, sIdx, uploadId)}
                              onUpdateStatus={(uploadId, status, remarks) => handleSubCriteriaUploadStatusUpdate(idx, sIdx, uploadId, status, remarks)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {formData.areaCriteria.length === 0 && (
                <div className="text-center py-12 bg-zinc-50 rounded-[2rem] border border-zinc-100 border-dashed">
                  <p className="text-zinc-400 italic text-sm">No criteria added yet. Click "Add Criteria" to begin.</p>
                </div>
              )}
            </div>
          </div>
        </form>

        <div className="p-8 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-4 text-zinc-500 font-bold hover:text-zinc-900 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-10 py-4 bg-[#4a86f7] hover:bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              area ? 'Update Area' : 'Create Area'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
