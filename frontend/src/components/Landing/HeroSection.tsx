import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ArrowRight, ShieldCheck, Zap, Calculator } from 'lucide-react';

export default function HeroSection() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const dest = isAuthenticated ? (user?.role === 'DRIVER' ? '/driver' : '/shipper') : '/register';

  return (
    <header className="relative bg-slate-950 text-white overflow-hidden py-20 sm:py-28 border-b border-slate-800">
      {/* Subtle Background Image with Heavy Dark Scrim */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=1920&q=80')`
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/70 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="max-w-3xl space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/15 rounded-full text-xs font-bold tracking-wide text-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Freight Network Active
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white font-heading">
            Book Trucks &amp; Track Cargo Instantly
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl font-body">
            Transparent volumetric pricing, live GPS tracking, and OTP-verified secure delivery. Direct dispatch with zero middleman markups.
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
              <span>Calculate Quote</span>
            </a>
          </div>

          {/* Trust Highlights Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-10 border-t border-white/10 text-xs font-medium text-slate-300">
            <div className="flex items-center gap-2.5">
              <Zap size={18} className="text-amber-400 shrink-0" />
              <span>Instant Driver Matching</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
              <span>Dual OTP Verified Handshake</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Calculator size={18} className="text-indigo-400 shrink-0" />
              <span>Transparent Volumetric Rates</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
