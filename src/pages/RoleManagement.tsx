import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, RefreshCw, Shield, Plus, Edit3, Trash2, X, Save, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { api } from '../services/api';

interface PersonelRole {
  id: number;
  documentId: string;
  role: string;
  description: string;
  coveredAreas?: { id: number; area_with_permission: string }[];
}

interface AreaItem {
  id: number;
  documentId?: string;
  area: string;
}

function RoleModal({ role, areas, onClose, onSave }: {
  role: PersonelRole | null;
  areas: AreaItem[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const [roleName, setRoleName] = useState(role?.role || '');
  const [description, setDescription] = useState(role?.description || '');
  const [selectedAreas, setSelectedAreas] = useState<string[]>(
    role?.coveredAreas?.map(a => a.area_with_permission) || []
  );
  const [saving, setSaving] = useState(false);

  const toggleArea = (areaName: string) => {
    setSelectedAreas(prev =>
      prev.includes(areaName) ? prev.filter(a => a !== areaName) : [...prev, areaName]
    );
  };

  const handleSave = async () => {
    if (!roleName.trim()) return;
    setSaving(true);
    try {
      await onSave({
        role: roleName.trim(),
        description: description.trim(),
        coveredAreas: selectedAreas.map(a => ({ area_with_permission: a })),
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to save role');
    } finally {
      setSaving(false);
    }
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
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Covered Areas (Permissions)</label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto border border-zinc-100 rounded-xl p-3 bg-zinc-50/50">
              {areas.length === 0 ? (
                <p className="text-xs text-zinc-400 italic">No areas available. Create areas first.</p>
              ) : (
                areas.map(area => {
                  const isSelected = selectedAreas.includes(area.area);
                  return (
                    <button
                      key={area.id}
                      onClick={() => toggleArea(area.area)}
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
                      <MapPin className="w-3 h-3 shrink-0" />
                      {area.area}
                    </button>
                  );
                })
              )}
            </div>
            <p className="text-[10px] text-zinc-400 mt-1.5">{selectedAreas.length} area{selectedAreas.length !== 1 ? 's' : ''} selected</p>
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
      const [rolesData, areasData] = await Promise.all([
        api.getPersonelRoles(token),
        api.getAreas(token),
      ]);
      setRoles(rolesData);
      setAreas(areasData.map((a: any) => ({ id: a.id, documentId: a.documentId, area: a.area })));
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
                    {role.coveredAreas && role.coveredAreas.length > 0 && (
                      <button
                        onClick={() => setExpandedRole(isExpanded ? null : role.id)}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-zinc-400 hover:text-indigo-600 bg-zinc-50 border border-zinc-100 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-all"
                      >
                        <MapPin className="w-3 h-3" />
                        {role.coveredAreas.length}
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
                {isExpanded && role.coveredAreas && role.coveredAreas.length > 0 && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="flex flex-wrap gap-1.5 pl-14">
                      {role.coveredAreas.map((a, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-zinc-50 text-zinc-600 border border-zinc-100">
                          <MapPin className="w-3 h-3 text-zinc-400" />
                          {a.area_with_permission}
                        </span>
                      ))}
                    </div>
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
