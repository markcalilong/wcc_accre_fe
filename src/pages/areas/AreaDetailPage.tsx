import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, RefreshCw, Layers, FileText } from 'lucide-react';
import { api } from '../../services/api';
import { Area, AreaCriteria, FileUploadMetadata } from '../../types/area';
import CriteriaCard from '../../components/areas/CriteriaCard';
import { getUserPersonelRole, canUploadToCriteria, hasManagementAccess, isDeanRole, isViewer } from '../../utils/roles';

export default function AreaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [area, setArea] = useState<Area | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [userData, setUserData] = useState<any>(null);

  // Filter dropdown data
  const [programs, setPrograms] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [visitTypes, setVisitTypes] = useState<any[]>([]);
  const [campuses, setCampuses] = useState<any[]>([]);

  // Filter selections
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedVisit, setSelectedVisit] = useState<string>('');
  const [selectedCampus, setSelectedCampus] = useState<string>('');

  const fetchArea = useCallback(async () => {
    if (!id) return;
    const token = localStorage.getItem('jwt');
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const data = await api.getAreaById(token, id);
      setArea(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch area details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchArea();
    const token = localStorage.getItem('jwt');
    if (token) {
      api.getMe(token).then(user => {
        setUserRole(getUserPersonelRole(user));
        setUserData(user);
      }).catch(() => {});

      // Fetch filter dropdown data
      Promise.all([
        api.getAcademicPrograms().catch(() => []),
        api.getAcademicYears(token).catch(() => []),
        api.getSemesters(token).catch(() => []),
        api.getVisitTypes(token).catch(() => []),
        api.getCampuses(token).catch(() => []),
      ]).then(([programsResult, yearsResult, semestersResult, visitTypesResult, campusesResult]) => {
        setPrograms(programsResult);
        setYears(yearsResult);
        setSemesters(semestersResult);
        setVisitTypes(visitTypesResult);
        setCampuses(campusesResult);
      });
    }
  }, [fetchArea]);

  const isAdmin = hasManagementAccess(userRole);
  const isDean = isDeanRole(userRole);
  const isViewerRole = isViewer(userRole);
  const showProgramFilter = isAdmin || isDean || isViewerRole;
  const showCampusFilter = isAdmin || isViewerRole;

  // Auto-set program and campus filters based on user profile (non-admin/non-viewer only)
  useEffect(() => {
    if (!userData || !userRole) return;
    if (hasManagementAccess(userRole) || isViewer(userRole)) return;

    // Auto-set program
    const userProg = typeof userData.academic_program === 'string'
      ? userData.academic_program
      : userData.academic_program?.programCode;
    if (userProg && programs.length > 0 && !selectedProgram) {
      const match = programs.find((p: any) =>
        (p.programCode || '').toLowerCase() === userProg.toLowerCase()
      );
      if (match) setSelectedProgram(String(match.id));
    }

    // Auto-set campus
    const userCampuses = userData.campuses || [];
    if (userCampuses.length > 0 && campuses.length > 0 && !selectedCampus) {
      setSelectedCampus(String(userCampuses[0].id));
    }
  }, [userData, userRole, programs, campuses, selectedProgram, selectedCampus]);

  // Filter uploads based on selected filter values
  const filterUploads = useCallback((uploads: any[]) => {
    if (!uploads) return [];
    return uploads.filter((u: any) => {
      if (selectedCampus && String(u.campus?.id || u.campus) !== selectedCampus) return false;
      if (selectedProgram && String(u.academic_program?.id || u.academic_program) !== selectedProgram) return false;
      if (selectedYear && String(u.academic_year?.id || u.academic_year) !== selectedYear) return false;
      if (selectedSemester && String(u.semester?.id || u.semester) !== selectedSemester) return false;
      if (selectedVisit && String(u.visit?.id || u.visit) !== selectedVisit) return false;
      return true;
    });
  }, [selectedCampus, selectedProgram, selectedYear, selectedSemester, selectedVisit]);

  // Build filtered criteria with only matching uploads
  const getFilteredCriteria = useCallback((criteria: any) => ({
    ...criteria,
    criteriaUploads: filterUploads(criteria.criteriaUploads || []),
    subcriteria: (criteria.subcriteria || []).map((sub: any) => ({
      ...sub,
      subCriteriaUploads: filterUploads(sub.subCriteriaUploads || [])
    }))
  }), [filterUploads]);

  const cleanCriteriaForUpdate = (criteria: any[]) => {
    return criteria.map(c => ({
      ...(typeof c.id === 'number' ? { id: c.id } : {}),
      code: c.code,
      desc: c.desc,
      criteriaUploads: c.criteriaUploads?.map((u: any) => {
        const fileData = Array.isArray(u.fileUpload) ? u.fileUpload[0] : u.fileUpload;
        const uploaderData = Array.isArray(u.uploader) ? u.uploader[0] : u.uploader;
        const approverData = Array.isArray(u.approver) ? u.approver[0] : u.approver;
        return {
          ...(typeof u.id === 'number' ? { id: u.id } : {}),
          fileName: u.fileName,
          fileStatus: u.fileStatus,
          remarks: u.remarks,
          fileUpload: fileData?.id || fileData?.data?.id || (Array.isArray(fileData?.data) ? fileData?.data[0]?.id : undefined) || fileData,
          uploader: uploaderData?.id || uploaderData?.data?.id || (Array.isArray(uploaderData?.data) ? uploaderData?.data[0]?.id : undefined) || uploaderData,
          approver: approverData?.id || approverData?.data?.id || (Array.isArray(approverData?.data) ? approverData?.data[0]?.id : undefined) || approverData,
          campus: u.campus?.id || u.campus || null,
          academic_program: u.academic_program?.id || u.academic_program || null,
          academic_year: u.academic_year?.id || u.academic_year || null,
          semester: u.semester?.id || u.semester || null,
          visit: u.visit?.id || u.visit || null,
        };
      }) || [],
      subcriteria: c.subcriteria?.map((s: any) => ({
        ...(typeof s.id === 'number' ? { id: s.id } : {}),
        code: s.code,
        desc: s.desc,
        subCriteriaUploads: s.subCriteriaUploads?.map((u: any) => {
          const fileData = Array.isArray(u.fileUpload) ? u.fileUpload[0] : u.fileUpload;
          const uploaderData = Array.isArray(u.uploader) ? u.uploader[0] : u.uploader;
          const approverData = Array.isArray(u.approver) ? u.approver[0] : u.approver;
          return {
            ...(typeof u.id === 'number' ? { id: u.id } : {}),
            fileName: u.fileName,
            fileStatus: u.fileStatus,
            remarks: u.remarks,
            fileUpload: fileData?.id || fileData?.data?.id || (Array.isArray(fileData?.data) ? fileData?.data[0]?.id : undefined) || fileData,
            uploader: uploaderData?.id || uploaderData?.data?.id || (Array.isArray(uploaderData?.data) ? uploaderData?.data[0]?.id : undefined) || uploaderData,
            approver: approverData?.id || approverData?.data?.id || (Array.isArray(approverData?.data) ? approverData?.data[0]?.id : undefined) || approverData,
            campus: u.campus?.id || u.campus || null,
            academic_program: u.academic_program?.id || u.academic_program || null,
            academic_year: u.academic_year?.id || u.academic_year || null,
            semester: u.semester?.id || u.semester || null,
            visit: u.visit?.id || u.visit || null,
          };
        }) || []
      })) || []
    }));
  };

  // Check if all required filters are set for uploading
  const canUploadNow = Boolean(selectedCampus && selectedProgram && selectedYear && selectedSemester);
  const missingFilters = [
    !selectedYear && 'Academic Year',
    !selectedSemester && 'Semester',
    ...(showCampusFilter ? [!selectedCampus && 'Campus'] : []),
    ...(showProgramFilter ? [!selectedProgram && 'Academic Program'] : []),
  ].filter(Boolean);

  const handleUploadSuccess = async (criteriaId: number, subcriteriaId: number | null, newUpload: any) => {
    if (!area || !id) return;
    const token = localStorage.getItem('jwt');
    if (!token) return;

    if (!canUploadNow) {
      alert('Please select ' + missingFilters.join(', ') + ' before uploading.');
      return;
    }

    // Auto-tag upload with currently selected filter values
    const scopedUpload = {
      ...newUpload,
      campus: selectedCampus ? Number(selectedCampus) : null,
      academic_program: selectedProgram ? Number(selectedProgram) : null,
      academic_year: selectedYear ? Number(selectedYear) : null,
      semester: selectedSemester ? Number(selectedSemester) : null,
      visit: selectedVisit ? Number(selectedVisit) : null,
    };

    try {
      const currentArea = await api.getAreaById(token, id);

      const updatedCriteria = currentArea.areaCriteria.map((c: any) => {
        if (c.id === criteriaId) {
          if (subcriteriaId === null) {
            return { ...c, criteriaUploads: [...(c.criteriaUploads || []), scopedUpload] };
          } else {
            return {
              ...c,
              subcriteria: c.subcriteria.map((s: any) => {
                if (s.id === subcriteriaId) {
                  return { ...s, subCriteriaUploads: [...(s.subCriteriaUploads || []), scopedUpload] };
                }
                return s;
              })
            };
          }
        }
        return c;
      });

      await api.updateArea(token, id, {
        areaCriteria: cleanCriteriaForUpdate(updatedCriteria)
      });

      fetchArea();
    } catch (err: any) {
      alert(err.message || 'Failed to update area with new upload');
    }
  };

  const handleDeleteUpload = async (criteriaId: number, subcriteriaId: number | null, uploadId: number) => {
    if (!area || !id || !window.confirm('Are you sure you want to delete this file?')) return;
    const token = localStorage.getItem('jwt');
    if (!token) return;

    try {
      const updatedCriteria = area.areaCriteria.map((c: any) => {
        if (c.id === criteriaId) {
          if (subcriteriaId === null) {
            return { ...c, criteriaUploads: c.criteriaUploads.filter((u: any) => u.id !== uploadId) };
          } else {
            return {
              ...c,
              subcriteria: c.subcriteria.map((s: any) => {
                if (s.id === subcriteriaId) {
                  return { ...s, subCriteriaUploads: s.subCriteriaUploads.filter((u: any) => u.id !== uploadId) };
                }
                return s;
              })
            };
          }
        }
        return c;
      });

      await api.updateArea(token, id, {
        areaCriteria: cleanCriteriaForUpdate(updatedCriteria)
      });

      fetchArea();
    } catch (err: any) {
      alert(err.message || 'Failed to delete upload');
    }
  };

  const handleUpdateUploadStatus = async (criteriaId: number, subcriteriaId: number | null, uploadId: number, status: string, remarks: string) => {
    if (!area || !id) return;
    const token = localStorage.getItem('jwt');
    if (!token) return;

    try {
      const updatedCriteria = area.areaCriteria.map((c: any) => {
        if (c.id === criteriaId) {
          if (subcriteriaId === null) {
            return {
              ...c,
              criteriaUploads: c.criteriaUploads.map((u: any) => {
                if (u.id === uploadId) {
                  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                  const approverUpdate = status === 'Approved' ? { approver: currentUser.id } : {};
                  return { ...u, fileStatus: status, remarks, ...approverUpdate };
                }
                return u;
              })
            };
          } else {
            return {
              ...c,
              subcriteria: c.subcriteria.map((s: any) => {
                if (s.id === subcriteriaId) {
                  return {
                    ...s,
                    subCriteriaUploads: s.subCriteriaUploads.map((u: any) => {
                      if (u.id === uploadId) {
                        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                        const approverUpdate = status === 'Approved' ? { approver: currentUser.id } : {};
                        return { ...u, fileStatus: status, remarks, ...approverUpdate };
                      }
                      return u;
                    })
                  };
                }
                return s;
              })
            };
          }
        }
        return c;
      });

      await api.updateArea(token, id, {
        areaCriteria: cleanCriteriaForUpdate(updatedCriteria)
      });

      fetchArea();
    } catch (err: any) {
      alert(err.message || 'Failed to update upload status');
    }
  };

  if (loading && !area) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-zinc-500 font-medium">Loading area details...</p>
      </div>
    );
  }

  if (error || !area) {
    return (
      <div className="p-8 rounded-3xl bg-rose-50 border border-rose-100 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-rose-900">Failed to load area</h3>
          <p className="text-rose-600/80">{error || 'Area not found'}</p>
        </div>
        <button
          onClick={() => navigate(isAdmin ? '/dashboard/areas' : '/dashboard/area-monitoring')}
          className="px-6 py-2 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all"
        >
          Back to Areas
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between gap-6">
        <button
          onClick={() => navigate(isAdmin ? '/dashboard/areas' : '/dashboard/area-monitoring')}
          className="flex items-center gap-2 px-4 py-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to List
        </button>
        <button
          onClick={fetchArea}
          className="p-3 bg-white border border-zinc-100 text-zinc-400 hover:text-indigo-600 rounded-xl hover:bg-zinc-50 transition-all shadow-sm"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <Layers className="w-6 h-6 text-indigo-600" />
              </div>
              <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">{area.area}</h1>
            </div>
            <p className="text-zinc-500 text-lg leading-relaxed">{area.areaDesc}</p>

            {(area.proposedExhibits || area.remarks) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-50">
                {area.proposedExhibits && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Proposed Exhibits</p>
                    <p className="text-sm text-zinc-600 bg-zinc-50/50 p-3 rounded-xl border border-zinc-100">{area.proposedExhibits}</p>
                  </div>
                )}
                {area.remarks && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">General Remarks</p>
                    <p className="text-sm text-zinc-600 bg-zinc-50/50 p-3 rounded-xl border border-zinc-100">{area.remarks}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-100">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Criteria Count</p>
            <p className="text-2xl font-bold text-zinc-900 mt-1">{area.areaCriteria.length}</p>
          </div>
        </div>
      </div>

      {/* User context info (non-admin, non-viewer) */}
      {!isAdmin && !isViewerRole && userData && (
        <div className="flex flex-wrap items-center gap-3">
          {userData.academic_program && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-700 uppercase tracking-wider">
              {userData.academic_program.programCode || userData.academic_program}
            </span>
          )}
          {userData.campuses?.[0] && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-100 text-xs font-bold text-violet-700 uppercase tracking-wider">
              {userData.campuses[0].campusDesc || userData.campuses[0].campusName || 'Campus'}
            </span>
          )}
        </div>
      )}

      {/* Upload Filters */}
      <div className={`flex flex-col sm:flex-row gap-4`}>
        {showCampusFilter && (
          <div className="flex-1">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Campus</label>
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none appearance-none"
            >
              <option value="">All Campuses</option>
              {campuses.map((c: any) => (
                <option key={c.id} value={String(c.id)}>
                  {c.campusDesc || c.attributes?.campusDesc}
                </option>
              ))}
            </select>
          </div>
        )}
        {showProgramFilter && (
          <div className="flex-1">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Academic Program</label>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none appearance-none"
            >
              <option value="">All Programs</option>
              {programs.map((p: any) => (
                <option key={p.id} value={String(p.id)}>
                  {p.programCode || p.attributes?.programCode}{p.programDesc ? ` - ${p.programDesc}` : p.attributes?.programDesc ? ` - ${p.attributes.programDesc}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex-1">
          <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Academic Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none appearance-none"
          >
            <option value="">All Years</option>
            {years.map((y: any) => (
              <option key={y.id} value={String(y.id)}>
                {y.schoolyear || y.attributes?.schoolyear}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Semester</label>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none appearance-none"
          >
            <option value="">All Semesters</option>
            {semesters.map((s: any) => (
              <option key={s.id} value={String(s.id)}>
                {s.semCode}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Visit Type</label>
          <select
            value={selectedVisit}
            onChange={(e) => setSelectedVisit(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none appearance-none"
          >
            <option value="">All Visit Types</option>
            {visitTypes.map((v: any) => (
              <option key={v.id} value={String(v.id)}>
                {v.visitType || v.attributes?.visitType}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!isViewerRole && !canUploadNow && missingFilters.length > 0 && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-amber-50 border border-amber-100">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700">
            <span className="font-bold">Select {missingFilters.join(', ')}</span> to enable uploading. Uploads are tagged with your current filter selections.
          </p>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Area Criteria
          </h2>
          <span className="px-3 py-1 rounded-full bg-zinc-100 text-zinc-500 text-xs font-bold uppercase tracking-widest">
            {area.areaCriteria.length} Criteria
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {area.areaCriteria.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-zinc-100 border-dashed">
              <p className="text-zinc-400 italic">No criteria defined for this area.</p>
            </div>
          ) : (
            area.areaCriteria.map((criteria) => (
              <CriteriaCard
                key={criteria.id}
                criteria={getFilteredCriteria(criteria)}
                onUploadSuccess={handleUploadSuccess}
                onDeleteUpload={handleDeleteUpload}
                onUpdateUploadStatus={handleUpdateUploadStatus}
                userRole={userRole}
                canUpload={canUploadNow && (userData ? canUploadToCriteria(userData, area.area, criteria.code) : true)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
