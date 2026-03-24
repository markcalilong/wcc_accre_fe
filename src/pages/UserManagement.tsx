import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, AlertCircle, RefreshCw, Users, Search, Shield, ShieldCheck, ShieldX, CheckCircle2, XCircle, Edit3, X, Save, GraduationCap } from 'lucide-react';
import { api } from '../services/api';
import { getUserPersonelRole, hasManagementAccess, isDeanRole } from '../utils/roles';

interface PersonelRole {
  id: number;
  documentId: string;
  role: string;
  description: string;
}

interface CampusRecord {
  id: number;
  documentId?: string;
  campusDesc?: string;
}

interface UserRecord {
  id: number;
  documentId: string;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  gender: string | null;
  birthDate: string | null;
  mobileNumber: string | null;
  academic_program: string | null;
  campuses?: CampusRecord[];
  confirmed: boolean;
  blocked: boolean;
  createdAt: string;
  role?: {
    id: number;
    name: string;
    type: string;
  };
  personel_role?: PersonelRole;
}

function StatusBadge({ blocked }: { blocked: boolean }) {
  if (blocked) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 uppercase tracking-wider">
        <XCircle className="w-3 h-3" /> Blocked
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-wider">
      <CheckCircle2 className="w-3 h-3" /> Active
    </span>
  );
}

