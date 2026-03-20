import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { Loader2, LogOut, LayoutDashboard, FileText, Users, GraduationCap, BookOpen, Microscope, Building2, UserCircle, Share2, Settings, BarChart3, Layers } from 'lucide-react';

interface UserData {
  id: number;
  username: string;
  email: string;
  role?: {
    name: string;
    type?: string;
    description?: string;
  };
}

const SIDEBAR_ITEMS = [
  { id: 'area', label: 'AREA Management', icon: LayoutDashboard, path: '/dashboard/areas' },
  { id: 'area-monitoring', label: 'Area Monitoring', icon: BarChart3, path: '/dashboard/area-monitoring' },
  { id: 'academic-years', label: 'Academic Year Management', icon: FileText, path: '/dashboard/academic-years' },
  { id: 'academic-programs', label: 'Academic Program Management', icon: GraduationCap, path: '/dashboard/academic-programs' },
  { id: 'consolidate', label: 'Consolidate Files', icon: Layers, path: '/dashboard/consolidate' },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const filteredSidebarItems = useMemo(() => {
    if (!userData) return [];

    const roleName = userData.role?.name?.toLowerCase();
    const roleType = userData.role?.type?.toLowerCase();

    const isDean = roleName === 'dean' || roleType === 'dean';
    const isAuthenticated = roleName === 'authenticated' || roleType === 'authenticated';

    // Dean and Authenticated roles get full access
    if (isDean || isAuthenticated) {
      return SIDEBAR_ITEMS;
    }

    // Faculty and other roles only see Area Monitoring (upload/view only)
    return SIDEBAR_ITEMS.filter(item => item.id === 'area-monitoring');
  }, [userData]);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('jwt');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const data = await api.getMe(token);
        setUserData(data);
      } catch (err: any) {
        if (err.message.includes('invalid') || err.message.includes('expired')) {
          localStorage.removeItem('jwt');
          localStorage.removeItem('user');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-zinc-500 font-medium">Loading System...</p>
        </div>
      </div>
    );
  }

  const activeItem = filteredSidebarItems.find(item => location.pathname.startsWith(item.path || '')) || filteredSidebarItems[0];

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-[#1a2b4b] text-white flex flex-col shrink-0 overflow-y-auto">
        <div className="p-8">
          <h1 className="text-2xl font-bold leading-tight tracking-tight">
            WCC PACUCOA <br /> Documentation and <br /> Compliance System
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-1 pb-8">
          {filteredSidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path || '/dashboard')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-3 ${
                activeItem?.id === item.id
                  ? 'bg-[#4a86f7] text-white shadow-lg shadow-blue-900/20'
                  : 'text-zinc-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className={`w-4 h-4 ${activeItem?.id === item.id ? 'text-white' : 'text-zinc-400'}`} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold">
              {userData?.username.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{userData?.username}</p>
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest">{userData?.role?.name}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-zinc-50/50">
        <div className="p-12 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
