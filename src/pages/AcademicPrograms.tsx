import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Plus, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import AcademicProgramTable from '../components/AcademicProgramTable';
import AcademicProgramForm from '../components/AcademicProgramForm';

interface AcademicProgram {
  id: number;
  documentId?: string;
  attributes?: {
    programCode: string;
    programDesc: string;
  };
  programCode?: string;
  programDesc?: string;
}

export default function AcademicPrograms() {
  const [data, setData] = useState<AcademicProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<AcademicProgram | null>(null);
  const [mutationLoading, setMutationLoading] = useState(false);
  
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('jwt');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      const programs = await api.getAcademicPrograms(token);
      setData(programs);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch academic programs');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateOrUpdate = async (formData: { programCode: string; programDesc: string }) => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    try {
      setMutationLoading(true);
      if (editingProgram) {
        await api.updateAcademicProgram(token, editingProgram.documentId || editingProgram.id, formData);
      } else {
        await api.createAcademicProgram(token, formData);
      }
      await fetchData();
      setIsFormOpen(false);
      setEditingProgram(null);
    } catch (err: any) {
      throw err;
    } finally {
      setMutationLoading(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!window.confirm('Are you sure you want to delete this academic program?')) return;

    const token = localStorage.getItem('jwt');
    if (!token) return;

    try {
      setMutationLoading(true);
      await api.deleteAcademicProgram(token, id);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete academic program');
    } finally {
      setMutationLoading(false);
    }
  };

  const openEditForm = (program: AcademicProgram) => {
    setEditingProgram(program);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingProgram(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-zinc-900 tracking-tight">Academic Programs</h1>
          <p className="text-zinc-500 mt-2">Manage academic programs and their descriptions.</p>
        </div>
        
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
        >
          <Plus className="w-5 h-5" />
          Add New Program
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Table */}
      <AcademicProgramTable
        data={data}
        loading={loading}
        onEdit={openEditForm}
        onDelete={handleDelete}
      />

      {/* Mutation Loading Overlay */}
      {mutationLoading && !isFormOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/40 backdrop-blur-[2px]">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <AcademicProgramForm
          initialData={editingProgram}
          loading={mutationLoading}
          onClose={closeForm}
          onSubmit={handleCreateOrUpdate}
        />
      )}
    </div>
  );
}
