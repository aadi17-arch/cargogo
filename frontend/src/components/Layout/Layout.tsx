import { Outlet } from 'react-router-dom';
import Navbar from '@/components/Layout/Navbar';

function Layout() {
  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Navbar />
      <main className="w-full">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
