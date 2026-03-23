import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AcademicYears from './pages/AcademicYears';
import AcademicPrograms from './pages/AcademicPrograms';
import AreaListPage from './pages/areas/AreaListPage';
import AreaDetailPage from './pages/areas/AreaDetailPage';
import AreaMonitoring from './pages/AreaMonitoring';
import ConsolidateFiles from './pages/ConsolidateFiles';
import UserManagement from './pages/UserManagement';
import RoleManagement from './pages/RoleManagement';
import PendingTasks from './pages/PendingTasks';
import CampusManagement from './pages/CampusManagement';
import SemesterManagement from './pages/SemesterManagement';
import ProgramTypeManagement from './pages/ProgramTypeManagement';
import VisitTypeManagement from './pages/VisitTypeManagement';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import { ArrowLeft } from 'lucide-react';

// Placeholder components for new routes
const UploadPlaceholder = () => (
  <ProtectedRoute>
    <div className="pt-24 min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Upload PDFs</h1>
        <p className="text-zinc-500 mb-8">This feature is coming soon.</p>
        <Link 
          to="/dashboard" 
          className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-zinc-200 rounded-xl text-zinc-600 font-bold hover:bg-zinc-50 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  </ProtectedRoute>
);

const DocumentsPlaceholder = () => (
  <ProtectedRoute>
    <div className="pt-24 min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Department Documents</h1>
        <p className="text-zinc-500 mb-8">This feature is coming soon.</p>
        <Link 
          to="/dashboard" 
          className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-zinc-200 rounded-xl text-zinc-600 font-bold hover:bg-zinc-50 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  </ProtectedRoute>
);

/**
 * Main Application Component
 * Handles routing for Landing, Login, Register, and Dashboard
 */
export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/academic-years" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <AcademicYears />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/academic-programs" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <AcademicPrograms />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/areas" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <AreaListPage />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/areas/:id" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <AreaDetailPage />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route
          path="/dashboard/area-monitoring"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <AreaMonitoring />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/consolidate"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ConsolidateFiles />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/users"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <UserManagement />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/roles"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <RoleManagement />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/campuses"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <CampusManagement />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/semesters"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <SemesterManagement />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/program-types"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ProgramTypeManagement />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/visit-types"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <VisitTypeManagement />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/pending-tasks"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <PendingTasks />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/upload" element={<UploadPlaceholder />} />
        <Route path="/documents" element={<DocumentsPlaceholder />} />

        {/* Default Redirects */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
