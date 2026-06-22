import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBooking } from '@/hooks/useBooking';


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

  // Use values from auth context if available, otherwise fall back to props
  const name = authUser?.name || propUserName;
  const role = authUser?.role || propUserRole;

  // Active link state
  const [activeLink, setActiveLink] = useState('Book Delivery');
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [logoutHovered, setLogoutHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // New Guest state Modals & inputs
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [showShippersModal, setShowShippersModal] = useState(false);
  const [showDriversModal, setShowDriversModal] = useState(false);
  const [trackingIdInput, setTrackingIdInput] = useState('');

  // Track window width for mobile responsiveness
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  // Modal states
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

  // Derived lists
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

  // Define navigation options based on role
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

    // Intercept clicks for logged-in users to display local overlay modals instead of landing page redirects
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

    const sectionIds: Record<string, string> = {
      'Pricing': 'pricing',
      'Track Shipment': 'track',
      'For Shippers': 'shippers',
      'For Drivers': 'drivers',
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

  // Color constants for the eye-friendly steel blue theme
  const COLORS = {
    espresso: 'var(--color-primary)',         // Solid primary blue navbar background
    surface: 'var(--color-primary)',             
    cream: '#FFFFFF',                         // White text for active states
    mutedCream: 'rgba(255, 255, 255, 0.75)',  // Semi-transparent white for inactive link text
    amber: '#FFFFFF',                         // White for active border/accents
    border: 'rgba(255, 255, 255, 0.15)',      // Muted white border
  };

  // Styles
  const navStyle: React.CSSProperties = {
    position: 'sticky',
    top: 0,
    zIndex: 500,
    width: '100%',
    height: '64px',
    backgroundColor: COLORS.espresso,
    borderBottom: `1px solid ${COLORS.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: isMobile ? '16px' : '24px',
    paddingRight: '24px',
    boxSizing: 'border-box',
    fontFamily: 'var(--font-body)',
  };



  const centerNavStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    height: '100%',
  };

  const rightNavStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    height: '100%',
    backgroundColor: 'transparent',
    boxSizing: 'border-box',
  };

  const userInfoStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    lineHeight: '1.2',
  };

  const userNameStyle: React.CSSProperties = {
    fontFamily: 'var(--font-heading)',
    fontSize: '13px',
    fontWeight: 500,
    color: '#FFFFFF',
  };

  const userRoleStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: '#93C5FD',
    letterSpacing: '0.05em',
  };

  const logoutButtonStyle = (isHovered: boolean): React.CSSProperties => ({
    fontFamily: 'var(--font-heading)',
    fontSize: '12px',
    fontWeight: 'bold',
    color: isHovered ? 'var(--color-primary)' : '#FFFFFF',
    backgroundColor: isHovered ? '#FFFFFF' : 'transparent',
    border: `var(--border-width) solid #FFFFFF`,
    borderRadius: 'var(--radius-card)',
    padding: '6px 14px',
    cursor: 'pointer',
    transition: 'all 0.15s ease-in-out',
  });

  // Modal common container styles
  const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)', // Eye-friendly slate overlay
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
  };

  const modalBoxStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-card)',
    border: 'var(--border-width) solid var(--color-border)',
    borderRadius: 'var(--radius-card)',
    maxWidth: '480px',
    width: '100%',
    padding: '24px',
    color: 'var(--color-text-main)',
    boxSizing: 'border-box',
    fontFamily: 'var(--font-body)',
  };

  const modalHeaderStyle: React.CSSProperties = {
    fontFamily: 'var(--font-heading)',
    fontWeight: 'bold',
    fontSize: '20px',
    color: 'var(--color-primary)',
    margin: '0 0 16px 0',
    borderBottom: 'var(--border-width) solid var(--color-border)',
    paddingBottom: '8px',
  };

  const modalBtnStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: 'transparent',
    border: 'var(--border-width) solid var(--color-border)',
    borderRadius: 'var(--radius-card)',
    color: 'var(--color-text-main)',
    padding: '10px',
    fontWeight: 'bold',
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '20px',
    transition: 'all 0.15s ease',
  };

  return (
    <>
      <nav style={navStyle}>
        {/* Left Side: Brand Logo */}
        <Link to={token ? (role === 'DRIVER' ? '/driver' : '/shipper') : '/'} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 850,
            fontSize: '14px',
            color: 'var(--color-primary)',
            backgroundColor: '#FFFFFF',
            padding: '2px 8px',
            borderRadius: 'var(--radius-card)',
            letterSpacing: '-0.025em',
          }}>Cargo</span>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 'bold',
            fontSize: '20px',
            color: '#FFFFFF',
            marginLeft: '6px',
            letterSpacing: '-0.025em',
          }}>Go</span>
        </Link>

        {/* Desktop Center: Navigation Options */}
        {!isMobile && (
          <div style={centerNavStyle}>
            {navLinks.map((link) => {
              const isActive = activeLink === link;
              const isHovered = hoveredLink === link;
              const isPrimaryAction = link === 'Book Delivery' || link === 'Dashboard';

              const linkStyle: React.CSSProperties = {
                fontFamily: "var(--font-body)",
                fontSize: '14px',
                fontWeight: isPrimaryAction ? 700 : 500,
                color: (isActive || isHovered) ? COLORS.amber : COLORS.mutedCream,
                cursor: 'pointer',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                padding: '0 4px',
                borderBottom: isActive ? `1.5px solid ${COLORS.amber}` : '1.5px solid transparent',
                transition: 'color 0.15s ease, border-color 0.15s ease',
                background: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                borderTop: 'none',
                outline: 'none',
              };

              return (
                <button
                  key={link}
                  onClick={() => handleLinkClick(link)}
                  onMouseEnter={() => setHoveredLink(link)}
                  onMouseLeave={() => setHoveredLink(null)}
                  style={linkStyle}
                >
                  {link}
                </button>
              );
            })}
          </div>
        )}

        {/* Desktop Right: User info & Action */}
        {!isMobile ? (
          <div style={rightNavStyle}>
            {token ? (
              <>
                <div style={userInfoStyle}>
                  <span style={userNameStyle}>{name}</span>
                  <span style={userRoleStyle}>{role}</span>
                </div>

                <button
                  onClick={handleLogout}
                  onMouseEnter={() => setLogoutHovered(true)}
                  onMouseLeave={() => setLogoutHovered(false)}
                  style={logoutButtonStyle(logoutHovered)}
                >
                  Logout
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button
                  onClick={() => navigate('/login')}
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: '#FFFFFF',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'opacity 0.15s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/register')}
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: 'var(--color-primary)',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #FFFFFF',
                    borderRadius: 'var(--radius-card)',
                    padding: '6px 14px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease-in-out',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#FFFFFF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.color = 'var(--color-primary)';
                  }}
                >
                  Register
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Mobile Hamburger Button Container */
          <div style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            boxSizing: 'border-box',
          }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '4px',
                width: '32px',
                height: '32px',
              }}
              aria-label="Toggle menu"
            >
              <span style={{ display: 'block', width: '20px', height: '2px', backgroundColor: '#FFFFFF', transition: 'all 0.2s', transform: menuOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none' }} />
              <span style={{ display: 'block', width: '20px', height: '2px', backgroundColor: '#FFFFFF', transition: 'all 0.2s', opacity: menuOpen ? 0 : 1 }} />
              <span style={{ display: 'block', width: '20px', height: '2px', backgroundColor: '#FFFFFF', transition: 'all 0.2s', transform: menuOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none' }} />
            </button>
          </div>
        )}
      </nav>

      {/* Mobile Drawer Dropdown Menu */}
      {isMobile && menuOpen && (
        <div
          style={{
            position: 'fixed',
            top: '64px',
            left: 0,
            right: 0,
            backgroundColor: COLORS.espresso,
            borderBottom: `1.5px solid ${COLORS.border}`,
            padding: '16px 20px',
            zIndex: 499,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            fontFamily: "var(--font-body)",
          }}
        >
          {/* Nav Links Stacked */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {navLinks.map((link) => {
              const isActive = activeLink === link;
              return (
                <button
                  key={link}
                  onClick={() => handleLinkClick(link)}
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: '14px',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? COLORS.amber : COLORS.mutedCream,
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    padding: '6px 0',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  {link}
                </button>
              );
            })}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: 0 }} />

          {/* User Info & Logout Button Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {token ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: '1.2' }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: COLORS.cream }}>{name}</span>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: COLORS.amber }}>{role}</span>
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: COLORS.espresso,
                    backgroundColor: COLORS.amber,
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/login');
                  }}
                  style={{
                    flex: 1,
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#FFFFFF',
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/register');
                  }}
                  style={{
                    flex: 1,
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: 'var(--color-primary)',
                    backgroundColor: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------------------- MODALS -------------------- */}

      {/* Pricing Rates Modal */}
      {showRates && (
        <div style={modalOverlayStyle} onClick={() => setShowRates(false)}>
          <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={modalHeaderStyle}>Pricing Rates</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
              <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '6px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>Vehicle Type</span>
                <span>Base Price + Per Km</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Mini Tempo</span>
                <span style={{ fontFamily: "'Space Mono', monospace", color: 'var(--color-primary)' }}>₹50 + ₹12/km</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Pickup Truck</span>
                <span style={{ fontFamily: "'Space Mono', monospace", color: 'var(--color-primary)' }}>₹80 + ₹15/km</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>3-Ton Container</span>
                <span style={{ fontFamily: "'Space Mono', monospace", color: 'var(--color-primary)' }}>₹150 + ₹20/km</span>
              </div>
              <p style={{ fontSize: '11px', color: '#64748B', marginTop: '12px', lineHeight: '1.4' }}>
                * Billed weight is determined dynamically as the maximum of actual package weight and volumetric cargo weight.
              </p>
            </div>
            <button 
              onClick={() => setShowRates(false)}
              style={modalBtnStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#1E293B';
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Services Modal */}
      {showServices && (
        <div style={modalOverlayStyle} onClick={() => setShowServices(false)}>
          <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={modalHeaderStyle}>Our Services</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
              <div style={{ padding: '10px', backgroundColor: '#F8F9FA', border: '1px solid #E2E8F0', borderRadius: '4px' }}>
                <p style={{ fontWeight: 'bold', color: 'var(--color-primary)', margin: '0 0 4px 0' }}>Express Delivery</p>
                <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>Fast tracking, priority routing, and quick driver dispatch for urgent loads.</p>
              </div>
              <div style={{ padding: '10px', backgroundColor: '#F8F9FA', border: '1px solid #E2E8F0', borderRadius: '4px' }}>
                <p style={{ fontWeight: 'bold', color: 'var(--color-primary)', margin: '0 0 4px 0' }}>Bulk Cargo Transport</p>
                <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>Perfect for high-volume items. Fits easily inside our 3-Ton containers.</p>
              </div>
              <div style={{ padding: '10px', backgroundColor: '#F8F9FA', border: '1px solid #E2E8F0', borderRadius: '4px' }}>
                <p style={{ fontWeight: 'bold', color: 'var(--color-primary)', margin: '0 0 4px 0' }}>Secure Handling</p>
                <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>Sealed cargo chambers and verified OTP authentication for secure pickups.</p>
              </div>
            </div>
            <button 
              onClick={() => setShowServices(false)}
              style={modalBtnStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#1E293B';
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* FAQ Modal */}
      {showFAQ && (
        <div style={modalOverlayStyle} onClick={() => setShowFAQ(false)}>
          <div style={{ ...modalBoxStyle, maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={modalHeaderStyle}>Frequently Asked Questions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px' }}>
              {role === 'DRIVER' ? (
                <>
                  <div>
                    <p style={{ fontWeight: 'bold', color: '#1E293B', margin: '0 0 4px 0' }}>How do I start a delivery?</p>
                    <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>Ask the shipper for the pickup OTP when you arrive at the pickup point, enter it into your dashboard, and confirm.</p>
                  </div>
                  <div>
                    <p style={{ fontWeight: 'bold', color: '#1E293B', margin: '0 0 4px 0' }}>How do I mark as delivered?</p>
                    <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>Upon reaching the dropoff point, ask the shipper/receiver for the dropoff OTP, enter it, and submit to complete the run.</p>
                  </div>
                  <div>
                    <p style={{ fontWeight: 'bold', color: '#1E293B', margin: '0 0 4px 0' }}>When do my earnings update?</p>
                    <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>Earnings update instantly on your dashboard and performance stats once a shipment status changes to Completed.</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p style={{ fontWeight: 'bold', color: '#1E293B', margin: '0 0 4px 0' }}>How is the price calculated?</p>
                    <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>Pricing depends on distance, chosen vehicle type, and the volumetric weight of your items.</p>
                  </div>
                  <div>
                    <p style={{ fontWeight: 'bold', color: '#1E293B', margin: '0 0 4px 0' }}>What is the OTP verification system?</p>
                    <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>We verify runs at pickup and dropoff. When the driver arrives, share the security pin from your dashboard to proceed.</p>
                  </div>
                  <div>
                    <p style={{ fontWeight: 'bold', color: '#1E293B', margin: '0 0 4px 0' }}>How do I cancel my order?</p>
                    <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>You can cancel any booking before a driver accepts it. Once matched, please contact support immediately.</p>
                  </div>
                </>
              )}
            </div>
            <button 
              onClick={() => setShowFAQ(false)}
              style={modalBtnStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#1E293B';
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Active Runs Modal */}
      {showActiveRuns && (
        <div style={modalOverlayStyle} onClick={() => setShowActiveRuns(false)}>
          <div style={{ ...modalBoxStyle, maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={modalHeaderStyle}>Active Deliveries</h3>
            {activeShipperRuns.length === 0 ? (
              <p style={{ fontSize: '14px', color: '#64748B', textAlign: 'center', margin: '24px 0' }}>No active deliveries at this time.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeShipperRuns.map((b: any) => (
                  <div key={b.id} style={{ padding: '12px', backgroundColor: '#F8F9FA', border: '1px solid #E2E8F0', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', color: '#64748B', margin: 0 }}>ID: {b.id.substring(0, 8)}</p>
                      <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '4px 0' }}>{b.cargoType}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(45, 91, 227, 0.1)', color: 'var(--color-primary)', border: '1px solid rgba(45, 91, 227, 0.15)' }}>
                          {b.status}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', fontFamily: "'Space Mono', monospace" }}>₹{b.price}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setShowActiveRuns(false);
                        navigate(`/track/${b.id}`);
                      }}
                      style={{
                        backgroundColor: 'var(--color-primary)',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        transition: 'opacity 0.15s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      Track
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button 
              onClick={() => setShowActiveRuns(false)}
              style={modalBtnStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#1E293B';
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Driver Performance Stats Modal */}
      {showDriverStats && (
        <div style={modalOverlayStyle} onClick={() => setShowDriverStats(false)}>
          <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={modalHeaderStyle}>My Performance</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div style={{ backgroundColor: '#F8F9FA', padding: '16px', borderRadius: '4px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                <p style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Total Earnings</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#10B981', margin: 0, fontFamily: "'Space Mono', monospace" }}>₹{driverEarnings}</p>
              </div>
              <div style={{ backgroundColor: '#F8F9FA', padding: '16px', borderRadius: '4px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                <p style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Deliveries Completed</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1E293B', margin: 0 }}>{completedDriverJobs.length}</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Active Deliveries:</span>
                <span style={{ fontWeight: 'bold' }}>{activeDriverJobs.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Acceptance Rate:</span>
                <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>100%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Profile Status:</span>
                <span style={{ color: '#10B981', fontWeight: 'bold' }}>Verified Partner</span>
              </div>
            </div>
            <button 
              onClick={() => setShowDriverStats(false)}
              style={modalBtnStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#1E293B';
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Support Modal */}
      {showSupport && (
        <div style={modalOverlayStyle} onClick={() => setShowSupport(false)}>
          <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={modalHeaderStyle}>Customer Support</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px' }}>
              <div>
                <p style={{ fontWeight: 'bold', color: '#1E293B', margin: '0 0 4px 0' }}>Support Hotline</p>
                <p style={{ color: 'var(--color-primary)', fontWeight: 'bold', fontSize: '16px', margin: 0, fontFamily: "'Space Mono', monospace" }}>+1-800-CARGOGO (227-4646)</p>
              </div>
              <div>
                <p style={{ fontWeight: 'bold', color: '#1E293B', margin: '0 0 4px 0' }}>Email Assistance</p>
                <p style={{ color: 'var(--color-primary)', fontWeight: 'bold', margin: 0 }}>help@cargogo.com</p>
              </div>
              <div>
                <p style={{ fontWeight: 'bold', color: '#1E293B', margin: '0 0 4px 0' }}>Claims & Disputes</p>
                <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: '1.4' }}>For live tracking and pricing disputes, use the "File a Dispute" interface inside the invoice summary on the delivery tracking page.</p>
              </div>
            </div>
            <button 
              onClick={() => setShowSupport(false)}
              style={modalBtnStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#1E293B';
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* Quick Track Shipment Modal */}
      {showTrackModal && (
        <div style={modalOverlayStyle} onClick={() => setShowTrackModal(false)}>
          <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={modalHeaderStyle}>Quick Track Shipment</h3>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (trackingIdInput.trim()) {
                  setShowTrackModal(false);
                  navigate(`/track/${trackingIdInput.trim()}`);
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>
                Enter your Booking Tracking ID:
              </label>
              <input 
                type="text" 
                placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                value={trackingIdInput}
                onChange={(e) => setTrackingIdInput(e.target.value)}
                className="w-full p-3 bg-white text-[var(--color-text-main)] rounded-[var(--radius-card)] border focus:outline-none focus:border-[var(--color-primary)] text-sm transition-all"
                style={{ borderWidth: 'var(--border-width)', borderColor: 'var(--color-input-border)' }}
                required 
              />
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button"
                  onClick={() => setShowTrackModal(false)}
                  style={{ ...modalBtnStyle, marginTop: 0, flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{ 
                    ...modalBtnStyle, 
                    marginTop: 0, 
                    flex: 1, 
                    backgroundColor: 'var(--color-primary)', 
                    color: '#FFFFFF',
                    border: 'none'
                  }}
                >
                  Track Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* For Shippers Informational Modal */}
      {showShippersModal && (
        <div style={modalOverlayStyle} onClick={() => setShowShippersModal(false)}>
          <div style={{ ...modalBoxStyle, maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={modalHeaderStyle}>CargoGo For Shippers</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px', lineHeight: '1.5' }}>
              <p>Ship cargo seamlessly with enterprise-grade logistics tools built for businesses and individuals:</p>
              <ul style={{ paddingLeft: '20px', listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>Volumetric Math Engine</strong>: Input physical package sizes to automatically generate transparent estimates based on size or weight.</li>
                <li><strong>OTP Security Handshakes</strong>: High-value cargo keys are shared directly with the driver to authenticate both pickup and deliveries safely.</li>
                <li><strong>Instant Driver Matching</strong>: Post your shipment and get automatically connected with vetted local truck and tempo drivers immediately.</li>
              </ul>
              <button 
                onClick={() => {
                  setShowShippersModal(false);
                  navigate('/register');
                }}
                className="w-full text-white p-3 rounded-[var(--radius-button)] font-bold mt-4"
                style={{ backgroundColor: 'var(--color-primary)', border: 'none' }}
              >
                Sign Up as a Shipper
              </button>
              <button 
                onClick={() => setShowShippersModal(false)}
                style={{ ...modalBtnStyle, marginTop: '4px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* For Drivers Informational Modal */}
      {showDriversModal && (
        <div style={modalOverlayStyle} onClick={() => setShowDriversModal(false)}>
          <div style={{ ...modalBoxStyle, maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={modalHeaderStyle}>CargoGo For Drivers</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px', lineHeight: '1.5' }}>
              <p>Earn more money and maximize your vehicle efficiency by partner dispatching with CargoGo:</p>
              <ul style={{ paddingLeft: '20px', listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>Smart Route Optimization</strong>: Accept multiple nearby freight runs and get instant navigation route planning directly to save fuel.</li>
                <li><strong>Prompt Digital Payouts</strong>: Earnings update instantly on your dashboard when a shipper confirms the drop-off verification key.</li>
                <li><strong>Flexible Schedule</strong>: Work on your own terms. Select runs matching your tempo, pickup truck, or container vehicle type.</li>
              </ul>
              <button 
                onClick={() => {
                  setShowDriversModal(false);
                  navigate('/register');
                }}
                className="w-full text-white p-3 rounded-[var(--radius-button)] font-bold mt-4"
                style={{ backgroundColor: 'var(--color-primary)', border: 'none' }}
              >
                Join as a Partner Driver
              </button>
              <button 
                onClick={() => setShowDriversModal(false)}
                style={{ ...modalBtnStyle, marginTop: '4px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
