import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import LandingPage from '@/pages/LandingPage';
import ShipperDashboard from '@/pages/ShipperDashboard';
import DriverDashboard from '@/pages/DriverDashboard';
import TrackingPage from '@/pages/TrackingPage';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

function SessionInitializer({ children }: { children: React.ReactNode }) {
  const { token, user, getProfile } = useAuth();
  const fetched = useRef(false);

  useEffect(() => {
    if (token && !user && !fetched.current) {
      fetched.current = true;
      getProfile().catch(() => {});
    }
  }, [token, user, getProfile]);

  return <>{children}</>;
}

function App() {
  return (
    <>
      <Toaster 
        position="top-right" 
        reverseOrder={false} 
        toastOptions={{
          style: {
            borderRadius: 'var(--radius-card)',
            border: 'var(--border-width) solid var(--color-border)',
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            color: 'var(--color-text-main)',
            background: 'var(--color-card)',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          }
        }}
      />
      <BrowserRouter>
        <SessionInitializer>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<Layout />}>
              {/* Shipper Dashboard Guard */}
              <Route element={<ProtectedRoute allowedRoles={['SHIPPER']} />}>
                <Route path="/shipper" element={<ShipperDashboard />} />
              </Route>

              {/* Driver Dashboard Guard */}
              <Route element={<ProtectedRoute allowedRoles={['DRIVER']} />}>
                <Route path="/driver" element={<DriverDashboard />} />
              </Route>

              {/* General Protected Routes (Any logged-in role can track) */}
              <Route element={<ProtectedRoute />}>
                <Route path="/track/:bookingId" element={<TrackingPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </SessionInitializer>
      </BrowserRouter>
    </>
  );
}

export default App;
