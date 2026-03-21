import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Area, AreaCriteria, FileUploadMetadata } from '../types/area';
import { Loader2, AlertCircle, RefreshCw, FileCheck, Clock, CheckCircle2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { hasManagementAccess, getUserPersonelRole } from '../utils/roles';

function getUploadStatus(uploads: FileUploadMetadata[]): 'none' | 'uploaded' | 'reviewed' | 'approved' {
  if (!uploads || uploads.length === 0) return 'none';
  const allApproved = uploads.every(u => u.fileStatus === 'Approved');
  if (allApproved) return 'approved';
  const allReviewed = uploads.every(u => u.fileStatus === 'Reviewed' || u.fileStatus === 'Approved');
  if (allReviewed) return 'reviewed';
  return 'uploaded';
}

function StatusBadge({ status }: { status: 'none' | 'uploaded' | 'reviewed' | 'approved' }) {
  switch (status) {
    case 'approved':
      return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500 text-white uppercase tracking-wider">Approved</span>;
    case 'reviewed':
      return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-500 text-white uppercase tracking-wider">Reviewed</span>;
    case 'uploaded':
      return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-white uppercase tracking-wider">Uploaded</span>;
    default:
      return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-zinc-200 text-zinc-500 uppercase tracking-wider">No Files</span>;
  }
}

function AreaSection({ area, onNavigate }: { key?: any; area: Area; onNavigate: (id: string) => void }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-6 hover:bg-zinc-50/50 transition-colors">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 flex items-center justify-between text-left"
        >
          <div>
            <h3 className="text-lg font-bold text-zinc-900 uppercase tracking-tight">{area.area}</h3>
            {area.areaDesc && <p className="text-sm text-zinc-500 mt-1">{area.areaDesc}</p>}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-bold text-zinc-400 bg-zinc-50 px-2 py-0.5 rounded-full border border-zinc-100 uppercase tracking-wider">
                {area.areaCriteria.length} criteria
              </span>
            </div>
          </div>
          <div className="p-2 text-zinc-400">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>
        <button
          onClick={() => onNavigate(area.documentId || String(area.id))}
          className="ml-3 flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#4a86f7] hover:bg-blue-600 rounded-xl transition-all shrink-0"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View & Upload
        </button>
      </div>

      {expanded && (
        <div className="border-t border-zinc-100">
          {area.areaCriteria.length === 0 ? (
            <div className="p-6 text-center text-zinc-400 text-sm italic">No criteria defined.</div>
          ) : (
            <div className="divide-y divide-zinc-50">
              {area.areaCriteria.map((criteria) => (
                <CriteriaRow key={criteria.id} criteria={criteria} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CriteriaRow({ criteria }: { key?: any; criteria: AreaCriteria }) {
  const status = getUploadStatus(criteria.criteriaUploads);

  return (
    <div>
      {/* Main criteria row */}
      <div className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50/30 transition-colors">
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-sm text-zinc-900">
            <span className="font-bold">{criteria.code}.</span>{' '}
            {criteria.desc}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Sub-criteria rows */}
      {criteria.subcriteria.length > 0 && (
        <div className="bg-zinc-50/30">
          {criteria.subcriteria.map((sub) => {
            const subStatus = getUploadStatus(sub.subCriteriaUploads);
            return (
              <div key={sub.id} className="flex items-center justify-between px-6 py-3 pl-16 border-t border-zinc-50">
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-sm text-zinc-700">
                    <span className="font-bold">{sub.code}.</span>{' '}
                    {sub.desc}
                  </p>
                </div>
                <StatusBadge status={subStatus} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AreaMonitoring() {
  const navigate = useNavigate();
  const [areas, setAreas] = useState<Area[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [userData, setUserData] = useState<any>(null);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const [areasData, programsResult, yearsResult, userResult] = await Promise.all([
        api.getAreas(token),
        api.getAcademicPrograms().catch(() => []),
        api.getAcademicYears(token).catch(() => []),
        api.getMe(token).catch(() => null),
      ]);
      setAreas(areasData);
      setPrograms(programsResult);
      setYears(yearsResult);
      setUserData(userResult);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch areas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Determine user's role and permissions
  const personelRoleName = useMemo(() => {
    if (!userData) return '';
    return getUserPersonelRole(userData);
  }, [userData]);

  const isAdmin = useMemo(() => hasManagementAccess(personelRoleName), [personelRoleName]);

  const userCoveredAreas = useMemo(() => {
    return userData?.personel_role?.coveredAreas?.map(
      (a: any) => a.area_with_permission.toLowerCase().trim()
    ) || [];
  }, [userData]);

  // Collect all program codes the user has access to:
  // 1. User's own academic_program (plain string like "BSIT")
  // 2. Role's coveredPrograms (for Deans managing multiple programs)
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

  // Filter areas and their criteria based on selections + user's role/coveredAreas/academicProgram
  const filteredAreas = useMemo(() => {
    return areas
      .filter(area => {
        // Non-admin: filter by coveredAreas from personel_role
        if (!isAdmin && userCoveredAreas.length > 0) {
          const areaNameLower = area.area.toLowerCase().trim();
          if (!userCoveredAreas.includes(areaNameLower)) return false;
        }
        return true;
      })
      .map(area => {
        // Filter criteria within each area by academic program/year
        const filteredCriteria = area.areaCriteria.filter(criteria => {
          // Dropdown filters at criteria level
          if (selectedProgram && String(criteria.academic_program?.id) !== selectedProgram) return false;
          if (selectedYear && String(criteria.academic_year?.id) !== selectedYear) return false;

          // Non-admin: filter by user's program access
          if (!isAdmin && userProgramCodes.length > 0 && criteria.academic_program?.programCode) {
            if (!userProgramCodes.includes(criteria.academic_program.programCode.toLowerCase().trim())) return false;
          }

          return true;
        });

        return { ...area, areaCriteria: filteredCriteria };
      })
      // Remove areas with no matching criteria (unless no filters applied)
      .filter(area => {
        if (!selectedProgram && !selectedYear && (isAdmin || userProgramCodes.length === 0)) return true;
        return area.areaCriteria.length > 0;
      });
  }, [areas, selectedProgram, selectedYear, isAdmin, userCoveredAreas, userProgramCodes]);

  // Count uploads from filtered areas only
  const counts = useMemo(() => {
    let uploaded = 0;
    let reviewed = 0;
    let approved = 0;

    filteredAreas.forEach(area => {
      area.areaCriteria.forEach(criteria => {
        criteria.criteriaUploads?.forEach(u => {
          if (u.fileStatus === 'Approved') approved++;
          else if (u.fileStatus === 'Reviewed') reviewed++;
          else uploaded++;
        });
        criteria.subcriteria?.forEach(sub => {
          sub.subCriteriaUploads?.forEach(u => {
            if (u.fileStatus === 'Approved') approved++;
            else if (u.fileStatus === 'Reviewed') reviewed++;
            else uploaded++;
          });
        });
      });
    });

    return { uploaded, reviewed, approved };
  }, [filteredAreas]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-zinc-500 font-medium">Loading monitoring data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 rounded-3xl bg-rose-50 border border-rose-100 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-rose-900">Failed to load data</h3>
        <p className="text-rose-600/80">{error}</p>
        <button onClick={fetchData} className="px-6 py-2 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-zinc-900 tracking-tight">Area Monitoring</h1>
          <p className="text-zinc-500 mt-2 text-lg">Document compliance status across all areas.</p>
        </div>
        <button
          onClick={fetchData}
          className="p-4 bg-white border border-zinc-100 text-zinc-400 hover:text-indigo-600 rounded-2xl hover:bg-zinc-50 transition-all shadow-sm"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
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
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-sm font-bold text-amber-600 uppercase tracking-wider">Uploaded</p>
          </div>
          <p className="text-4xl font-bold text-zinc-900">{counts.uploaded}</p>
          <p className="text-sm text-zinc-400 mt-1">Documents</p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-sm font-bold text-blue-600 uppercase tracking-wider">Reviewed</p>
          </div>
          <p className="text-4xl font-bold text-zinc-900">{counts.reviewed}</p>
          <p className="text-sm text-zinc-400 mt-1">Documents</p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-sm font-bold text-emerald-600 uppercase tracking-wider">Approved</p>
          </div>
          <p className="text-4xl font-bold text-zinc-900">{counts.approved}</p>
          <p className="text-sm text-zinc-400 mt-1">Documents</p>
        </div>
      </div>

      {/* Area Sections */}
      <div className="space-y-6">
        {filteredAreas.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-zinc-100 border-dashed">
            <p className="text-zinc-400 italic">No areas found.</p>
          </div>
        ) : (
          filteredAreas.map((area) => <AreaSection key={area.id} area={area} onNavigate={(id) => navigate(`/dashboard/areas/${id}`)} />)
        )}
      </div>
    </div>
  );
}
