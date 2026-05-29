import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

function Layout() {
  return (
    <div className="min-h-screen bg-[#F5F4F0]">
      <Navbar />
      <main className="p-4 sm:p-6 max-w-[1360px] mx-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
