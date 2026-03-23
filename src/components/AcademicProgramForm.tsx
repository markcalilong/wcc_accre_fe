import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

interface AcademicProgram {
  id: number;
  documentId?: string;
  attributes?: {
    programCode: string;
    programDesc: string;
  };
  programCode?: string;
  programDesc?: string;
  program_type?: { id: number; documentId?: string; programTypeDesc?: string } | null;
}

interface ProgramType {
  id: number;
  documentId?: string;
  programTypeDesc?: string;
}

interface Props {
  initialData?: AcademicProgram | null;
  programTypes?: ProgramType[];
  onSubmit: (data: { programCode: string; programDesc: string; program_type?: number | null }) => Promise<void>;
  onClose: () => void;
  loading: boolean;
}

export default function AcademicProgramForm({ initialData, programTypes = [], onSubmit, onClose, loading }: Props) {
  const [programCode, setProgramCode] = useState('');
  const [programDesc, setProgramDesc] = useState('');
  const [programTypeId, setProgramTypeId] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      const programCodeValue = initialData.attributes?.programCode || initialData.programCode || '';
      const programDescValue = initialData.attributes?.programDesc || initialData.programDesc || '';
      setProgramCode(programCodeValue);
      setProgramDesc(programDescValue);
      setProgramTypeId(initialData.program_type?.id ? String(initialData.program_type.id) : '');
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programCode.trim()) {
      setError('Program code is required');
      return;
    }
    if (!programDesc.trim()) {
      setError('Program description is required');
      return;
    }
    setError('');
    try {
      await onSubmit({
        programCode,
        programDesc,
        program_type: programTypeId ? Number(programTypeId) : null
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-zinc-900">
              {initialData ? 'Edit Academic Program' : 'Add Academic Program'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-xl transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
                Program Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={programCode}
                onChange={(e) => setProgramCode(e.target.value)}
                placeholder="e.g. BSCS"
                className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-900 font-medium focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
                Program Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={programDesc}
                onChange={(e) => setProgramDesc(e.target.value)}
                placeholder="e.g. Bachelor of Science in Computer Science"
                className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-900 font-medium focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none min-h-[100px] resize-none"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
                Program Type
              </label>
              <select
                value={programTypeId}
                onChange={(e) => setProgramTypeId(e.target.value)}
                className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-900 font-medium focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none appearance-none"
                disabled={loading}
              >
                <option value="">No Program Type</option>
                {programTypes.map(pt => (
                  <option key={pt.id} value={pt.id}>{pt.programTypeDesc}</option>
                ))}
              </select>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600 font-medium">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-4 bg-zinc-100 text-zinc-600 font-bold rounded-2xl hover:bg-zinc-200 transition-all"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  initialData ? 'Update' : 'Create'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
