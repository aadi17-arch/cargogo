import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  allowedRoles?: ('SHIPPER' | 'DRIVER')[];
}

function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { token, user } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If token is present but user profile is not loaded yet, show a premium loading state
  // to avoid exposing any dashboards prematurely.
  if (token && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--color-primary)] mx-auto"></div>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>
            Verifying session...
          </p>
        </div>
      </div>
    );
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect unauthorized users to their correct dashboard
    return <Navigate to={user.role === 'SHIPPER' ? '/shipper' : '/driver'} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
