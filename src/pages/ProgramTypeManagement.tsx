import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Plus, Loader2, AlertCircle, Edit2, Trash2, X, BookOpen } from 'lucide-react';

interface ProgramType {
  id: number;
  documentId?: string;
  programTypeDesc?: string;
}

export default function ProgramTypeManagement() {
  const [data, setData] = useState<ProgramType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProgramType | null>(null);
  const [mutationLoading, setMutationLoading] = useState(false);
  const [formValue, setFormValue] = useState('');
  const [formError, setFormError] = useState('');
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('jwt');
    if (!token) { navigate('/login'); return; }
    try {
      setLoading(true);
      const result = await api.getProgramTypes(token);
      setData(result);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch program types');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setEditing(null); setFormValue(''); setFormError(''); setIsFormOpen(true); };
  const openEdit = (item: ProgramType) => { setEditing(item); setFormValue(item.programTypeDesc || ''); setFormError(''); setIsFormOpen(true); };
  const closeForm = () => { setIsFormOpen(false); setEditing(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValue.trim()) { setFormError('Program type description is required'); return; }
    const token = localStorage.getItem('jwt');
    if (!token) return;
    try {
      setMutationLoading(true);
      setFormError('');
      if (editing) {
        await api.updateProgramType(token, editing.documentId || editing.id, { programTypeDesc: formValue });
      } else {
        await api.createProgramType(token, { programTypeDesc: formValue });
      }
      await fetchData();
      closeForm();
    } catch (err: any) {
      setFormError(err.message || 'Something went wrong');
    } finally {
      setMutationLoading(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!window.confirm('Are you sure you want to delete this program type?')) return;
    const token = localStorage.getItem('jwt');
    if (!token) return;
    try {
      setMutationLoading(true);
      await api.deleteProgramType(token, id);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete program type');
    } finally {
      setMutationLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-zinc-900 tracking-tight">Program Type Management</h1>
          <p className="text-zinc-500 mt-2">Manage program types (e.g. Undergraduate, Graduate).</p>
        </div>
        <button onClick={openCreate} className="flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200">
          <Plus className="w-5 h-5" />
          Add New Program Type
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" /><p>{error}</p>
        </div>
      )}

      {loading && data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[32px] border border-zinc-100 shadow-sm">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
          <p className="text-zinc-500 font-medium">Loading program types...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[32px] border border-zinc-100 shadow-sm">
          <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-zinc-300" />
          </div>
          <p className="text-zinc-500 font-medium text-lg">No program types found</p>
          <p className="text-zinc-400 text-sm mt-1">Add your first program type to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50">
                  <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Program Type Description</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {data.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-zinc-500">#{item.id}</td>
                    <td className="px-6 py-4 text-sm font-bold text-zinc-900">{item.programTypeDesc || 'N/A'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(item)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(item.documentId || item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {mutationLoading && !isFormOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/40 backdrop-blur-[2px]">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-zinc-900">{editing ? 'Edit Program Type' : 'Add Program Type'}</h2>
                <button onClick={closeForm} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-xl transition-all"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Program Type Description <span className="text-red-500">*</span></label>
                  <input type="text" value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="e.g. Undergraduate" className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-900 font-medium focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none" disabled={mutationLoading} />
                </div>
                {formError && <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600 font-medium">{formError}</div>}
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeForm} className="flex-1 px-6 py-4 bg-zinc-100 text-zinc-600 font-bold rounded-2xl hover:bg-zinc-200 transition-all" disabled={mutationLoading}>Cancel</button>
                  <button type="submit" className="flex-1 px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50" disabled={mutationLoading}>
                    {mutationLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : editing ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
