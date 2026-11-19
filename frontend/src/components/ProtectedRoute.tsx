import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingBlock } from './ui';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: string[];
}

const ROLE_HOME: Record<string, string> = {
  patient: '/portal',
  doctor: '/staff/doctor',
  receptionist: '/staff/reception',
};

function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingBlock label="Checking your session..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  const role = (user as unknown as { role?: string }).role || '';

  if (Array.isArray(roles) && roles.length > 0 && !roles.includes(role)) {
    const home = ROLE_HOME[role] || '/';
    return <Navigate to={home} replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;