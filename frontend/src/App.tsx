import { useEffect, useRef, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const ShipperDashboard = lazy(() => import('@/pages/ShipperDashboardPage'));
const DriverDashboard = lazy(() => import('@/pages/DriverDashboardPage'));
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


function SuspenseLoader() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
      <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs font-medium text-slate-500 font-heading">
        Loading...
      </p>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
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
                {}
                <Route element={<ProtectedRoute allowedRoles={['SHIPPER']} />}>
                  <Route path="/shipper" element={<ShipperDashboard />} />
                </Route>

                {}
                <Route element={<ProtectedRoute allowedRoles={['DRIVER']} />}>
                  <Route path="/driver" element={<DriverDashboard />} />
                </Route>

                {}
                <Route element={<ProtectedRoute />}>
                  <Route path="/track/:bookingId" element={<TrackingPage />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </SessionInitializer>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
