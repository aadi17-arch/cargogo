import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface StorySectionProps {
  id?: string;
  tag: string;
  tagColor: string;
  title: string;
  description: string;
  benefits: string[];
  cta: string;
  bgImage: string;
  align: 'left' | 'right';
}

function MarketplaceStorySection({
  id,
  tag,
  tagColor,
  title,
  description,
  benefits,
  cta,
  bgImage,
  align
}: StorySectionProps) {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const dest = isAuthenticated ? (user?.role === 'DRIVER' ? '/driver' : '/shipper') : '/register';

  return (
    <section id={id} className="py-20 bg-slate-50 border-b border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Text Content Column */}
          <div className={`lg:col-span-6 space-y-6 text-left ${align === 'right' ? 'lg:order-2' : 'lg:order-1'}`}>
            <div className="space-y-2">
              <span className={`text-xs font-bold ${tagColor}`}>
                {tag}
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 font-heading leading-tight">
                {title}
              </h2>
            </div>

            <p className="text-sm sm:text-base leading-relaxed text-slate-600 font-body">
              {description}
            </p>

            <div className="space-y-2.5 pt-1">
              {benefits.map((b) => (
                <div key={b} className="flex items-center gap-2.5 text-xs font-bold text-slate-800">
                  <CheckCircle2 size={16} className="text-slate-900 shrink-0" />
                  <span>{b}</span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate(dest)}
                className="h-11 px-6 rounded-lg bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <span>{isAuthenticated ? 'Go to Dashboard' : cta}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Clean Rounded Image Column */}
          <div className={`lg:col-span-6 ${align === 'right' ? 'lg:order-1' : 'lg:order-2'}`}>
            <div className="h-80 sm:h-96 rounded-xl overflow-hidden border border-slate-200 shadow-md relative group">
              <img
                src={bgImage}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-slate-950/15" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ShipperSection() {
  return (
    <MarketplaceStorySection
      id="shippers"
      align="left"
      tag="For Shippers"
      tagColor="text-slate-500"
      title="Easy truck booking for your goods and business"
      description="Book verified local trucks in minutes to move anything from furniture to commercial stock. Enjoy clear rates and safe delivery."
      benefits={[
        'Nearby drivers assigned in minutes',
        'Secure 4-digit code required at pickup and dropoff',
        'Live tracking map to follow your truck in real time',
        'Instant digital receipts and clear invoices'
      ]}
      cta="Start Shipping Today"
      bgImage="https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80"
    />
  );
}

export function DriverSection() {
  return (
    <MarketplaceStorySection
      id="drivers"
      align="right"
      tag="For Driver Partners"
      tagColor="text-slate-500"
      title="Earn more with regular trips and zero commission"
      description="Connect directly with people and businesses who need trucks. Get steady trip requests, clear per-kilometer pay, and fast payouts."
      benefits={[
        'Keep 100% of your delivery earnings with no hidden cuts',
        'Instant trip requests on your phone with one-tap accept',
        'Built-in easy route directions for every delivery',
        'Earnings sent directly to your bank account'
      ]}
      cta="Join as a Driver Partner"
      bgImage="https://images.unsplash.com/photo-1501700493788-fa1a4fc9fe62?auto=format&fit=crop&w=1200&q=80"
    />
  );
}
