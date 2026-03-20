import { Edit2, Trash2 } from 'lucide-react';

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

interface Props {
  data: AcademicYear[];
  onEdit: (year: AcademicYear) => void;
  onDelete: (id: string | number) => void;
  loading: boolean;
}

export default function AcademicYearTable({ data, onEdit, onDelete, loading }: Props) {
  if (loading && data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-white rounded-2xl border border-zinc-100">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-500 text-sm font-medium">Loading academic years...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-white rounded-2xl border border-zinc-100">
        <p className="text-zinc-500">No academic years found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-bottom border-zinc-100">
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">ID</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">School Year</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Locale</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {data.map((year) => {
              const schoolyear = year.attributes?.schoolyear || year.schoolyear || 'N/A';
              const locale = year.attributes?.locale || year.locale || 'N/A';
              
              return (
                <tr key={year.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-zinc-500">#{year.id}</td>
                  <td className="px-6 py-4 text-sm font-bold text-zinc-900">{schoolyear}</td>
                  <td className="px-6 py-4 text-sm text-zinc-600">{locale}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(year)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(year.documentId || year.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
