import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * ProtectedRoute component
 * Redirects to login if no token is found in localStorage
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem('jwt');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
