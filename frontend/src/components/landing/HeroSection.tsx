import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function HeroSection() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const dest = isAuthenticated ? (user?.role === 'DRIVER' ? '/driver' : '/shipper') : '/register';

  return (
    <header className="relative px-4 sm:px-16 border-b border-[var(--color-border)] flex items-center overflow-hidden py-20 lg:py-0 min-h-screen bg-slate-950">
      <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=1920&q=80')` }} />
      <div className="absolute inset-0 z-10 bg-slate-950/70" />
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
