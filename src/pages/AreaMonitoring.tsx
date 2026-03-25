import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Area, AreaCriteria, FileUploadMetadata } from '../types/area';
import { Loader2, AlertCircle, RefreshCw, FileCheck, Clock, CheckCircle2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { hasManagementAccess, getUserPersonelRole } from '../utils/roles';
import { sortAreasByNumber } from '../utils/sorting';

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

function AreaSection({ area, filterUploads, onNavigate }: { key?: any; area: Area; filterUploads: (uploads: FileUploadMetadata[]) => FileUploadMetadata[]; onNavigate: (id: string) => void }) {
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
            <div className="flex items-center gap-2 mt-2 flex-wrap">
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
                <CriteriaRow
                  key={criteria.id}
                  criteria={criteria}
                  filteredCriteriaUploads={filterUploads(criteria.criteriaUploads || [])}
                  filteredSubCriteriaUploads={(subId: number) => {
                    const sub = criteria.subcriteria.find(s => s.id === subId);
                    return filterUploads(sub?.subCriteriaUploads || []);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CriteriaRow({ criteria, filteredCriteriaUploads, filteredSubCriteriaUploads }: {
  key?: any;
  criteria: AreaCriteria;
  filteredCriteriaUploads: FileUploadMetadata[];
  filteredSubCriteriaUploads: (subId: number) => FileUploadMetadata[];
}) {
  const status = getUploadStatus(filteredCriteriaUploads);

  return (
    <div>
      <div className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50/30 transition-colors">
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-sm text-zinc-900">
            <span className="font-bold">{criteria.code}.</span>{' '}
            {criteria.desc}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      {criteria.subcriteria.length > 0 && (
        <div className="bg-zinc-50/30">
          {criteria.subcriteria.map((sub) => {
            const subStatus = getUploadStatus(filteredSubCriteriaUploads(sub.id));
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
  const [semesters, setSemesters] = useState<any[]>([]);
  const [visitTypes, setVisitTypes] = useState<any[]>([]);
  const [campuses, setCampuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedVisit, setSelectedVisit] = useState<string>('');
  const [selectedCampus, setSelectedCampus] = useState<string>('');
  const [userData, setUserData] = useState<any>(null);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const [areasData, programsResult, yearsResult, semestersResult, visitTypesResult, campusesResult, userResult] = await Promise.all([
        api.getAreas(token),
        api.getAcademicPrograms().catch(() => []),
        api.getAcademicYears(token).catch(() => []),
        api.getSemesters(token).catch(() => []),
        api.getVisitTypes(token).catch(() => []),
        api.getCampuses(token).catch(() => []),
        api.getMe(token).catch(() => null),
      ]);
      setAreas(areasData);
      setPrograms(programsResult);
      setYears(yearsResult);
      setSemesters(semestersResult);
      setVisitTypes(visitTypesResult);
      setCampuses(campusesResult);
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

  // Auto-set program and campus filters based on user profile (non-admin only)
  useEffect(() => {
    if (!userData) return;
    const role = getUserPersonelRole(userData);
    if (hasManagementAccess(role)) return; // admin sees all

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

    // Auto-set campus (use first campus from user's campuses)
    const userCampuses = userData.campuses || [];
    if (userCampuses.length > 0 && campuses.length > 0 && !selectedCampus) {
      setSelectedCampus(String(userCampuses[0].id));
    }
  }, [userData, programs, campuses, selectedProgram, selectedCampus]);

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

  // Get user's campus IDs for filtering
  const userCampusIds = useMemo(() => {
    return (userData?.campuses || []).map((c: any) => c.id) as number[];
  }, [userData]);

  // Areas are universal (visible to all campuses/programs).
  // Only filter by coveredAreas from personel_role (which areas the user is assigned to).
  // Campus filtering happens at the upload level, not the area level.
  const filteredAreas = useMemo(() => {
    return areas.filter(area => {
      if (!isAdmin) {
        // Filter by coveredAreas from personel_role
        if (userCoveredAreas.length > 0) {
          const areaNameLower = area.area.toLowerCase().trim();
          if (!userCoveredAreas.includes(areaNameLower)) return false;
        }
      }

      return true;
    }).sort(sortAreasByNumber);
  }, [areas, isAdmin, userCoveredAreas]);

  // Filter uploads based on dropdown selections
  const filterUploads = useCallback((uploads: FileUploadMetadata[]) => {
    return uploads.filter(u => {
      if (selectedProgram && String(u.academic_program?.id) !== selectedProgram) return false;
      if (selectedYear && String(u.academic_year?.id) !== selectedYear) return false;
      if (selectedSemester && String(u.semester?.id) !== selectedSemester) return false;
      if (selectedVisit && String(u.visit?.id) !== selectedVisit) return false;
      if (selectedCampus && String(u.campus?.id) !== selectedCampus) return false;
      return true;
    });
  }, [selectedProgram, selectedYear, selectedSemester, selectedVisit, selectedCampus]);

  // Count uploads from filtered areas, applying upload-level filters
  const counts = useMemo(() => {
    let uploaded = 0;
    let reviewed = 0;
    let approved = 0;

    filteredAreas.forEach(area => {
      area.areaCriteria.forEach(criteria => {
        filterUploads(criteria.criteriaUploads || []).forEach(u => {
          if (u.fileStatus === 'Approved') approved++;
          else if (u.fileStatus === 'Reviewed') reviewed++;
          else uploaded++;
        });
        criteria.subcriteria?.forEach(sub => {
          filterUploads(sub.subCriteriaUploads || []).forEach(u => {
            if (u.fileStatus === 'Approved') approved++;
            else if (u.fileStatus === 'Reviewed') reviewed++;
            else uploaded++;
          });
        });
      });
    });

    return { uploaded, reviewed, approved };
  }, [filteredAreas, filterUploads]);

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

      {/* User context info (non-admin) */}
      {!isAdmin && userData && (
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

      {/* Filters */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdmin ? 'lg:grid-cols-5' : 'lg:grid-cols-3'} gap-4`}>
        {isAdmin && (
          <div>
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
        <div>
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
        <div>
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
        <div>
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
        {isAdmin && (
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Campus</label>
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none appearance-none"
            >
              <option value="">All Campuses</option>
              {campuses.map((c: any) => (
                <option key={c.id} value={String(c.id)}>
                  {c.campusName || c.attributes?.campusName}
                </option>
              ))}
            </select>
          </div>
        )}
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
          filteredAreas.map((area) => <AreaSection key={area.id} area={area} filterUploads={filterUploads} onNavigate={(id) => navigate(`/dashboard/areas/${id}`)} />)
        )}
      </div>
    </div>
  );
}
