import { Truck } from 'lucide-react';

const FLEET = [
  { title: 'Mini Tempo', sub: 'Up to 500 kg', description: 'Perfect for swift local deliveries of household items, boxes, and small shipments. Highly maneuverable in tight city streets.', basePrice: '₹50', rate: '₹12 / km' },
  { title: 'Pickup Truck', sub: 'Up to 1.5 Tons', description: 'Ideal for commercial cargo, medium-sized furniture, and construction materials. Offers an open deck layout for easy loading.', basePrice: '₹80', rate: '₹15 / km' },
  { title: '3-Ton Container', sub: 'Up to 3.0 Tons', description: 'Fully enclosed metal container truck. Ideal for high-value logistics, sensitive industrial freight, and heavy distributions.', basePrice: '₹150', rate: '₹20 / km' },
];

const SERVICES = [
  { title: 'Fair Pricing', description: 'No surprise fees. We calculate rates automatically based on your cargo dimensions and shipping weight to ensure honest rates.', img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80', alt: 'Volumetric Pricing' },
  { title: 'Secure Handshakes', description: 'Protect your goods. Drivers must enter a security code sent directly to you at both pickup and drop-off to confirm loading and delivery.', img: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80', alt: 'OTP Security' },
  { title: 'Fast & Direct Routes', description: 'Avoid unnecessary delays. Routes are plotted instantly to find the quickest path, avoiding heavy traffic zones and low-clearance bridges.', img: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?auto=format&fit=crop&w=600&q=80', alt: 'Fast Routes' },
];

const CAPACITY = [
  { title: 'Smart Vehicle Matching', description: 'Our booking system automatically recommends the most cost-effective vehicle class based on your cargo dimensions.', img: 'https://images.unsplash.com/photo-1606185540834-d6e7483ee1a4?auto=format&fit=crop&w=600&q=80', alt: 'Smart Matching' },
  { title: 'On-Demand Booking', description: 'Book mini tempos, utility pickups, or large container trucks instantly whenever you need them—no long-term contracts.', img: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=600&q=80', alt: 'On-Demand' },
  { title: 'Space Optimization', description: 'Never pay for empty cargo space. We organize load layouts to ensure you only pay for the exact volume your boxes require.', img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80', alt: 'Space Optimization' },
];

function FeatureCard({ img, alt, title, description }: { img: string; alt: string; title: string; description: string }) {
  return (
    <div className="group rounded-[var(--radius-card)] border bg-[var(--color-card)] overflow-hidden shadow-sm flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-slate-400" style={{ borderColor: 'var(--color-border)', borderWidth: 'var(--border-width)' }}>
      <div className="h-44 w-full overflow-hidden border-b border-[var(--color-border)] relative">
        <img src={img} alt={alt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
      </div>
      <div className="p-6 space-y-3 flex-1">
        <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>{title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{description}</p>
      </div>
    </div>
  );
}

function SectionHeader({ tag, tagColor, title, subtitle }: { tag?: string; tagColor?: string; title: string; subtitle: string }) {
  return (
    <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
      {tag && <span className={`text-xs font-bold uppercase tracking-wider ${tagColor}`}>{tag}</span>}
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>{title}</h2>
      <p className="text-base font-medium" style={{ color: 'var(--color-text-muted)' }}>{subtitle}</p>
    </div>
  );
}

export function ServicesSection() {
  return (
    <section id="services" className="py-24 px-6 border-t border-b border-[var(--color-border)]" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-[1750px] mx-auto px-4 sm:px-8">
        <SectionHeader title="How We Help You Ship" subtitle="Simple, reliable shipping tools designed to make moving cargo stress-free." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {SERVICES.map((s) => <FeatureCard key={s.title} {...s} />)}
        </div>
      </div>
    </section>
  );
}

export function CapacitySection() {
  return (
    <section className="py-24 px-6 border-b border-[var(--color-border)]" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-[1750px] mx-auto px-4 sm:px-8">
        <SectionHeader tag="Our Vehicles" tagColor="text-indigo-600" title="A Fleet for Any Cargo Size" subtitle="Choose from a wide variety of verified local delivery vehicles to match your load." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {CAPACITY.map((c) => <FeatureCard key={c.title} {...c} />)}
        </div>
      </div>
    </section>
  );
}

export function FleetSection() {
  return (
    <div className="mt-16 space-y-6 text-left">
      <h3 className="text-xl font-bold border-b border-[var(--color-border)] pb-3" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>
        Our Cargo Fleet &amp; Rates
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {FLEET.map((f) => (
          <div key={f.title} className="p-6 rounded-[var(--radius-card)] border bg-[var(--color-card)] flex flex-col justify-between space-y-4" style={{ borderColor: 'var(--color-border)', borderWidth: 'var(--border-width)' }}>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded bg-slate-100 text-slate-700"><Truck size={22} /></div>
                <div>
                  <h4 className="font-extrabold text-base" style={{ color: 'var(--color-text-main)' }}>{f.title}</h4>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-500">{f.sub}</span>
                </div>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{f.description}</p>
            </div>
            <div className="pt-3 border-t border-[var(--color-border)] flex justify-between items-center">
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">Base Price</span>
                <span className="text-base font-extrabold" style={{ color: 'var(--color-text-main)' }}>{f.basePrice}</span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] uppercase font-bold text-slate-400">Distance Rate</span>
                <span className="text-base font-extrabold" style={{ color: 'var(--color-text-main)' }}>{f.rate}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
