import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  align: 'left' | 'right';
  tag: string;
  tagColor: string;
  title: string;
  description: string;
  cta: string;
  bgImage: string;
  gradientDir: 'left' | 'right';
  id?: string;
}

function FullBleedSection({ align, tag, tagColor, title, description, cta, bgImage, gradientDir, id }: Props) {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const dest = isAuthenticated ? (user?.role === 'DRIVER' ? '/driver' : '/shipper') : '/register';
  const justify = align === 'left' ? 'justify-start' : 'justify-end';
  const gradient = gradientDir === 'left'
    ? 'linear-gradient(to right, rgba(9, 18, 31, 0.96) 35%, rgba(9, 18, 31, 0.8) 70%, rgba(9, 18, 31, 0.45) 100%)'
    : 'linear-gradient(to left, rgba(9, 18, 31, 0.96) 35%, rgba(9, 18, 31, 0.8) 70%, rgba(9, 18, 31, 0.45) 100%)';

  return (
    <section id={id} className="relative py-36 px-6 overflow-hidden flex items-center min-h-[450px]">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${bgImage}')` }} />
      <div className="absolute inset-0 z-10" style={{ background: gradient }} />
      <div className={`max-w-[1750px] mx-auto px-4 sm:px-8 w-full relative z-20 flex ${justify} text-left`}>
        <div className="max-w-2xl space-y-6">
          <span className={`text-xs font-bold uppercase tracking-wider ${tagColor}`}>{tag}</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h2>
          <p className="text-base sm:text-lg leading-relaxed text-slate-300">{description}</p>
          <div className="pt-2">
            <button onClick={() => navigate(dest)} className="demo-btn-primary-light">
              {isAuthenticated ? 'Go to Dashboard' : cta}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ShipperSection() {
  return (
    <FullBleedSection
      id="shippers" align="left" tag="For Shippers" tagColor="text-indigo-400"
      title="Designed to keep cargo moving"
      description="Book verified local trucks instantly to ship anything from office supplies to heavy freight. No brokers, no hidden margins, and complete delivery security from start to finish."
      cta="Create Shipper Account"
      bgImage="https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1920&q=80"
      gradientDir="left"
    />
  );
}

export function DriverSection() {
  return (
    <FullBleedSection
      id="drivers" align="right" tag="For Drivers" tagColor="text-emerald-400"
      title="Keep 100% of your earnings"
      description="Get matched directly with local shippers needing vehicle capacity. We take zero commission cuts from your matched base fares, keeping more money in your pocket."
      cta="Sign Up as a Driver"
      bgImage="https://images.unsplash.com/photo-1501700493788-fa1a4fc9fe62?auto=format&fit=crop&w=1920&q=80"
      gradientDir="right"
    />
  );
}
