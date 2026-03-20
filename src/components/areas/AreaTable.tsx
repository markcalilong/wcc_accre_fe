import React from 'react';
import { Eye, Edit2, Trash2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Area } from '../../types/area';

interface AreaTableProps {
  areas: Area[];
  onDelete: (id: string | number) => void;
  onEdit: (area: Area) => void;
}

export default function AreaTable({ areas, onDelete, onEdit }: AreaTableProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-100">
              <th className="px-8 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Area Name</th>
              <th className="px-8 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Description</th>
              <th className="px-8 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Program</th>
              <th className="px-8 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Academic Year</th>
              <th className="px-8 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {areas.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-12 text-center text-zinc-400">
                  No areas found. Create one to get started.
                </td>
              </tr>
            ) : (
              areas.map((area) => (
                <tr key={area.id} className="group hover:bg-zinc-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <span className="font-bold text-zinc-900">{area.area}</span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm text-zinc-500 line-clamp-1 max-w-xs">{area.areaDesc}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {(area.academic_program as any)?.attributes?.programCode || area.academic_program?.programCode || 'N/A'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-sm text-zinc-500">
                    {(area.academic_year as any)?.attributes?.schoolyear || area.academic_year?.schoolyear || 'N/A'}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/dashboard/areas/${area.documentId || area.id}`)}
                        className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(area)}
                        className="p-2 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(area.documentId || area.id)}
                        className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/dashboard/areas/${area.documentId || area.id}`)}
                        className="ml-2 p-2 text-zinc-300 group-hover:text-indigo-600 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
