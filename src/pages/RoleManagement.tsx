import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, RefreshCw, Shield, Plus, Edit3, Trash2, X, Save, ChevronDown, ChevronUp, MapPin, GraduationCap, FileText } from 'lucide-react';
import { api } from '../services/api';
import { Area, AreaCriteria } from '../types/area';

interface AcademicProgram {
  id: number;
  documentId?: string;
  programCode?: string;
  programDesc?: string;
}

interface PersonelRole {
  id: number;
  documentId: string;
  role: string;
  description: string;
  coveredAreas?: { id: number; area_with_permission: string; allowedCriteria?: string }[];
  coveredPrograms?: { id: number; academic_program?: AcademicProgram }[];
}

interface AreaItem {
  id: number;
  documentId?: string;
  area: string;
  areaCriteria?: AreaCriteria[];
}

function RoleModal({ role, areas, programs, onClose, onSave }: {
  role: PersonelRole | null;
  areas: AreaItem[];
  programs: AcademicProgram[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const [roleName, setRoleName] = useState(role?.role || '');
  const [description, setDescription] = useState(role?.description || '');
  const [selectedAreas, setSelectedAreas] = useState<string[]>(
    role?.coveredAreas?.map(a => a.area_with_permission) || []
  );
  // Track allowed criteria per area: { "Faculty": ["BSIT:B.1", "BSBA:B.2"], "Instruction": [] }
  // Format: "PROGRAM:CODE" for program-specific criteria, or "CODE" for criteria without a program
  const [allowedCriteriaMap, setAllowedCriteriaMap] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    role?.coveredAreas?.forEach(a => {
      const codes = a.allowedCriteria ? a.allowedCriteria.split(',').map(c => c.trim()).filter(Boolean) : [];
      map[a.area_with_permission] = codes;
    });
    return map;
  });
  const [expandedAreaCriteria, setExpandedAreaCriteria] = useState<string | null>(null);
  const [selectedProgramIds, setSelectedProgramIds] = useState<number[]>(
    role?.coveredPrograms?.map(cp => cp.academic_program?.id).filter(Boolean) as number[] || []
  );
  const [saving, setSaving] = useState(false);

  const toggleArea = (areaName: string) => {
    setSelectedAreas(prev => {
      if (prev.includes(areaName)) {
        // Remove area and its criteria
        const newMap = { ...allowedCriteriaMap };
        delete newMap[areaName];
        setAllowedCriteriaMap(newMap);
        return prev.filter(a => a !== areaName);
      }
      return [...prev, areaName];
    });
  };

  // criteriaKey is "PROGRAM:CODE" or just "CODE" for criteria without a program
  const toggleCriteria = (areaName: string, criteriaKey: string) => {
    setAllowedCriteriaMap(prev => {
      const current = prev[areaName] || [];
      const updated = current.includes(criteriaKey)
        ? current.filter(c => c !== criteriaKey)
        : [...current, criteriaKey];
      return { ...prev, [areaName]: updated };
    });
  };

  const toggleAllCriteria = (areaName: string, allKeys: string[]) => {
    setAllowedCriteriaMap(prev => {
      const current = prev[areaName] || [];
      const allSelected = allKeys.every(c => current.includes(c));
      return { ...prev, [areaName]: allSelected ? [] : [...allKeys] };
    });
  };

  const toggleProgram = (programId: number) => {
    setSelectedProgramIds(prev =>
      prev.includes(programId) ? prev.filter(id => id !== programId) : [...prev, programId]
    );
  };

  const handleSave = async () => {
    if (!roleName.trim()) return;
    setSaving(true);
    try {
      await onSave({
        role: roleName.trim(),
        description: description.trim(),
        coveredAreas: selectedAreas.map(a => ({
          area_with_permission: a,
          allowedCriteria: (allowedCriteriaMap[a] || []).join(','),
        })),
        coveredPrograms: selectedProgramIds.map(id => ({ academic_program: programs.find(p => p.id === id)?.documentId || id })),
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  const getAreaCriteria = (areaName: string): AreaCriteria[] => {
    const area = areas.find(a => a.area === areaName);
    return area?.areaCriteria || [];
  };

  const inputClass = "w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-zinc-900">{role ? 'Edit Role' : 'Create Role'}</h3>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Role Name</label>
            <input type="text" value={roleName} onChange={e => setRoleName(e.target.value)} className={inputClass} placeholder="e.g. Dean, Faculty, Librarian" />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} className={inputClass} placeholder="e.g. Dean - Approver" />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Covered Areas & Criteria Permissions</label>
            <div className="space-y-1.5 max-h-64 overflow-y-auto border border-zinc-100 rounded-xl p-3 bg-zinc-50/50">
              {areas.length === 0 ? (
                <p className="text-xs text-zinc-400 italic">No areas available. Create areas first.</p>
              ) : (
                areas.map(area => {
                  const isSelected = selectedAreas.includes(area.area);
                  const criteria = getAreaCriteria(area.area);
                  const selectedCriteria = allowedCriteriaMap[area.area] || [];
                  const isAreaExpanded = expandedAreaCriteria === area.area;
                  return (
                    <div key={area.id}>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleArea(area.area)}
                          className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-white text-zinc-600 border border-zinc-100 hover:border-zinc-200'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-zinc-300'
                          }`}>
                            {isSelected && <span className="text-[8px]">✓</span>}
                          </div>
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="flex-1">{area.area}</span>
                          {isSelected && selectedCriteria.length > 0 && (
                            <span className="text-[9px] text-indigo-500 font-bold">{selectedCriteria.length} criteria</span>
                          )}
                          {isSelected && selectedCriteria.length === 0 && criteria.length > 0 && (
                            <span className="text-[9px] text-zinc-400">All criteria</span>
                          )}
                        </button>
                        {isSelected && criteria.length > 0 && (
                          <button
                            onClick={() => setExpandedAreaCriteria(isAreaExpanded ? null : area.area)}
                            className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Select specific criteria"
                          >
                            {isAreaExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                      {isSelected && isAreaExpanded && criteria.length > 0 && (() => {
                        // Group criteria by program (program-qualified keys: "BSIT:B.1")
                        // Criteria without a program get key "CODE" (no prefix)
                        const groupedByProgram: Record<string, { programCode: string; items: AreaCriteria[] }> = {};
                        criteria.forEach(c => {
                          const progCode = c.academic_program?.programCode || '';
                          const groupKey = progCode || '__no_program__';
                          if (!groupedByProgram[groupKey]) {
                            groupedByProgram[groupKey] = { programCode: progCode, items: [] };
                          }
                          groupedByProgram[groupKey].items.push(c);
                        });
                        const allKeys = criteria.map(c => {
                          const progCode = c.academic_program?.programCode;
                          return progCode ? `${progCode}:${c.code}` : c.code;
                        });
                        return (
                        <div className="ml-6 mt-1 mb-2 p-2 rounded-lg bg-white border border-zinc-100 space-y-2">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Upload Permissions</p>
                            <button
                              onClick={() => toggleAllCriteria(area.area, allKeys)}
                              className="text-[9px] font-bold text-indigo-500 hover:text-indigo-700"
                            >
                              {allKeys.every(k => selectedCriteria.includes(k)) ? 'Deselect All' : 'Select All'}
                            </button>
                          </div>
                          <p className="text-[9px] text-zinc-400 italic mb-1">Empty = can upload to all. Selected = can only upload to checked criteria.</p>
                          {Object.entries(groupedByProgram).map(([groupKey, group]) => {
                            const groupCriteriaKeys = group.items.map(c =>
                              group.programCode ? `${group.programCode}:${c.code}` : c.code
                            );
                            const allGroupSelected = groupCriteriaKeys.every(k => selectedCriteria.includes(k));
                            return (
                              <div key={groupKey} className="space-y-0.5">
                                {group.programCode && (
                                  <div className="flex items-center justify-between px-2 pt-1">
                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-indigo-600 uppercase tracking-wider">
                                      <GraduationCap className="w-3 h-3" />
                                      {group.programCode}
                                    </span>
                                    <button
                                      onClick={() => {
                                        setAllowedCriteriaMap(prev => {
                                          const current = prev[area.area] || [];
                                          if (allGroupSelected) {
                                            return { ...prev, [area.area]: current.filter(c => !groupCriteriaKeys.includes(c)) };
                                          }
                                          const toAdd = groupCriteriaKeys.filter(k => !current.includes(k));
                                          return { ...prev, [area.area]: [...current, ...toAdd] };
                                        });
                                      }}
                                      className="text-[8px] font-bold text-indigo-400 hover:text-indigo-700"
                                    >
                                      {allGroupSelected ? 'Deselect' : 'Select'} all {group.programCode}
                                    </button>
                                  </div>
                                )}
                                {!group.programCode && (
                                  <div className="px-2 pt-1">
                                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">General (No Program)</span>
                                  </div>
                                )}
                                {group.items.map(c => {
                                  const criteriaKey = group.programCode ? `${group.programCode}:${c.code}` : c.code;
                                  const isCriteriaSelected = selectedCriteria.includes(criteriaKey);
                                  return (
                                    <button
                                      key={criteriaKey}
                                      onClick={() => toggleCriteria(area.area, criteriaKey)}
                                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-[10px] font-medium transition-all ${
                                        isCriteriaSelected
                                          ? 'bg-indigo-50 text-indigo-700'
                                          : 'text-zinc-500 hover:bg-zinc-50'
                                      }`}
                                    >
                                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                                        isCriteriaSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-zinc-300'
                                      }`}>
                                        {isCriteriaSelected && <span className="text-[7px]">✓</span>}
                                      </div>
                                      <span className="font-bold">{c.code}</span>
                                      <span className="truncate">{c.desc}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                        );
                      })()}
                    </div>
                  );
                })
              )}
            </div>
            <p className="text-[10px] text-zinc-400 mt-1.5">{selectedAreas.length} area{selectedAreas.length !== 1 ? 's' : ''} selected</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Covered Programs</label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto border border-zinc-100 rounded-xl p-3 bg-zinc-50/50">
              {programs.length === 0 ? (
                <p className="text-xs text-zinc-400 italic">No academic programs available.</p>
              ) : (
                programs.map(prog => {
                  const isSelected = selectedProgramIds.includes(prog.id);
                  return (
                    <button
                      key={prog.id}
                      onClick={() => toggleProgram(prog.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-white text-zinc-600 border border-zinc-100 hover:border-zinc-200'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-zinc-300'
                      }`}>
                        {isSelected && <span className="text-[8px]">✓</span>}
                      </div>
                      <GraduationCap className="w-3 h-3 shrink-0" />
                      <span>{prog.programCode} — {prog.programDesc}</span>
                    </button>
                  );
                })
              )}
            </div>
            <p className="text-[10px] text-zinc-400 mt-1.5">{selectedProgramIds.length} program{selectedProgramIds.length !== 1 ? 's' : ''} selected</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-100 bg-zinc-50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-zinc-600 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-all">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !roleName.trim()}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RoleManagement() {
  const [roles, setRoles] = useState<PersonelRole[]>([]);
  const [areas, setAreas] = useState<AreaItem[]>([]);
  const [programs, setPrograms] = useState<AcademicProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<PersonelRole | null | 'new'>(null);
  const [expandedRole, setExpandedRole] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('jwt');
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [rolesData, areasData, programsData] = await Promise.all([
        api.getPersonelRoles(token),
        api.getAreas(token),
        api.getAcademicPrograms(token).catch(() => []),
      ]);
      setRoles(rolesData);
      setAreas(areasData.map((a: any) => ({ id: a.id, documentId: a.documentId, area: a.area, areaCriteria: a.areaCriteria || [] })));
      setPrograms(programsData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async (data: any) => {
    const token = localStorage.getItem('jwt');
    if (!token) return;
    if (editingRole === 'new') {
      await api.createPersonelRole(token, data);
    } else if (editingRole) {
      await api.updatePersonelRole(token, editingRole.documentId, data);
    }
    fetchData();
  };

  const handleDelete = async (role: PersonelRole) => {
    if (!window.confirm(`Delete role "${role.role}"? This cannot be undone.`)) return;
    const token = localStorage.getItem('jwt');
    if (!token) return;
    try {
      await api.deletePersonelRole(token, role.documentId);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete role');
    }
  };

  const getPermissionLevel = (roleName: string) => {
    const r = roleName.toLowerCase();
    if (['dean', 'librarian', 'dsa', 'physical plant', 'admin'].includes(r)) return { label: 'Approver', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
    if (['program head', 'area coordinator'].includes(r)) return { label: 'Reviewer', color: 'bg-blue-50 text-blue-600 border-blue-100' };
    return { label: 'Uploader', color: 'bg-amber-50 text-amber-600 border-amber-100' };
  };

  if (loading && roles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-zinc-500 font-medium">Loading roles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 rounded-3xl bg-rose-50 border border-rose-100 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
        <h3 className="text-lg font-bold text-rose-900">Failed to load roles</h3>
        <p className="text-rose-600/80">{error}</p>
        <button onClick={fetchData} className="px-6 py-2 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {editingRole && (
        <RoleModal
          role={editingRole === 'new' ? null : editingRole}
          areas={areas}
          programs={programs}
          onClose={() => setEditingRole(null)}
          onSave={handleSave}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <Shield className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Role Management</h1>
            <p className="text-zinc-500 text-sm">Manage personnel roles and area permissions.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="p-3 bg-white border border-zinc-100 text-zinc-400 hover:text-indigo-600 rounded-xl hover:bg-zinc-50 transition-all shadow-sm">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setEditingRole('new')}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-100"
          >
            <Plus className="w-4 h-4" /> Add Role
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total Roles</p>
          <p className="text-2xl font-bold text-zinc-900 mt-1">{roles.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4">
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Approvers</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{roles.filter(r => getPermissionLevel(r.role).label === 'Approver').length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4">
          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Reviewers</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{roles.filter(r => getPermissionLevel(r.role).label === 'Reviewer').length}</p>
        </div>
      </div>

      {/* Role List */}
      <div className="space-y-3">
        {roles.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-zinc-100 border-dashed">
            <Shield className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-400 font-medium">No roles created yet.</p>
          </div>
        ) : (
          roles.map(role => {
            const perm = getPermissionLevel(role.role);
            const isExpanded = expandedRole === role.id;
            return (
              <div key={role.id} className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-zinc-900">{role.role}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${perm.color}`}>
                        {perm.label}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{role.description || 'No description'}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {((role.coveredAreas && role.coveredAreas.length > 0) || (role.coveredPrograms && role.coveredPrograms.length > 0)) && (
                      <button
                        onClick={() => setExpandedRole(isExpanded ? null : role.id)}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-zinc-400 hover:text-indigo-600 bg-zinc-50 border border-zinc-100 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-all"
                      >
                        {role.coveredAreas && role.coveredAreas.length > 0 && (
                          <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{role.coveredAreas.length}</span>
                        )}
                        {role.coveredPrograms && role.coveredPrograms.length > 0 && (
                          <span className="flex items-center gap-0.5"><GraduationCap className="w-3 h-3" />{role.coveredPrograms.length}</span>
                        )}
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                    <button onClick={() => setEditingRole(role)} className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Edit">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(role)} className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 space-y-2">
                    {role.coveredAreas && role.coveredAreas.length > 0 && (
                      <div>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest pl-14 mb-1">Covered Areas</p>
                        <div className="space-y-1.5 pl-14">
                          {role.coveredAreas.map((a, i) => {
                            const criteriaCodes = a.allowedCriteria ? a.allowedCriteria.split(',').map(c => c.trim()).filter(Boolean) : [];
                            return (
                              <div key={i}>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-zinc-50 text-zinc-600 border border-zinc-100">
                                  <MapPin className="w-3 h-3 text-zinc-400" />
                                  {a.area_with_permission}
                                  {criteriaCodes.length > 0 && (
                                    <span className="text-indigo-500 ml-1">({criteriaCodes.length} criteria)</span>
                                  )}
                                  {criteriaCodes.length === 0 && (
                                    <span className="text-zinc-400 ml-1">(all criteria)</span>
                                  )}
                                </span>
                                {criteriaCodes.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1 ml-4">
                                    {criteriaCodes.map((code, j) => (
                                      <span key={j} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                                        <FileText className="w-2.5 h-2.5" />
                                        {code}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {role.coveredPrograms && role.coveredPrograms.length > 0 && (
                      <div>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest pl-14 mb-1">Covered Programs</p>
                        <div className="flex flex-wrap gap-1.5 pl-14">
                          {role.coveredPrograms.map((cp, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                              <GraduationCap className="w-3 h-3 text-indigo-400" />
                              {cp.academic_program?.programCode || 'Unknown'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
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
