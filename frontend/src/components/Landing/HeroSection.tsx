import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ArrowRight, Calculator } from 'lucide-react';

export default function HeroSection() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const dest = isAuthenticated ? (user?.role === 'DRIVER' ? '/driver' : '/shipper') : '/register';

  return (
    <header className="relative bg-slate-50 text-white overflow-hidden py-48 sm:py-52 border-b border-slate-800">
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
