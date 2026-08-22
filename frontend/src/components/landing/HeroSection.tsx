import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ArrowRight, Calculator } from 'lucide-react';

export default function HeroSection() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const dest = isAuthenticated ? (user?.role === 'DRIVER' ? '/driver' : '/shipper') : '/register';

  return (
    <header className="relative bg-slate-950 text-white overflow-hidden h-[calc(100svh-4rem)] min-h-[calc(100svh-4rem)] flex items-center border-b border-slate-800">
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

      {/* High-End Refined Animated SVG Logistics & Tracking Network */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Subtle Glow & Gradients */}
          <linearGradient id="curveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.05" />
            <stop offset="40%" stopColor="#38BDF8" stopOpacity="0.45" />
            <stop offset="80%" stopColor="#818CF8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#C084FC" stopOpacity="0.1" />
          </linearGradient>

          <linearGradient id="curveGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.0" />
            <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#34D399" stopOpacity="0.5" />
          </linearGradient>

          <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient Logistics Arc 1 - Flows gracefully on right side */}
        <path
          d="M 550 780 C 750 520, 920 620, 1120 380 C 1240 240, 1380 180, 1500 120"
          fill="none"
          stroke="url(#curveGrad1)"
          strokeWidth="1.5"
          strokeDasharray="4 6"
          className="animate-dash"
        />

        {/* Ambient Logistics Arc 2 - Intersecting flight/interstate path */}
        <path
          d="M 680 100 C 850 320, 1050 200, 1260 480 C 1360 620, 1440 680, 1520 700"
          fill="none"
          stroke="url(#curveGrad2)"
          strokeWidth="1.2"
          strokeDasharray="3 5"
          className="animate-dash"
        />

        {/* Supporting Secondary Feeder Routes */}
        <path
          d="M 900 800 C 980 650, 1120 380, 1120 380"
          fill="none"
          stroke="#38BDF8"
          strokeWidth="1"
          strokeOpacity="0.2"
          strokeDasharray="2 4"
        />
        <path
          d="M 1120 380 C 1180 300, 1260 480, 1260 480"
          fill="none"
          stroke="#818CF8"
          strokeWidth="1"
          strokeOpacity="0.25"
          strokeDasharray="2 4"
        />

        {/* Moving Cargo Pulses (Smoothed & Refined) */}
        <g filter="url(#softGlow)">
          <circle r="3.5" fill="#38BDF8">
            <animateMotion
              path="M 550 780 C 750 520, 920 620, 1120 380 C 1240 240, 1380 180, 1500 120"
              dur="12s"
              repeatCount="indefinite"
            />
          </circle>
          <circle r="3" fill="#818CF8">
            <animateMotion
              path="M 550 780 C 750 520, 920 620, 1120 380 C 1240 240, 1380 180, 1500 120"
              dur="16s"
              begin="-6s"
              repeatCount="indefinite"
            />
          </circle>
          <circle r="3" fill="#34D399">
            <animateMotion
              path="M 680 100 C 850 320, 1050 200, 1260 480 C 1360 620, 1440 680, 1520 700"
              dur="14s"
              repeatCount="indefinite"
            />
          </circle>
        </g>

        {/* Refined Waypoints with Minimal Pulsing */}
        <g transform="translate(1120, 380)">
          <circle r="3.5" fill="#38BDF8" />
          <circle r="14" fill="none" stroke="#38BDF8" strokeWidth="1" opacity="0.3" className="animate-ping" />
        </g>
        <g transform="translate(1260, 480)">
          <circle r="3" fill="#34D399" />
          <circle r="12" fill="none" stroke="#34D399" strokeWidth="1" opacity="0.25" className="animate-ping" />
        </g>
        <g transform="translate(850, 320)">
          <circle r="2.5" fill="#818CF8" />
        </g>
        <g transform="translate(1380, 180)">
          <circle r="3" fill="#C084FC" />
          <circle r="15" fill="none" stroke="#C084FC" strokeWidth="1" opacity="0.25" className="animate-ping" />
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
