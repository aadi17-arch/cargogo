import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function HeroSection() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const dest = isAuthenticated ? (user?.role === 'DRIVER' ? '/driver' : '/shipper') : '/register';

  return (
    <header className="relative px-4 sm:px-16 border-b border-[var(--color-border)] flex items-center overflow-hidden py-16 sm:py-0 h-auto sm:h-[calc(100vh-64px)] min-h-[650px] sm:min-h-[750px]">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=1920&q=80')` }} />
      <div className="absolute inset-0 z-10" style={{ background: 'linear-gradient(to right, rgba(15, 27, 46, 0.96) 30%, rgba(15, 27, 46, 0.6) 70%, rgba(15, 27, 46, 0.35) 100%)' }} />
      <div className="w-full relative z-20">
        <div className="max-w-2xl space-y-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            Book Trucks &amp; Track Cargo Instantly
          </h1>
          <p className="text-lg sm:text-xl font-medium text-slate-200">
            Get instant pricing, live tracking, and secure deliveries. No phone calls required—just fast, direct cargo booking for your business.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <button onClick={() => navigate(dest)} className="bg-white text-[var(--color-primary)] hover:bg-slate-100 px-8 py-3.5 rounded-[var(--radius-button)] font-bold transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]" style={{ fontFamily: 'var(--font-heading)', fontSize: '15px' }}>
              {isAuthenticated ? 'Go to Dashboard' : 'Start Shipping'}
            </button>
            <a href="#calculator" className="px-8 py-3.5 rounded-[var(--radius-button)] font-bold transition-all border border-white text-white bg-transparent hover:bg-white/10 text-center" style={{ fontFamily: 'var(--font-heading)', fontSize: '15px' }}>
              Calculate Quote
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
