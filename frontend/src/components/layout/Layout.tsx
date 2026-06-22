import { Outlet } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';

function Layout() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F9FA' }}>
      <Navbar />
      <main className="p-6 max-w-[1600px] mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
