import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBooking } from '@/hooks/useBooking';
import FAQModal from '../modals/FAQModal';
import PricingModal from '../modals/PricingModal';
import ServicesModal from '../modals/ServicesModal';
import SupportModal from '../modals/SupportModal';
import ActiveRunsModal from '../modals/ActiveRunsModal';
import DriverStatsModal from '../modals/DriverStatsModal';
import BaseModal from '../ui/BaseModal';

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

  const [activeLink, setActiveLink] = useState('Book Delivery');
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

  // Modal active states
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
      return ['Pricing', 'Track Shipment', 'For Shippers', 'For Drivers', 'Services', 'FAQ', 'Support'];
    }
    if (role === 'DRIVER') {
      return ['Dashboard', 'Performance', 'FAQ', 'Support'];
    }
    return ['Book Delivery', 'Active Deliveries', 'Pricing', 'Services', 'FAQ', 'Support'];
  };

  const navLinks = getNavLinks();

  const handleLinkClick = (linkName: string) => {
    setActiveLink(linkName);
    setMenuOpen(false);
    if (linkName === 'Book Delivery') {
      navigate('/shipper');
      return;
    }
    if (linkName === 'Dashboard') {
      navigate('/driver');
      return;
    }
    if (linkName === 'Active Deliveries') {
      setShowActiveRuns(true);
      return;
    }
    if (linkName === 'Performance') {
      setShowDriverStats(true);
      return;
    }

    if (token) {
      if (linkName === 'FAQ') {
        setShowFAQ(true);
        return;
      }
      if (linkName === 'Support') {
        setShowSupport(true);
        return;
      }
      if (linkName === 'Pricing') {
        setShowRates(true);
        return;
      }
      if (linkName === 'Services') {
        setShowServices(true);
        return;
      }
    }

    // Guest routing / hash triggers
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
      'Pricing': 'pricing',
      'Services': 'services',
      'FAQ': 'faq',
      'Support': 'support'
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
        {/* Brand Logo */}
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

          {/* Vertical Separator */}
          {token && (
            <>
              <div className="w-[1px] h-5 bg-white/20" />
              <div className="flex flex-col justify-center">
                <span className="text-[10px] font-bold text-white/50 tracking-wider uppercase leading-none mb-0.5">
                  Logged In As
                </span>
                <span className="text-xs font-bold leading-none truncate max-w-[120px]">
                  {name}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Center links - Desktop */}
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

        {/* Right logout / sign in buttons */}
        <div className="flex items-center gap-4 h-full">
          {token ? (
            <button
              onClick={handleLogout}
              onMouseEnter={() => setLogoutHovered(true)}
              onMouseLeave={() => setLogoutHovered(false)}
              className={`px-4 py-2 text-xs font-bold rounded-[var(--radius-button)] transition-all flex items-center gap-1.5 ${
                logoutHovered 
                  ? 'bg-red-600 text-white shadow-sm' 
                  : 'bg-white/10 text-white border border-white/20'
              }`}
            >
              Logout
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-xs font-semibold text-white/90 hover:text-white bg-transparent hover:bg-white/5 border border-white/10 rounded-[var(--radius-button)] transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-4 py-2 text-xs font-bold bg-white text-[var(--color-primary)] hover:bg-white/90 rounded-[var(--radius-button)] transition-colors shadow-sm"
              >
                Register
              </button>
            </div>
          )}

          {/* Mobile hamburger menu button */}
          {isMobile && (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded-md text-white/90 hover:text-white bg-transparent hover:bg-white/5 border border-white/10 cursor-pointer"
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

      {/* Mobile Drawer Menu */}
      {isMobile && menuOpen && (
        <div className="fixed top-16 left-0 right-0 bg-[var(--color-primary)] border-b border-white/10 z-[499] flex flex-col p-4 gap-2 shadow-lg">
          {navLinks.map((link) => (
            <button
              key={link}
              onClick={() => handleLinkClick(link)}
              className={`w-full text-left py-2.5 px-4 text-sm font-semibold rounded-lg transition-colors ${
                activeLink === link ? 'bg-white/10 text-white' : 'text-white/80 hover:bg-white/5 hover:text-white'
              }`}
            >
              {link}
            </button>
          ))}
        </div>
      )}

      {/* Modals integration */}
      <FAQModal isOpen={showFAQ} onClose={() => setShowFAQ(false)} />
      <PricingModal isOpen={showRates} onClose={() => setShowRates(false)} />
      <ServicesModal isOpen={showServices} onClose={() => setShowServices(false)} />
      <SupportModal isOpen={showSupport} onClose={() => setShowSupport(false)} />
      <ActiveRunsModal 
        isOpen={showActiveRuns} 
        onClose={() => setShowActiveRuns(false)} 
        activeShipperRuns={activeShipperRuns} 
      />
      <DriverStatsModal
        isOpen={showDriverStats}
        onClose={() => setShowDriverStats(false)}
        driverEarnings={driverEarnings}
        completedCount={completedDriverJobs.length}
        activeCount={activeDriverJobs.length}
      />

      {/* Guest Track Modal */}
      <BaseModal isOpen={showTrackModal} onClose={() => setShowTrackModal(false)} title="Quick Track Shipment">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (trackingIdInput.trim()) {
              setShowTrackModal(false);
              navigate(`/track/${trackingIdInput.trim()}`);
            }
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500">
              Enter your Booking Tracking ID:
            </label>
            <input 
              type="text" 
              placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
              value={trackingIdInput}
              onChange={(e) => setTrackingIdInput(e.target.value)}
              className="w-full p-3 bg-white text-slate-800 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm transition-all shadow-sm"
              required 
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button 
              type="button"
              onClick={() => setShowTrackModal(false)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-755 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              Track Status
            </button>
          </div>
        </form>
      </BaseModal>

      {/* Guest For Shippers Modal */}
      <BaseModal isOpen={showShippersModal} onClose={() => setShowShippersModal(false)} title="CargoGo For Shippers">
        <div className="space-y-4">
          <p className="text-xs text-slate-500 leading-normal">
            Ship cargo seamlessly with enterprise-grade logistics tools built for businesses and individuals:
          </p>
          <ul className="space-y-2 text-xs text-slate-600 pl-4 list-disc">
            <li><strong>Volumetric Math Engine</strong>: Input physical package sizes to automatically generate transparent estimates based on size or weight.</li>
            <li><strong>OTP Security Handshakes</strong>: High-value cargo keys are shared directly with the driver to authenticate both pickup and deliveries safely.</li>
            <li><strong>Instant Driver Matching</strong>: Post your shipment and get automatically connected with vetted local truck and tempo drivers immediately.</li>
          </ul>
          <div className="flex gap-2 justify-end pt-4">
            <button 
              onClick={() => setShowShippersModal(false)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg transition-colors"
            >
              Close
            </button>
            <button 
              onClick={() => {
                setShowShippersModal(false);
                navigate('/register');
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              Sign Up as Shipper
            </button>
          </div>
        </div>
      </BaseModal>

      {/* Guest For Drivers Modal */}
      <BaseModal isOpen={showDriversModal} onClose={() => setShowDriversModal(false)} title="CargoGo For Drivers">
        <div className="space-y-4">
          <p className="text-xs text-slate-500 leading-normal">
            Earn more money and maximize your vehicle efficiency by partner dispatching with CargoGo:
          </p>
          <ul className="space-y-2 text-xs text-slate-600 pl-4 list-disc">
            <li><strong>Smart Route Optimization</strong>: Accept multiple nearby freight runs and get instant navigation route planning directly to save fuel.</li>
            <li><strong>Prompt Digital Payouts</strong>: Earnings update instantly on your dashboard when a shipper confirms the drop-off verification key.</li>
            <li><strong>Flexible Schedule</strong>: Work on your own terms. Select runs matching your tempo, pickup truck, or container vehicle type.</li>
          </ul>
          <div className="flex gap-2 justify-end pt-4">
            <button 
              onClick={() => setShowDriversModal(false)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg transition-colors"
            >
              Close
            </button>
            <button 
              onClick={() => {
                setShowDriversModal(false);
                navigate('/register');
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              Join as Driver Partner
            </button>
          </div>
        </div>
      </BaseModal>
    </>
  );
}
