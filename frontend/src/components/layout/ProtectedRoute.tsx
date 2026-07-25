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
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white text-slate-800">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500 font-heading tracking-wide">
            Loading...
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
