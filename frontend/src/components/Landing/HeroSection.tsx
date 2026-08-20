import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ArrowRight, Calculator } from 'lucide-react';

export default function HeroSection() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const dest = isAuthenticated ? (user?.role === 'DRIVER' ? '/driver' : '/shipper') : '/register';

  return (
    <header className="relative bg-slate-950 text-white overflow-hidden min-h-[calc(100svh-4rem)] flex items-center border-b border-slate-800 py-16 sm:py-24">
      {/* Subtle Background Image with Heavy Dark Scrim */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-15 pointer-events-none"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=1920&q=80')`
        }}
      />

      {/* Dark Scrim and Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/95 to-slate-950/80 pointer-events-none" />

      {/* Grid Pattern Background */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />

      {/* High-Visibility Animated SVG Logistics & Tracking Network */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="routeGlow1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#818CF8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#C084FC" stopOpacity="0.7" />
          </linearGradient>

          <linearGradient id="routeGlow2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#34D399" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.6" />
          </linearGradient>

          <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Major Interstate Highway Corridors */}
        <path
          d="M 100 650 Q 400 350, 750 480 T 1380 200"
          fill="none"
          stroke="url(#routeGlow1)"
          strokeWidth="2.5"
          strokeDasharray="8 8"
          className="animate-dash opacity-70"
        />

        <path
          d="M 200 150 Q 600 500, 950 280 T 1400 550"
          fill="none"
          stroke="url(#routeGlow2)"
          strokeWidth="2"
          strokeDasharray="6 6"
          className="animate-dash opacity-60"
        />

        <path
          d="M 500 780 C 700 600, 900 650, 1150 450 C 1300 300, 1380 200, 1440 180"
          fill="none"
          stroke="#38BDF8"
          strokeWidth="1.5"
          strokeOpacity="0.3"
          strokeDasharray="4 6"
        />

        {/* Live Animated Cargo Transport Pods */}
        <g filter="url(#neonGlow)">
          <circle r="6" fill="#38BDF8">
            <animateMotion
              path="M 100 650 Q 400 350, 750 480 T 1380 200"
              dur="9s"
              repeatCount="indefinite"
            />
          </circle>
          <circle r="5" fill="#34D399">
            <animateMotion
              path="M 200 150 Q 600 500, 950 280 T 1400 550"
              dur="12s"
              repeatCount="indefinite"
            />
          </circle>
          <circle r="4.5" fill="#C084FC">
            <animateMotion
              path="M 100 650 Q 400 350, 750 480 T 1380 200"
              dur="14s"
              begin="-5s"
              repeatCount="indefinite"
            />
          </circle>
        </g>

        {/* Regional Hub Waypoints & Pulsing Radar */}
        <g transform="translate(400, 350)">
          <circle r="4" fill="#38BDF8" />
          <circle r="16" fill="none" stroke="#38BDF8" strokeWidth="1.5" opacity="0.4" className="animate-ping" />
        </g>

        <g transform="translate(750, 480)">
          <circle r="5" fill="#818CF8" />
          <circle r="22" fill="none" stroke="#818CF8" strokeWidth="1.5" opacity="0.35" className="animate-ping" />
        </g>

        <g transform="translate(950, 280)">
          <circle r="4" fill="#34D399" />
          <circle r="18" fill="none" stroke="#34D399" strokeWidth="1.5" opacity="0.4" className="animate-ping" />
        </g>

        <g transform="translate(1380, 200)">
          <circle r="5" fill="#C084FC" />
          <circle r="24" fill="none" stroke="#C084FC" strokeWidth="1.5" opacity="0.3" className="animate-ping" />
        </g>
      </svg>

      <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
        <div className="max-w-3xl space-y-6 text-left">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white font-heading">
            Book Trucks &amp; Track Cargo Instantly
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl font-body">
            Need to move goods? Book local trucks in seconds with fixed rates and live tracking.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(dest)}
              className="h-11 px-6 rounded-lg bg-white hover:bg-slate-100 text-slate-950 font-bold text-sm transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <span>{isAuthenticated ? 'Go to Dashboard' : 'Start Shipping'}</span>
              <ArrowRight size={16} />
            </button>
            <a
              href="#pricing"
              className="h-11 px-6 rounded-lg bg-transparent hover:bg-white/10 text-white border border-white/20 font-bold text-sm transition-all flex items-center gap-2"
            >
              <Calculator size={16} />
              <span>Calculate Price</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
