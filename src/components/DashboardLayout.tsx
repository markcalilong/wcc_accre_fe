import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { Loader2, LogOut, LayoutDashboard, FileText, Users, GraduationCap, BarChart3, Layers, ChevronDown, ChevronUp, FolderOpen, Shield } from 'lucide-react';
import { hasManagementAccess, getUserPersonelRole } from '../utils/roles';

interface UserData {
  id: number;
  username: string;
  email: string;
  role?: {
    name: string;
    type?: string;
    description?: string;
  };
  personel_role?: {
    id: number;
    documentId?: string;
    role: string;
    description?: string;
    coveredAreas?: { id: number; area_with_permission: string }[];
    coveredPrograms?: { id: number; academic_program?: { id: number; programCode?: string; programDesc?: string } }[];
  };
}

interface AreaItem {
  id: number;
  documentId?: string;
  area: string;
}

const SIDEBAR_ITEMS = [
  { id: 'area', label: 'AREA Management', icon: LayoutDashboard, path: '/dashboard/areas' },
  { id: 'area-monitoring', label: 'Area Monitoring', icon: BarChart3, path: '/dashboard/area-monitoring' },
  { id: 'academic-years', label: 'Academic Year Management', icon: FileText, path: '/dashboard/academic-years' },
  { id: 'academic-programs', label: 'Academic Program Management', icon: GraduationCap, path: '/dashboard/academic-programs' },
  { id: 'consolidate', label: 'Consolidate Files', icon: Layers, path: '/dashboard/consolidate' },
  { id: 'users', label: 'User Management', icon: Users, path: '/dashboard/users' },
  { id: 'roles', label: 'Role Management', icon: Shield, path: '/dashboard/roles' },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [areas, setAreas] = useState<AreaItem[]>([]);
  const [areasExpanded, setAreasExpanded] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Derive personel role name for permission checks
  const personelRoleName = useMemo(() => {
    if (!userData) return '';
    return getUserPersonelRole(userData);
  }, [userData]);

  const isAdmin = useMemo(() => {
    return hasManagementAccess(personelRoleName);
  }, [personelRoleName]);

  const filteredSidebarItems = useMemo(() => {
    if (!userData) return [];

    // Management roles get full sidebar access
    if (isAdmin) {
      return SIDEBAR_ITEMS;
    }

    // All other roles only see Area Monitoring (upload/view)
    return SIDEBAR_ITEMS.filter(item => item.id === 'area-monitoring');
  }, [userData, isAdmin]);

  // Filter sidebar areas based on user's coveredAreas
  const filteredAreas = useMemo(() => {
    if (!userData) return areas;
    // Management roles (Admin/Dean) see all areas
    if (isAdmin) return areas;
    // Other roles: filter by coveredAreas from personel_role
    const coveredAreaNames = userData.personel_role?.coveredAreas?.map(
      a => a.area_with_permission.toLowerCase().trim()
    ) || [];
    if (coveredAreaNames.length === 0) return []; // No areas assigned = see nothing
    return areas.filter(area =>
      coveredAreaNames.includes(area.area.toLowerCase().trim())
    );
  }, [userData, areas, isAdmin]);

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

        // Fetch areas for sidebar
        const areasData = await api.getAreas(token);
        setAreas(areasData.map((a: any) => ({
          id: a.id,
          documentId: a.documentId,
          area: a.area,
        })));
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
  const activeAreaId = location.pathname.match(/\/dashboard\/areas\/(.+)/)?.[1];

  // Display role: prefer personel_role, fallback to built-in role
  const displayRole = userData?.personel_role?.role || userData?.role?.name || 'Unknown';

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
          {/* Dynamic AREAS section */}
          {filteredAreas.length > 0 && (
            <div className="mb-2">
              <button
                onClick={() => setAreasExpanded(!areasExpanded)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:text-zinc-200 transition-all"
              >
                <span className="flex items-center gap-2">
                  <FolderOpen className="w-3.5 h-3.5" />
                  Areas
                </span>
                {areasExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {areasExpanded && (
                <div className="space-y-0.5 mt-1">
                  {filteredAreas.map((area) => {
                    const areaPath = `/dashboard/areas/${area.documentId || area.id}`;
                    const isActive = activeAreaId === (area.documentId || String(area.id));
                    return (
                      <button
                        key={area.id}
                        onClick={() => navigate(areaPath)}
                        className={`w-full text-left px-4 py-2 pl-8 rounded-lg text-xs font-medium transition-all flex items-center gap-2.5 ${
                          isActive
                            ? 'bg-[#4a86f7] text-white shadow-lg shadow-blue-900/20'
                            : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-white' : 'bg-zinc-500'}`} />
                        <span className="truncate">{area.area}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          {filteredAreas.length > 0 && (
            <div className="border-t border-white/10 my-3" />
          )}

          {/* Management items */}
          <p className="px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Management</p>
          {filteredSidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path || '/dashboard')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-3 ${
                activeItem?.id === item.id && !activeAreaId
                  ? 'bg-[#4a86f7] text-white shadow-lg shadow-blue-900/20'
                  : 'text-zinc-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className={`w-4 h-4 ${activeItem?.id === item.id && !activeAreaId ? 'text-white' : 'text-zinc-400'}`} />
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
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest">{displayRole}</p>
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
