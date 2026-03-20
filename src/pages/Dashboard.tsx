import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Loader2 } from 'lucide-react';

interface UserData {
  id: number;
  username: string;
  email: string;
  role?: {
    name: string;
    description?: string;
  };
}

export default function Dashboard() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-zinc-500 font-medium">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h2 className="text-4xl font-bold text-[#4a86f7] mb-6">
          Welcome back, {userData?.username}!
        </h2>
        <p className="text-zinc-500 text-lg leading-relaxed max-w-3xl">
          You are logged in as <span className="font-bold text-zinc-900">{userData?.role?.name}</span>.{' '}
          Use the sidebar to navigate through the different management modules of the WCC PACUCOA Documentation and Compliance System.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          </div>
          <h3 className="font-bold text-zinc-900 mb-2">Recent Activity</h3>
          <p className="text-sm text-zinc-500">No recent activities found in your account.</p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          </div>
          <h3 className="font-bold text-zinc-900 mb-2">System Status</h3>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm font-medium text-emerald-600">All systems operational</span>
          </div>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-6">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          </div>
          <h3 className="font-bold text-zinc-900 mb-2">Notifications</h3>
          <p className="text-sm text-zinc-500">You have no new notifications.</p>
        </div>
      </div>
    </div>
  );
}