function RoleBadge({ personelRole, strapiRole }: { personelRole?: PersonelRole; strapiRole?: { name: string } }) {
  const name = personelRole?.role || strapiRole?.name || 'Unassigned';
  const isPersonel = !!personelRole;

  // Color based on permission level
  const r = name.toLowerCase();
  let colorClass = 'bg-zinc-50 text-zinc-500 border-zinc-200';
  if (r === 'authenticated') {
    colorClass = 'bg-purple-50 text-purple-600 border-purple-100'; // System admin
  } else if (['dean', 'librarian', 'dsa', 'physical plant'].includes(r)) {
    colorClass = 'bg-emerald-50 text-emerald-600 border-emerald-100'; // Approvers
  } else if (['program head', 'area coordinator'].includes(r)) {
    colorClass = 'bg-blue-50 text-blue-600 border-blue-100'; // Reviewers
  } else if (['faculty', 'admin staff', 'library staff'].includes(r)) {
    colorClass = 'bg-amber-50 text-amber-600 border-amber-100'; // Uploaders
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${colorClass}`}>
      <Shield className="w-3 h-3" /> {name}
      {!isPersonel && name !== 'Unassigned' && <span className="opacity-50">(sys)</span>}
    </span>
  );
}

function EditUserModal({ user, programs, personelRoles, allCampuses, isDeanEditor, onClose, onSave }: {
  user: UserRecord;
  programs: any[];
  personelRoles: PersonelRole[];
  allCampuses: CampusRecord[];
  isDeanEditor?: boolean;
  onClose: () => void;
  onSave: (userId: number, data: Record<string, any>) => Promise<void>;
}) {
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [gender, setGender] = useState(user.gender || '');
  const [birthDate, setBirthDate] = useState(user.birthDate || '');
  const [mobileNumber, setMobileNumber] = useState(user.mobileNumber || '');
  const [academicProgram, setAcademicProgram] = useState(user.academic_program || '');
  const [selectedRoleId, setSelectedRoleId] = useState<string>(
    user.personel_role ? String(user.personel_role.id) : ''
  );
  const [selectedCampusIds, setSelectedCampusIds] = useState<number[]>(
    user.campuses?.map(c => c.id) || []
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(user.id, {
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
        gender: gender || null,
        birthDate: birthDate || null,
        mobileNumber: mobileNumber.trim() || null,
        academic_program: academicProgram || null,
        personel_role: selectedRoleId ? Number(selectedRoleId) : null,
        campuses: selectedCampusIds,
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to update user');
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
            <Edit3 className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-zinc-900">Edit User: {user.username}</h3>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Personnel Role */}
          <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-2">
            <label className="block text-xs font-bold text-indigo-600 uppercase tracking-widest">Personnel Role</label>
            <select value={selectedRoleId} onChange={e => setSelectedRoleId(e.target.value)} className={`${inputClass} border-indigo-200 bg-white`}>
              <option value="">No Role Assigned</option>
              {personelRoles
                .filter(r => isDeanEditor ? DEAN_EDITABLE_ROLES.includes(r.role.toLowerCase().trim()) : true)
                .map(r => (
                  <option key={r.id} value={r.id}>
                    {r.role} {r.description ? `- ${r.description}` : ''}
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">First Name</label>
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className={inputClass} placeholder="First Name" />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Last Name</label>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className={inputClass} placeholder="Last Name" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Gender</label>
              <select value={gender} onChange={e => setGender(e.target.value)} className={inputClass}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Birth Date</label>
              <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Mobile Number</label>
            <input type="tel" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} className={inputClass} placeholder="09XXXXXXXXX" />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Academic Program</label>
            <select value={academicProgram} onChange={e => setAcademicProgram(e.target.value)} className={inputClass}>
              <option value="">No Program</option>
              {programs.map(p => (
                <option key={p.id} value={p.programCode}>
                  {p.programCode} - {p.programName || p.programDesc}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Campuses</label>
            <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-zinc-200 bg-zinc-50 min-h-[42px]">
              {allCampuses.map(campus => {
                const isSelected = selectedCampusIds.includes(campus.id);
                return (
                  <button
                    key={campus.id}
                    type="button"
                    onClick={() => {
                      setSelectedCampusIds(prev =>
                        isSelected ? prev.filter(id => id !== campus.id) : [...prev, campus.id]
                      );
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                        : 'bg-white text-zinc-400 border border-zinc-200 hover:border-indigo-200 hover:text-indigo-600'
                    }`}
                  >
                    {campus.campusDesc}
                  </button>
                );
              })}
              {allCampuses.length === 0 && (
                <span className="text-xs text-zinc-400 italic">No campuses available</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-100 bg-zinc-50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-zinc-600 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-all">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Roles that deans are allowed to edit (faculty-level roles)
const DEAN_EDITABLE_ROLES = ['faculty', 'admin staff', 'library staff'];

export default function UserManagement() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [personelRoles, setPersonelRoles] = useState<PersonelRole[]>([]);
  const [allCampuses, setAllCampuses] = useState<CampusRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Current user's role info
  const currentRoleName = useMemo(() => currentUser ? getUserPersonelRole(currentUser) : '', [currentUser]);
  const isAdmin = useMemo(() => hasManagementAccess(currentRoleName), [currentRoleName]);
  const isDean = useMemo(() => isDeanRole(currentRoleName), [currentRoleName]);

  // Dean's program codes for scoping
  const deanProgramCodes = useMemo(() => {
    if (!isDean || !currentUser) return [];
    const codes: string[] = [];
    const coveredPrograms = currentUser?.personel_role?.coveredPrograms || [];
    for (const cp of coveredPrograms) {
      const code = cp.academic_program?.programCode;
      if (code) codes.push(code.toLowerCase().trim());
    }
    const ownProgram = typeof currentUser?.academic_program === 'string'
      ? currentUser.academic_program
      : currentUser?.academic_program?.programCode;
    if (ownProgram && !codes.includes(ownProgram.toLowerCase().trim())) {
      codes.push(ownProgram.toLowerCase().trim());
    }
    return codes;
  }, [isDean, currentUser]);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('jwt');
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [meRes, usersRes, programsRes, rolesRes, campusesRes] = await Promise.all([
        api.getMe(token),
        api.getUsers(token),
        api.getAcademicPrograms().catch(() => []),
        api.getPersonelRoles(token).catch(() => []),
        api.getCampuses(token).catch(() => []),
      ]);
      setCurrentUser(meRes);
      setUsers(Array.isArray(usersRes) ? usersRes : []);
      setPrograms(programsRes);
      setPersonelRoles(rolesRes);
      setAllCampuses(campusesRes);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggleBlock = async (user: UserRecord) => {
    const token = localStorage.getItem('jwt');
    if (!token) return;
    const action = user.blocked ? 'activate' : 'block';
    if (!window.confirm(`Are you sure you want to ${action} ${user.username}?`)) return;

    setTogglingId(user.id);
    try {
      await api.updateUser(token, user.id, { blocked: !user.blocked });
      fetchData();
    } catch (err: any) {
      alert(err.message || `Failed to ${action} user`);
    } finally {
      setTogglingId(null);
    }
  };

  const handleSaveUser = async (userId: number, data: Record<string, any>) => {
    const token = localStorage.getItem('jwt');
    if (!token) throw new Error('Not authenticated');
    await api.updateUser(token, userId, data);
    fetchData();
  };

  // Filter users — deans only see faculty-level users in their program
  const filteredUsers = users.filter(u => {
    // Dean scoping: only show faculty-level users in their program
    if (isDean && !isAdmin) {
      const userRole = (u.personel_role?.role || u.role?.name || '').toLowerCase().trim();
      // Only show faculty-level roles
      if (!DEAN_EDITABLE_ROLES.includes(userRole)) return false;
      // Only show users in dean's program(s)
      if (deanProgramCodes.length > 0) {
        const userProgram = (u.academic_program || '').toLowerCase().trim();
        if (!userProgram || !deanProgramCodes.includes(userProgram)) return false;
      }
    }

    if (search) {
      const q = search.toLowerCase();
      const match = u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.firstName || '').toLowerCase().includes(q) ||
        (u.lastName || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filterRole) {
      const userRoleName = u.personel_role?.role || u.role?.name || 'Unassigned';
      if (userRoleName !== filterRole) return false;
    }
    if (filterStatus === 'active' && u.blocked) return false;
    if (filterStatus === 'blocked' && !u.blocked) return false;
    return true;
  });

  const roles = [...new Set(users.map(u => u.personel_role?.role || u.role?.name).filter(Boolean))];

  if (loading && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-zinc-500 font-medium">Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 rounded-3xl bg-rose-50 border border-rose-100 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-rose-900">Failed to load users</h3>
        <p className="text-rose-600/80">{error}</p>
        <button onClick={fetchData} className="px-6 py-2 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {editingUser && (
        <EditUserModal user={editingUser} programs={programs} personelRoles={personelRoles} allCampuses={allCampuses} isDeanEditor={isDean && !isAdmin} onClose={() => setEditingUser(null)} onSave={handleSaveUser} />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">User Management</h1>
            <p className="text-zinc-500 text-sm">
              {isDean && !isAdmin
                ? 'Manage faculty users in your program.'
                : 'Manage user accounts, activate and edit profiles.'}
            </p>
          </div>
        </div>
        <button onClick={fetchData} className="p-3 bg-white border border-zinc-100 text-zinc-400 hover:text-indigo-600 rounded-xl hover:bg-zinc-50 transition-all shadow-sm">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total Users</p>
          <p className="text-2xl font-bold text-zinc-900 mt-1">{users.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4">
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Active</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{users.filter(u => !u.blocked).length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4">
          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Blocked</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{users.filter(u => u.blocked).length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4">
          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Faculty</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{users.filter(u => u.role?.name === 'Faculty').length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, username, or email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
        >
          <option value="">All Roles</option>
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50">
                <th className="text-left px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">User</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Email</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Program</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Campus</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Role</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Registered</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-zinc-400 italic">
                    No users found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0">
                          {(user.firstName || user.username).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-zinc-900 truncate">
                            {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                          </p>
                          <p className="text-[10px] text-zinc-400 truncate">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 truncate max-w-[180px]">{user.email}</td>
                    <td className="px-4 py-3">
                      {user.academic_program ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600">
                          <GraduationCap className="w-3 h-3" /> {user.academic_program}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-300 italic">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {user.campuses && user.campuses.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.campuses.map(c => (
                            <span key={c.id} className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-600 border border-teal-100 uppercase tracking-wider">
                              {c.campusDesc}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-300 italic">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><RoleBadge personelRole={user.personel_role} strapiRole={user.role} /></td>
                    <td className="px-4 py-3"><StatusBadge blocked={user.blocked} /></td>
                    <td className="px-4 py-3 text-xs text-zinc-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Edit User"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {/* Only admins can block/activate users */}
                        {isAdmin && (
                          <button
                            onClick={() => handleToggleBlock(user)}
                            disabled={togglingId === user.id}
                            className={`p-1.5 rounded-lg transition-all ${
                              user.blocked
                                ? 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50'
                                : 'text-rose-400 hover:text-rose-600 hover:bg-rose-50'
                            } disabled:opacity-50`}
                            title={user.blocked ? 'Activate User' : 'Block User'}
                          >
                            {togglingId === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : user.blocked ? (
                              <ShieldCheck className="w-4 h-4" />
                            ) : (
                              <ShieldX className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
