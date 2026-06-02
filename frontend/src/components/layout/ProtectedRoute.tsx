import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedRoles?: ('SHIPPER' | 'DRIVER')[];
}

function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect unauthorized users to their correct dashboard
    return <Navigate to={user.role === 'SHIPPER' ? '/shipper' : '/driver'} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
