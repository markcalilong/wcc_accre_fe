import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Plus, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import AcademicYearTable from '../components/AcademicYearTable';
import AcademicYearForm from '../components/AcademicYearForm';

interface AcademicYear {
  id: number;
  documentId?: string;
  attributes?: {
    schoolyear: string;
    locale: string;
  };
  schoolyear?: string;
  locale?: string;
}

export default function AcademicYears() {
  const [data, setData] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
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
      const years = await api.getAcademicYears(token);
      setData(years);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch academic years');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateOrUpdate = async (formData: { schoolyear: string; locale: string }) => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    try {
      setMutationLoading(true);
      if (editingYear) {
        await api.updateAcademicYear(token, editingYear.documentId || editingYear.id, formData);
      } else {
        await api.createAcademicYear(token, formData);
      }
      await fetchData();
      setIsFormOpen(false);
      setEditingYear(null);
    } catch (err: any) {
      throw err; // Form component handles local error display
    } finally {
      setMutationLoading(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!window.confirm('Are you sure you want to delete this academic year?')) return;

    const token = localStorage.getItem('jwt');
    if (!token) return;

    try {
      setMutationLoading(true);
      await api.deleteAcademicYear(token, id);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete academic year');
    } finally {
      setMutationLoading(false);
    }
  };

  const openEditForm = (year: AcademicYear) => {
    setEditingYear(year);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingYear(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-zinc-900 tracking-tight">Academic Years</h1>
          <p className="text-zinc-500 mt-2">Manage school years and localization settings.</p>
        </div>
        
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
        >
          <Plus className="w-5 h-5" />
          Add New Year
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
      <AcademicYearTable
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
        <AcademicYearForm
          initialData={editingYear}
          loading={mutationLoading}
          onClose={closeForm}
          onSubmit={handleCreateOrUpdate}
        />
      )}
    </div>
  );
}
