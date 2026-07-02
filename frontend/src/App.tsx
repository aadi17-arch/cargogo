import { useEffect, useRef, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

// Eager load authentications and landing (main entry pages)
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import LandingPage from '@/pages/LandingPage';

// Lazy load dashboards & tracking pages to optimize initial bundle sizes
const ShipperDashboard = lazy(() => import('@/pages/ShipperDashboard'));
const DriverDashboard = lazy(() => import('@/pages/DriverDashboard'));
const TrackingPage = lazy(() => import('@/pages/TrackingPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

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

// Simple fallback loading indicator
function SuspenseLoader() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-xs font-bold text-slate-500 font-heading">Loading portal components...</p>
    </div>
  );
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
          <Suspense fallback={<SuspenseLoader />}>
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

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </SessionInitializer>
      </BrowserRouter>
    </>
  );
}

export default App;
