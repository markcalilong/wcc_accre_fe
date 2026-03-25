import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { Area } from '../../types/area';
import { sortAreasByNumber } from '../../utils/sorting';
import AreaTable from '../../components/areas/AreaTable';
import AreaModal from '../../components/areas/AreaModal';

export default function AreaListPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);

  const fetchAreas = useCallback(async () => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const data = await api.getAreas(token);
      setAreas(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch areas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

  const handleCreateArea = () => {
    setSelectedArea(null);
    setIsModalOpen(true);
  };

  const handleEditArea = (area: Area) => {
    setSelectedArea(area);
    setIsModalOpen(true);
  };

  const handleDeleteArea = async (id: string | number) => {
    if (!window.confirm('Are you sure you want to delete this area?')) return;

    const token = localStorage.getItem('jwt');
    if (!token) return;

    try {
      await api.deleteArea(token, id);
      setAreas(areas.filter(a => (a.documentId || a.id) !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete area');
    }
  };

  const filteredAreas = areas.filter(area => {
    const searchLower = searchQuery.toLowerCase();
    const areaName = (area.area || '').toLowerCase();
    const areaDesc = (area.areaDesc || '').toLowerCase();
    const campusStr = (area.campus?.campusDesc || '').toLowerCase();

    return areaName.includes(searchLower) || areaDesc.includes(searchLower) || campusStr.includes(searchLower);
  }).sort(sortAreasByNumber);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-zinc-900 tracking-tight">Area Management</h1>
          <p className="text-zinc-500 mt-2 text-lg">Manage and organize academic areas and criteria.</p>
        </div>
        <button
          onClick={handleCreateArea}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[#4a86f7] hover:bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Create New Area
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search areas, programs, or descriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white border border-zinc-100 text-zinc-600 font-bold rounded-2xl hover:bg-zinc-50 transition-all shadow-sm">
            <Filter className="w-5 h-5" />
            Filter
          </button>
          <button 
            onClick={fetchAreas}
            className="p-4 bg-white border border-zinc-100 text-zinc-400 hover:text-indigo-600 rounded-2xl hover:bg-zinc-50 transition-all shadow-sm"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-zinc-500 font-medium">Loading areas...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-3xl bg-rose-50 border border-rose-100 text-center space-y-4">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-rose-900">Failed to load areas</h3>
            <p className="text-rose-600/80">{error}</p>
          </div>
          <button 
            onClick={fetchAreas}
            className="px-6 py-2 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all"
          >
            Try Again
          </button>
        </div>
      ) : (
        <AreaTable 
          areas={filteredAreas} 
          onDelete={handleDeleteArea}
          onEdit={handleEditArea}
        />
      )}

      <AreaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchAreas}
        area={selectedArea}
      />
    </div>
  );
}
