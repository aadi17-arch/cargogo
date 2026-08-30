import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBooking } from '@/hooks/useBooking';
import {
  FAQModal,
  RatesModal,
  ServicesModal,
  SupportModal,
  ActiveRunsModal,
  DriverStatsModal,
  TrackModal,
  ShippersModal,
  DriversModal
} from './NavbarModals';

interface NavbarProps {
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
}

export default function Navbar({
  userName: propUserName = 'John Shipper',
  userRole: propUserRole = 'SHIPPER',
  onLogout
}: NavbarProps) {
  const navigate = useNavigate();
  const { user: authUser, token, logout: authLogout } = useAuth();
  const { bookings, fetchMyBookings } = useBooking();

  const name = authUser?.name || propUserName;
  const role = authUser?.role || propUserRole;

  const [activeLink, setActiveLink] = useState('New Shipment');
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [logoutHovered, setLogoutHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [showShippersModal, setShowShippersModal] = useState(false);
  const [showDriversModal, setShowDriversModal] = useState(false);
  const [trackingIdInput, setTrackingIdInput] = useState('');

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  const [showRates, setShowRates] = useState(false);
  const [showServices, setShowServices] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showActiveRuns, setShowActiveRuns] = useState(false);
  const [showDriverStats, setShowDriverStats] = useState(false);

  useEffect(() => {
    if (token && (showActiveRuns || showDriverStats)) {
      fetchMyBookings().catch(err => console.error('Failed to load bookings in navbar', err));
    }
  }, [showActiveRuns, showDriverStats, token]);

  const activeShipperRuns = bookings.filter(
    (b: any) => b.status !== 'DELIVERED' && b.status !== 'COMPLETED' && b.status !== 'CANCELLED'
  );
  const completedDriverJobs = bookings.filter((b: any) => b.status === 'DELIVERED');
  const driverEarnings = completedDriverJobs.reduce((sum: number, b: any) => sum + (b.price || 0), 0);
  const activeDriverJobs = bookings.filter(
    (b: any) => b.status === 'ACCEPTED' || b.status === 'IN_TRANSIT'
  );

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    } else {
      await authLogout();
      navigate('/login');
    }
  };

  const getNavLinks = () => {
    if (!token) {
      return ['Pricing Plans', 'Track Shipment', 'For Shippers', 'For Drivers', 'Service Areas', 'Help Center'];
    }
    if (role === 'DRIVER') {
      return ['Overview', 'Performance', 'Help Center'];
    }
    return ['New Shipment', 'Active Shipments', 'Pricing Plans', 'Service Areas', 'Help Center'];
  };

  const navLinks = getNavLinks();

  const handleLinkClick = (linkName: string) => {
    setActiveLink(linkName);
    setMenuOpen(false);
    if (linkName === 'New Shipment') {
      navigate('/shipper');
      return;
    }
    if (linkName === 'Overview') {
      navigate('/driver');
      return;
    }
    if (linkName === 'Active Shipments') {
      setShowActiveRuns(true);
      return;
    }
    if (linkName === 'Performance') {
      setShowDriverStats(true);
      return;
    }

    if (token) {
      if (linkName === 'Help Center') {
        setShowSupport(true);
        return;
      }
      if (linkName === 'Pricing Plans') {
        setShowRates(true);
        return;
      }
      if (linkName === 'Service Areas') {
        setShowServices(true);
        return;
      }
    }

    if (linkName === 'Track Shipment') {
      setShowTrackModal(true);
      return;
    }
    if (linkName === 'For Shippers') {
      setShowShippersModal(true);
      return;
    }
    if (linkName === 'For Drivers') {
      setShowDriversModal(true);
      return;
    }

    const sectionIds: Record<string, string> = {
      'Pricing Plans': 'pricing',
      'Service Areas': 'services',
      'Help Center': 'support'
    };

    const targetId = sectionIds[linkName];
    if (targetId) {
      if (window.location.pathname !== '/') {
        navigate(`/#${targetId}`);
      } else {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-[500] w-full h-16 bg-[var(--color-primary)] border-b border-white/15 flex items-center justify-between px-4 md:px-6 box-border font-body text-white">
        <div className="flex items-center gap-3 h-full">
          <div 
            onClick={() => navigate(token ? (role === 'DRIVER' ? '/driver' : '/shipper') : '/')} 
            className="flex items-center cursor-pointer select-none group font-tech-space"
          >
            <span className="font-black text-xs md:text-sm text-[var(--color-primary)] bg-white px-2 py-0.5 rounded-[var(--radius-card)] tracking-tight transition-all duration-300 group-hover:scale-105 shadow-sm">
              Cargo
            </span>
            <span className="font-bold text-lg md:text-xl text-white ml-1.5 tracking-tight group-hover:opacity-90 transition-opacity">
              Go
            </span>
          </div>
        </div>

        {!isMobile && (
          <div className="flex items-center gap-5 h-full">
            {navLinks.map((link) => {
              const isActive = activeLink === link;
              const isHovered = hoveredLink === link;
              return (
                <button
                  key={link}
                  onClick={() => handleLinkClick(link)}
                  onMouseEnter={() => setHoveredLink(link)}
                  onMouseLeave={() => setHoveredLink(null)}
                  className={`relative px-3 py-2 text-xs font-semibold tracking-wide transition-colors bg-transparent border-none outline-none cursor-pointer ${
                    isActive || isHovered ? 'text-white' : 'text-white/75'
                  }`}
                >
                  {link}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-4 h-full">
          {token ? (
            <div className="flex items-center gap-3">
              {role === 'DRIVER' && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-xs font-bold font-heading">
                  <span className="text-white font-black">₹{Math.round(driverEarnings)}</span>
                  <span className="text-slate-300 text-[11px] font-normal">Earned</span>
                </div>
              )}
              <span className="text-xs font-bold text-white/80 font-heading tracking-wide hidden sm:inline">
                {name}
              </span>
              <button
                onClick={handleLogout}
                onMouseEnter={() => setLogoutHovered(true)}
                onMouseLeave={() => setLogoutHovered(false)}
                className={`h-8 px-3.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  logoutHovered 
                    ? 'bg-rose-600 text-white shadow-sm' 
                    : 'bg-white/10 text-white border border-white/20'
                }`}
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/login')}
                className="h-8 px-3.5 text-xs font-semibold text-white/90 hover:text-white bg-transparent hover:bg-white/5 border border-white/10 rounded-lg transition-colors cursor-pointer"
              >
                Log In
              </button>
              <button
                onClick={() => navigate('/register')}
                className="h-8 px-3.5 text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                Register
              </button>
            </div>
          )}

          {isMobile && (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/90 hover:text-white bg-transparent hover:bg-white/5 border border-white/10 cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          )}
        </div>
      </nav>

      {isMobile && menuOpen && (
        <div className="fixed top-16 left-0 right-0 bg-[var(--color-primary)] border-b border-white/10 z-[499] flex flex-col p-4 gap-2 shadow-lg">
          {navLinks.map((link) => (
            <button
              key={link}
              onClick={() => handleLinkClick(link)}
              className={`w-full text-left py-3 px-4 text-sm font-semibold rounded-lg transition-colors ${
                activeLink === link ? 'bg-white/10 text-white' : 'text-white/80 hover:bg-white/5 hover:text-white'
              }`}
            >
              {link}
            </button>
          ))}
        </div>
      )}

      <FAQModal isOpen={showFAQ} onClose={() => setShowFAQ(false)} />
      <RatesModal isOpen={showRates} onClose={() => setShowRates(false)} />
      <ServicesModal isOpen={showServices} onClose={() => setShowServices(false)} />
      <SupportModal isOpen={showSupport} onClose={() => setShowSupport(false)} />
      <ActiveRunsModal 
        isOpen={showActiveRuns} 
        onClose={() => setShowActiveRuns(false)} 
        activeRuns={activeShipperRuns} 
      />
      <DriverStatsModal
        isOpen={showDriverStats}
        onClose={() => setShowDriverStats(false)}
        driverEarnings={driverEarnings}
        completedCount={completedDriverJobs.length}
        activeCount={activeDriverJobs.length}
      />
      <TrackModal
        isOpen={showTrackModal}
        onClose={() => setShowTrackModal(false)}
        trackingId={trackingIdInput}
        setTrackingId={setTrackingIdInput}
        onSubmit={(e) => {
          e.preventDefault();
          if (trackingIdInput.trim()) {
            setShowTrackModal(false);
            navigate(`/track/${trackingIdInput.trim()}`);
          }
        }}
      />
      <ShippersModal
        isOpen={showShippersModal}
        onClose={() => setShowShippersModal(false)}
        onSignUp={() => {
          setShowShippersModal(false);
          navigate('/register');
        }}
      />
      <DriversModal
        isOpen={showDriversModal}
        onClose={() => setShowDriversModal(false)}
        onJoin={() => {
          setShowDriversModal(false);
          navigate('/register');
        }}
      />
    </>
  );
}
