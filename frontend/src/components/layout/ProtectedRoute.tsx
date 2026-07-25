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
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 text-white animate-fade-in">
        <div className="relative flex flex-col items-center space-y-6">
          {/* Ambient Glow */}
          <div className="absolute -inset-4 bg-indigo-500/20 rounded-full blur-xl animate-pulse"></div>
          
          {/* Logo Icon & Spinner Ring */}
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex items-center justify-center">
              <span className="text-2xl font-black tracking-tighter text-indigo-400 font-heading">
                Cargo<span className="text-emerald-400">Go</span>
              </span>
            </div>
            <div className="absolute -inset-2 border-2 border-indigo-500/30 border-t-indigo-500 rounded-2xl animate-spin"></div>
          </div>

          {/* Loading Label */}
          <div className="text-center space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 font-heading">
              CargoGo Logistics
            </p>
            <p className="text-sm font-medium text-slate-300 animate-pulse font-body">
              Securing Session...
            </p>
          </div>
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
