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

// Sleek brand fallback loading indicator for lazy routes
function SuspenseLoader() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 animate-fade-in">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-lg">
          <span className="text-sm font-black text-indigo-400 font-heading">CG</span>
        </div>
        <div className="absolute -inset-1.5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-xl animate-spin"></div>
      </div>
      <p className="text-xs font-bold tracking-wider text-slate-400 uppercase font-heading">
        Loading module...
      </p>
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
