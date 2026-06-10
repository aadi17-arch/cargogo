import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ShipperNavbarOptions } from './ShipperNavbarOptions';
import { DriverNavbarOptions } from './DriverNavbarOptions';

function Navbar() {
  const navigate = useNavigate();
  const { user, token, logout: authLogout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const logout = async () => {
    await authLogout();
    navigate('/login');
  };

  const NavOptions = () => {
    if (user?.role === 'SHIPPER') return <ShipperNavbarOptions />;
    if (user?.role === 'DRIVER') return <DriverNavbarOptions />;
    return null;
  };

  return (
    <nav className="bg-slate-900 text-white shadow-md sticky top-0 z-[500]">
      {/* Main bar */}
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="text-xl font-bold tracking-tight hover:text-blue-400 transition shrink-0">
          CargoGo
        </Link>

        {token && (
          <>
            {/* Desktop nav options — centre */}
            <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
              <NavOptions />
            </div>

            {/* Right side: username + logout + hamburger */}
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-gray-400 font-mono hidden sm:block">{user?.name}</span>
              <button
                onClick={logout}
                className="text-xs font-semibold bg-red-600/90 px-3 py-1.5 rounded-md hover:bg-red-700 transition"
              >
                Logout
              </button>
              {/* Hamburger — mobile only */}
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="md:hidden flex flex-col justify-center items-center gap-[5px] w-8 h-8 focus:outline-none"
                aria-label="Toggle menu"
              >
                <span className={`block w-5 h-0.5 bg-white transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
                <span className={`block w-5 h-0.5 bg-white transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
                <span className={`block w-5 h-0.5 bg-white transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Mobile dropdown */}
      {token && menuOpen && (
        <div className="md:hidden border-t border-slate-700 bg-slate-800 px-6 py-4 space-y-1">
          <p className="text-xs text-gray-400 font-mono mb-3">{user?.name}</p>
          <NavOptions />
        </div>
      )}
    </nav>
  );
}

export default Navbar;
