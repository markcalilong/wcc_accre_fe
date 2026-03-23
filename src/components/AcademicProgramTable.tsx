import React from 'react';
import { Edit2, Trash2, Loader2 } from 'lucide-react';

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

interface Props {
  data: AcademicProgram[];
  loading: boolean;
  onEdit: (program: AcademicProgram) => void;
  onDelete: (id: string | number) => void;
}

export default function AcademicProgramTable({ data, loading, onEdit, onDelete }: Props) {
  if (loading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[32px] border border-zinc-100 shadow-sm">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-zinc-500 font-medium">Loading programs...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[32px] border border-zinc-100 shadow-sm">
        <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mb-4">
          <Trash2 className="w-8 h-8 text-zinc-300" />
        </div>
        <p className="text-zinc-500 font-medium text-lg">No academic programs found</p>
        <p className="text-zinc-400 text-sm mt-1">Add your first program to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50/50 border-bottom border-zinc-100">
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">ID</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Program Code</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Program Description</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Program Type</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {data.map((program) => {
              const programCode = program.attributes?.programCode || program.programCode || 'N/A';
              const programDesc = program.attributes?.programDesc || program.programDesc || 'N/A';
              const programType = program.program_type?.programTypeDesc || '';

              return (
                <tr key={program.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-zinc-500">#{program.id}</td>
                  <td className="px-6 py-4 text-sm font-bold text-zinc-900">{programCode}</td>
                  <td className="px-6 py-4 text-sm text-zinc-600">{programDesc}</td>
                  <td className="px-6 py-4">
                    {programType ? (
                      <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-100 uppercase tracking-wider">
                        {programType}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-300 italic">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(program)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(program.documentId || program.id)}
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
