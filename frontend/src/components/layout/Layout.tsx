import { useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';

function Layout() {
  const { token, user, getProfile } = useAuth();
  const fetched = useRef(false);

  useEffect(() => {
    // Only fetch once per mount when we have a token but no user yet
    if (token && !user && !fetched.current) {
      fetched.current = true;
      getProfile().catch(() => {
        // profile fetch failed (e.g. token expired) — logout handled by ProtectedRoute
      });
    }
  }, []); // Empty deps — run once on mount only

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-4 max-w-6xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
