import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, RefreshCw, Layers, Calendar, GraduationCap, FileText } from 'lucide-react';
import { api } from '../../services/api';
import { Area, AreaCriteria, FileUploadMetadata } from '../../types/area';
import CriteriaCard from '../../components/areas/CriteriaCard';
import { getUserPersonelRole, canUploadToCriteria, hasManagementAccess } from '../../utils/roles';

export default function AreaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [area, setArea] = useState<Area | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [userData, setUserData] = useState<any>(null);

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
    // Fetch user role
    const token = localStorage.getItem('jwt');
    if (token) {
      api.getMe(token).then(user => {
        setUserRole(getUserPersonelRole(user));
        setUserData(user);
      }).catch(() => {});
    }
  }, [fetchArea]);

  const cleanCriteriaForUpdate = (criteria: any[]) => {
    return criteria.map(c => ({
      ...(typeof c.id === 'number' ? { id: c.id } : {}),
      code: c.code,
      desc: c.desc,
      academic_program: c.academic_program?.id || c.academic_program || null,
      academic_year: c.academic_year?.id || c.academic_year || null,
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
          };
        }) || []
      })) || []
    }));
  };

  const handleUploadSuccess = async (criteriaId: number, subcriteriaId: number | null, newUpload: any) => {
    if (!area || !id) return;
    const token = localStorage.getItem('jwt');
    if (!token) return;

    try {
      // 1. Get current area data
      const currentArea = await api.getAreaById(token, id);
      
      // 2. Update the specific criteria or subcriteria's uploads
      const updatedCriteria = currentArea.areaCriteria.map((c: any) => {
        if (c.id === criteriaId) {
          if (subcriteriaId === null) {
            // Add to criteria uploads
            return {
              ...c,
              criteriaUploads: [...(c.criteriaUploads || []), newUpload]
            };
          } else {
            // Add to subcriteria uploads
            return {
              ...c,
              subcriteria: c.subcriteria.map((s: any) => {
                if (s.id === subcriteriaId) {
                  return {
                    ...s,
                    subCriteriaUploads: [...(s.subCriteriaUploads || []), newUpload]
                  };
                }
                return s;
              })
            };
          }
        }
        return c;
      });

      // 3. Update the area in Strapi
      await api.updateArea(token, id, {
        areaCriteria: cleanCriteriaForUpdate(updatedCriteria)
      });

      // 4. Refetch to get the full populated data (including uploader info)
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
            return {
              ...c,
              criteriaUploads: c.criteriaUploads.filter((u: any) => u.id !== uploadId)
            };
          } else {
            return {
              ...c,
              subcriteria: c.subcriteria.map((s: any) => {
                if (s.id === subcriteriaId) {
                  return {
                    ...s,
                    subCriteriaUploads: s.subCriteriaUploads.filter((u: any) => u.id !== uploadId)
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
          onClick={() => navigate('/dashboard/areas')}
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
          onClick={() => navigate('/dashboard/areas')}
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

      <div className="space-y-6">
        {(() => {
          // Filter criteria by user's program access
          const isAdmin = hasManagementAccess(userRole);

          // Collect all program codes the user has access to:
          // 1. From user's own academic_program field (plain string like "BSIT")
          // 2. From role's coveredPrograms (for Deans managing multiple programs)
          const userProgramCodes: string[] = [];

          // academic_program on user can be a string or a relation object
          const userOwnProgram = typeof userData?.academic_program === 'string'
            ? userData.academic_program
            : userData?.academic_program?.programCode;
          if (userOwnProgram && userOwnProgram.trim()) {
            userProgramCodes.push(userOwnProgram.toLowerCase().trim());
          }

          const roleCoveredPrograms = userData?.personel_role?.coveredPrograms || [];
          for (const cp of roleCoveredPrograms) {
            const code = cp.academic_program?.programCode;
            if (code && !userProgramCodes.includes(code.toLowerCase().trim())) {
              userProgramCodes.push(code.toLowerCase().trim());
            }
          }

          const filteredCriteria = isAdmin || userProgramCodes.length === 0
            ? area.areaCriteria
            : area.areaCriteria.filter(c => {
                // If criteria has no program assigned, show it to everyone
                if (!c.academic_program?.programCode) return true;
                return userProgramCodes.includes(c.academic_program.programCode.toLowerCase().trim());
              });

          return (
            <>
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Area Criteria
                </h2>
                <span className="px-3 py-1 rounded-full bg-zinc-100 text-zinc-500 text-xs font-bold uppercase tracking-widest">
                  {filteredCriteria.length} Criteria
                </span>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {filteredCriteria.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-zinc-100 border-dashed">
                    <p className="text-zinc-400 italic">No criteria available for your program.</p>
                  </div>
                ) : (
                  filteredCriteria.map((criteria) => (
                    <CriteriaCard
                      key={criteria.id}
                      criteria={criteria}
                      onUploadSuccess={handleUploadSuccess}
                      onDeleteUpload={handleDeleteUpload}
                      onUpdateUploadStatus={handleUpdateUploadStatus}
                      userRole={userRole}
                      canUpload={userData ? canUploadToCriteria(userData, area.area, criteria.code, criteria.academic_program?.programCode) : true}
                    />
                  ))
                )}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
