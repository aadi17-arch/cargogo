import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function HeroSection() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const dest = isAuthenticated ? (user?.role === 'DRIVER' ? '/driver' : '/shipper') : '/register';

  return (
    <header className="relative px-4 sm:px-16 border-b border-[var(--color-border)] flex items-center overflow-hidden py-20 lg:py-0 min-h-screen bg-slate-950">
      {/* Premium SVG Animated Cargo & Transit Grid Background */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none select-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.07)" strokeWidth="1" />
            </pattern>
            <style>{`
              @keyframes slideRoute {
                0% { stroke-dashoffset: 600; }
                100% { stroke-dashoffset: 0; }
              }
              @keyframes pulseDot {
                0%, 100% { transform: scale(1); opacity: 0.3; }
                50% { transform: scale(1.5); opacity: 0.8; }
              }
              @keyframes floatTruck {
                0% { transform: translate(10%, 20%); }
                50% { transform: translate(60%, 70%); }
                100% { transform: translate(90%, 30%); }
              }
              .animated-route {
                stroke-dasharray: 12, 12;
                animation: slideRoute 25s linear infinite;
              }
              .pulsing-node {
                transform-origin: center;
                animation: pulseDot 4s ease-in-out infinite;
              }
              .floating-cargo {
                animation: floatTruck 20s ease-in-out infinite alternate;
              }
            `}</style>
          </defs>
          
          {/* Base Grid */}
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Transit Route Paths */}
          <path d="M 100,200 Q 400,100 800,400 T 1500,200" fill="none" stroke="rgba(79, 70, 229, 0.4)" strokeWidth="3" className="animated-route" />
          <path d="M 200,600 Q 700,400 1200,700 T 1800,300" fill="none" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="2.5" className="animated-route" style={{ animationDuration: '35s', animationDirection: 'reverse' }} />
          
          {/* Map Nodes (Pulsing Dots) */}
          <circle cx="100" cy="200" r="6" fill="#4F46E5" className="pulsing-node" />
          <circle cx="800" cy="400" r="8" fill="#06B6D4" className="pulsing-node" style={{ animationDelay: '1.5s' }} />
          <circle cx="1500" cy="200" r="7" fill="#4F46E5" className="pulsing-node" style={{ animationDelay: '3s' }} />
          <circle cx="200" cy="600" r="5" fill="#06B6D4" className="pulsing-node" style={{ animationDelay: '0.8s' }} />
          <circle cx="1200" cy="700" r="8" fill="#4F46E5" className="pulsing-node" style={{ animationDelay: '2.2s' }} />

          {/* Gliding Cargo Transit Indicator */}
          <g className="floating-cargo">
            <rect width="24" height="12" rx="2" fill="#4F46E5" opacity="0.8" />
            <circle cx="6" cy="12" r="2.5" fill="#06B6D4" />
            <circle cx="18" cy="12" r="2.5" fill="#06B6D4" />
          </g>
        </svg>
      </div>
      <div className="absolute inset-0 z-10 bg-slate-950/40" />
      <div className="w-full relative z-20 max-w-[1750px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-left">
        <div className="lg:col-span-7 space-y-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            Book Trucks &amp; Track Cargo Instantly
          </h1>
          <p className="text-lg sm:text-xl font-medium text-slate-300 max-w-xl">
            Get instant pricing, live tracking, and secure deliveries. No phone calls required—just fast, direct cargo booking for your business.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <button onClick={() => navigate(dest)} className="demo-btn-primary-light">
              {isAuthenticated ? 'Go to Dashboard' : 'Start Shipping'}
            </button>
            <a href="#pricing" className="demo-btn-secondary">
              Calculate Quote
            </a>
          </div>
        </div>
        <div className="lg:col-span-5 hidden lg:block">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl space-y-4 max-w-md ml-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Active Dispatch Route</span>
              <span className="text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-mono">ID: CG-89F3A</span>
            </div>
            <div className="space-y-3 font-mono text-[11px] text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Origin:</span>
                <span className="font-bold text-white">Bandra (W), Mumbai</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Destination:</span>
                <span className="font-bold text-white">Hinjawadi Ph 3, Pune</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vehicle Match:</span>
                <span className="font-bold text-indigo-400">Mini Tempo (Active)</span>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Billed Fare:</span>
              <span className="text-lg font-black text-white">₹2,840.00</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
