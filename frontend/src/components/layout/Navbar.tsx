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
    if (showActiveRuns || showDriverStats) {
      fetchMyBookings().catch(err => console.error('Failed to load bookings in navbar', err));
    }
  }, [showActiveRuns, showDriverStats]);

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
    if (role === 'DRIVER') {
      return ['Dashboard', 'Performance Stats', 'FAQ', 'Support'];
    }
    return ['Book Delivery', 'Active Runs', 'Rates', 'Services', 'FAQ', 'Support'];
  };

  const navLinks = getNavLinks();

  const handleLinkClick = (linkName: string) => {
    setActiveLink(linkName);
    setMenuOpen(false);
    if (linkName === 'Book Delivery') {
      navigate('/shipper');
    } else if (linkName === 'Dashboard') {
      navigate('/driver');
    } else if (linkName === 'Active Runs') {
      setShowActiveRuns(true);
    } else if (linkName === 'Rates') {
      setShowRates(true);
    } else if (linkName === 'Services') {
      setShowServices(true);
    } else if (linkName === 'FAQ') {
      setShowFAQ(true);
    } else if (linkName === 'Support') {
      setShowSupport(true);
    } else if (linkName === 'Performance Stats') {
      setShowDriverStats(true);
    }
  };

  // Color constants from the strict design system spec
  const COLORS = {
    espresso: '#120B04',
    surface: '#1A0F07',
    cream: '#F2E6D0',
    mutedCream: 'rgba(184, 168, 152, 0.6)',
    amber: '#C8813A',
    border: 'rgba(224, 206, 174, 0.15)',
  };

  // Styles
  const navStyle: React.CSSProperties = {
    position: 'sticky',
    top: 0,
    zIndex: 500,
    width: '100%',
    height: '64px',
    backgroundColor: COLORS.espresso,
    borderBottom: `1.5px solid ${COLORS.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: isMobile ? '0 16px' : '0 24px',
    boxSizing: 'border-box',
    fontFamily: "'DM Sans', sans-serif",
  };

  const logoStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none',
    userSelect: 'none',
  };

  const logoCargoStyle: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 850,
    fontSize: '14px',
    color: COLORS.espresso,
    backgroundColor: COLORS.amber,
    padding: '2px 8px',
    borderRadius: '6px',
    letterSpacing: '-0.025em',
  };

  const logoGoStyle: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 'bold',
    fontSize: '20px',
    color: COLORS.cream,
    marginLeft: '6px',
    letterSpacing: '-0.025em',
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
  };

  const userInfoStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    lineHeight: '1.2',
  };

  const userNameStyle: React.CSSProperties = {
    fontFamily: "'Outfit', sans-serif",
    fontSize: '13px',
    fontWeight: 500,
    color: COLORS.cream,
  };

  const userRoleStyle: React.CSSProperties = {
    fontFamily: "'Space Mono', monospace",
    fontSize: '10px',
    color: COLORS.amber,
    letterSpacing: '0.05em',
  };

  const logoutButtonStyle = (isHovered: boolean): React.CSSProperties => ({
    fontFamily: "'Outfit', sans-serif",
    fontSize: '12px',
    fontWeight: 'bold',
    color: isHovered ? COLORS.espresso : COLORS.cream,
    backgroundColor: isHovered ? COLORS.amber : 'transparent',
    border: `1.5px solid ${COLORS.border}`,
    borderRadius: '6px',
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
    backgroundColor: 'rgba(18, 11, 4, 0.85)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
  };

  const modalBoxStyle: React.CSSProperties = {
    backgroundColor: COLORS.surface,
    border: `1.5px solid ${COLORS.border}`,
    borderRadius: '6px',
    maxWidth: '480px',
    width: '100%',
    padding: '24px',
    color: COLORS.cream,
    boxSizing: 'border-box',
    fontFamily: "'DM Sans', sans-serif",
  };

  const modalHeaderStyle: React.CSSProperties = {
    fontFamily: "'Outfit', sans-serif",
    fontWeight: 'bold',
    fontSize: '20px',
    color: COLORS.amber,
    margin: '0 0 16px 0',
    borderBottom: `1.5px solid ${COLORS.border}`,
    paddingBottom: '8px',
  };

  const modalBtnStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: 'transparent',
    border: `1.5px solid ${COLORS.border}`,
    borderRadius: '6px',
    color: COLORS.cream,
    padding: '10px',
    fontWeight: 'bold',
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '20px',
    transition: 'all 0.15s ease',
  };

  if (!token) return null;

  return (
    <>
      <nav style={navStyle}>
        {/* Left Side: Brand Logo */}
        <Link to="/" style={logoStyle}>
          <span style={logoCargoStyle}>Cargo</span>
          <span style={logoGoStyle}>Go</span>
        </Link>

        {/* Desktop Center: Navigation Options */}
        {!isMobile && (
          <div style={centerNavStyle}>
            {navLinks.map((link) => {
              const isActive = activeLink === link;
              const isHovered = hoveredLink === link;
              const isPrimaryAction = link === 'Book Delivery' || link === 'Dashboard';

              const linkStyle: React.CSSProperties = {
                fontFamily: "'Outfit', sans-serif",
                fontSize: '14px',
                fontWeight: isPrimaryAction ? 700 : 500,
                color: (isActive || isHovered) ? COLORS.amber : COLORS.cream,
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
          </div>
        ) : (
          /* Mobile Hamburger Button */
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
            <span style={{ display: 'block', width: '20px', height: '2px', backgroundColor: COLORS.cream, transition: 'all 0.2s', transform: menuOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none' }} />
            <span style={{ display: 'block', width: '20px', height: '2px', backgroundColor: COLORS.cream, transition: 'all 0.2s', opacity: menuOpen ? 0 : 1 }} />
            <span style={{ display: 'block', width: '20px', height: '2px', backgroundColor: COLORS.cream, transition: 'all 0.2s', transform: menuOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none' }} />
          </button>
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
            fontFamily: "'Outfit', sans-serif",
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
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '14px',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? COLORS.amber : COLORS.cream,
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

          <hr style={{ border: 'none', borderTop: `1px solid rgba(224, 206, 174, 0.2)`, margin: 0 }} />

          {/* User Info & Logout Button Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
          </div>
        </div>
      )}

      {/* -------------------- MODALS -------------------- */}

      {/* Pricing Rates Modal */}
      {showRates && (
        <div style={modalOverlayStyle} onClick={() => setShowRates(false)}>
          <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={modalHeaderStyle}>Delivery Rates</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
              <div style={{ borderBottom: `1px solid rgba(224, 206, 174, 0.3)`, paddingBottom: '6px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>Vehicle Type</span>
                <span>Base Price + Per Km</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Mini Tempo</span>
                <span style={{ fontFamily: "'Space Mono', monospace", color: COLORS.amber }}>₹50 + ₹12/km</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Pickup Truck</span>
                <span style={{ fontFamily: "'Space Mono', monospace", color: COLORS.amber }}>₹80 + ₹15/km</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>3-Ton Container</span>
                <span style={{ fontFamily: "'Space Mono', monospace", color: COLORS.amber }}>₹150 + ₹20/km</span>
              </div>
              <p style={{ fontSize: '11px', color: COLORS.mutedCream, marginTop: '12px', lineHeight: '1.4' }}>
                * Billed weight is determined dynamically as the maximum of actual package weight and volumetric cargo weight.
              </p>
            </div>
            <button 
              onClick={() => setShowRates(false)}
              style={modalBtnStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.amber;
                e.currentTarget.style.color = COLORS.espresso;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = COLORS.cream;
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
              <div style={{ padding: '10px', backgroundColor: COLORS.espresso, border: `1px solid rgba(224, 206, 174, 0.2)`, borderRadius: '4px' }}>
                <p style={{ fontWeight: 'bold', color: COLORS.amber, margin: '0 0 4px 0' }}>Express Delivery</p>
                <p style={{ fontSize: '12px', color: COLORS.mutedCream, margin: 0 }}>Fast tracking, priority routing, and quick driver dispatch for urgent loads.</p>
              </div>
              <div style={{ padding: '10px', backgroundColor: COLORS.espresso, border: `1px solid rgba(224, 206, 174, 0.2)`, borderRadius: '4px' }}>
                <p style={{ fontWeight: 'bold', color: COLORS.amber, margin: '0 0 4px 0' }}>Bulk Cargo Transport</p>
                <p style={{ fontSize: '12px', color: COLORS.mutedCream, margin: 0 }}>Perfect for high-volume items. Fits easily inside our 3-Ton containers.</p>
              </div>
              <div style={{ padding: '10px', backgroundColor: COLORS.espresso, border: `1px solid rgba(224, 206, 174, 0.2)`, borderRadius: '4px' }}>
                <p style={{ fontWeight: 'bold', color: COLORS.amber, margin: '0 0 4px 0' }}>Secure Handling</p>
                <p style={{ fontSize: '12px', color: COLORS.mutedCream, margin: 0 }}>Sealed cargo chambers and verified OTP authentication for secure pickups.</p>
              </div>
            </div>
            <button 
              onClick={() => setShowServices(false)}
              style={modalBtnStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.amber;
                e.currentTarget.style.color = COLORS.espresso;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = COLORS.cream;
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
                    <p style={{ fontWeight: 'bold', color: COLORS.cream, margin: '0 0 4px 0' }}>How do I start a delivery?</p>
                    <p style={{ fontSize: '12px', color: COLORS.mutedCream, margin: 0 }}>Ask the shipper for the pickup OTP when you arrive at the pickup point, enter it into your dashboard, and confirm.</p>
                  </div>
                  <div>
                    <p style={{ fontWeight: 'bold', color: COLORS.cream, margin: '0 0 4px 0' }}>How do I mark as delivered?</p>
                    <p style={{ fontSize: '12px', color: COLORS.mutedCream, margin: 0 }}>Upon reaching the dropoff point, ask the shipper/receiver for the dropoff OTP, enter it, and submit to complete the run.</p>
                  </div>
                  <div>
                    <p style={{ fontWeight: 'bold', color: COLORS.cream, margin: '0 0 4px 0' }}>When do my earnings update?</p>
                    <p style={{ fontSize: '12px', color: COLORS.mutedCream, margin: 0 }}>Earnings update instantly on your dashboard and performance stats once a shipment status changes to Completed.</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p style={{ fontWeight: 'bold', color: COLORS.cream, margin: '0 0 4px 0' }}>How is the price calculated?</p>
                    <p style={{ fontSize: '12px', color: COLORS.mutedCream, margin: 0 }}>Pricing depends on distance, chosen vehicle type, and the volumetric weight of your items.</p>
                  </div>
                  <div>
                    <p style={{ fontWeight: 'bold', color: COLORS.cream, margin: '0 0 4px 0' }}>What is the OTP verification system?</p>
                    <p style={{ fontSize: '12px', color: COLORS.mutedCream, margin: 0 }}>We verify runs at pickup and dropoff. When the driver arrives, share the security pin from your dashboard to proceed.</p>
                  </div>
                  <div>
                    <p style={{ fontWeight: 'bold', color: COLORS.cream, margin: '0 0 4px 0' }}>How do I cancel my order?</p>
                    <p style={{ fontSize: '12px', color: COLORS.mutedCream, margin: 0 }}>You can cancel any booking before a driver accepts it. Once matched, please contact support immediately.</p>
                  </div>
                </>
              )}
            </div>
            <button 
              onClick={() => setShowFAQ(false)}
              style={modalBtnStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.amber;
                e.currentTarget.style.color = COLORS.espresso;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = COLORS.cream;
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
            <h3 style={modalHeaderStyle}>Your Active Shipments</h3>
            {activeShipperRuns.length === 0 ? (
              <p style={{ fontSize: '14px', color: COLORS.mutedCream, textAlign: 'center', margin: '24px 0' }}>No active shipments at this time.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeShipperRuns.map((b: any) => (
                  <div key={b.id} style={{ padding: '12px', backgroundColor: COLORS.espresso, border: `1px solid rgba(224, 206, 174, 0.2)`, borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', color: COLORS.mutedCream, margin: 0 }}>ID: {b.id.substring(0, 8)}</p>
                      <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '4px 0' }}>{b.cargoType}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(200, 129, 58, 0.1)', color: COLORS.amber, border: `1px solid ${COLORS.amber}22` }}>
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
                        backgroundColor: COLORS.amber,
                        border: 'none',
                        borderRadius: '4px',
                        color: COLORS.espresso,
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
                e.currentTarget.style.backgroundColor = COLORS.amber;
                e.currentTarget.style.color = COLORS.espresso;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = COLORS.cream;
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
            <h3 style={modalHeaderStyle}>Performance Metrics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div style={{ backgroundColor: COLORS.espresso, padding: '16px', borderRadius: '4px', textAlign: 'center', border: `1px solid rgba(224, 206, 174, 0.2)` }}>
                <p style={{ fontSize: '10px', color: COLORS.mutedCream, textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Total Earnings</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#10B981', margin: 0, fontFamily: "'Space Mono', monospace" }}>₹{driverEarnings}</p>
              </div>
              <div style={{ backgroundColor: COLORS.espresso, padding: '16px', borderRadius: '4px', textAlign: 'center', border: `1px solid rgba(224, 206, 174, 0.2)` }}>
                <p style={{ fontSize: '10px', color: COLORS.mutedCream, textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Runs Completed</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: COLORS.cream, margin: 0 }}>{completedDriverJobs.length}</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', borderTop: `1px solid rgba(224, 206, 174, 0.3)`, paddingTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.mutedCream }}>Active Runs:</span>
                <span style={{ fontWeight: 'bold' }}>{activeDriverJobs.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.mutedCream }}>Acceptance Rate:</span>
                <span style={{ fontWeight: 'bold', color: COLORS.amber }}>100%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.mutedCream }}>Profile Status:</span>
                <span style={{ color: '#10B981', fontWeight: 'bold' }}>Verified Partner</span>
              </div>
            </div>
            <button 
              onClick={() => setShowDriverStats(false)}
              style={modalBtnStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.amber;
                e.currentTarget.style.color = COLORS.espresso;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = COLORS.cream;
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
            <h3 style={modalHeaderStyle}>Support & Help</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px' }}>
              <div>
                <p style={{ fontWeight: 'bold', color: COLORS.cream, margin: '0 0 4px 0' }}>Support Hotline</p>
                <p style={{ color: COLORS.amber, fontWeight: 'bold', fontSize: '16px', margin: 0, fontFamily: "'Space Mono', monospace" }}>+1-800-CARGOGO (227-4646)</p>
              </div>
              <div>
                <p style={{ fontWeight: 'bold', color: COLORS.cream, margin: '0 0 4px 0' }}>Email Assistance</p>
                <p style={{ color: COLORS.amber, fontWeight: 'bold', margin: 0 }}>help@cargogo.com</p>
              </div>
              <div>
                <p style={{ fontWeight: 'bold', color: COLORS.cream, margin: '0 0 4px 0' }}>Claims & Disputes</p>
                <p style={{ fontSize: '12px', color: COLORS.mutedCream, margin: 0, lineHeight: '1.4' }}>For live tracking and pricing disputes, use the "File a Dispute" interface inside the invoice summary on the delivery tracking page.</p>
              </div>
            </div>
            <button 
              onClick={() => setShowSupport(false)}
              style={modalBtnStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.amber;
                e.currentTarget.style.color = COLORS.espresso;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = COLORS.cream;
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
