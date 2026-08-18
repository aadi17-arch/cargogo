import { ShieldCheck, Route, Scale, Clock, Lock, Sparkles } from 'lucide-react';

const BENEFITS = [
  {
    title: 'Volumetric Precision',
    description: 'Automatic mass and dimensional calculations ensure you never overpay for empty cargo space.',
    icon: Scale,
  },
  {
    title: 'Dual OTP Handshake',
    description: 'Secure 4-digit verification keys required at both pickup and drop-off to protect your shipments.',
    icon: Lock,
  },
  {
    title: 'Live GPS Tracking',
    description: 'Track driver progress in real time with continuous route plotting and live location updates.',
    icon: Route,
  },
  {
    title: 'Instant Driver Matching',
    description: 'Immediate geo-radius dispatch connects your cargo with the nearest available verified partner.',
    icon: Sparkles,
  },
  {
    title: 'Direct Payouts',
    description: 'Zero hidden intermediary cuts. Honest base fares that benefit both shippers and driver partners.',
    icon: ShieldCheck,
  },
  {
    title: '24/7 Dispatch Care',
    description: 'Real-time live chat assistance and dedicated phone hotline to resolve any transit exceptions.',
    icon: Clock,
  },
];

export function ServicesSection() {
  return (
    <section id="services" className="py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <span className="text-xs font-bold text-slate-500">
            Platform Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 font-heading">
            How We Help You Ship
          </h2>
          <p className="text-sm font-medium text-slate-600 font-body">
            Streamlined freight technology built to eliminate logistical friction and secure your loads.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BENEFITS.map(({ title, description, icon: Icon }) => (
            <div
              key={title}
              className="p-6 rounded-lg border border-slate-200 bg-white shadow-sm flex flex-col justify-between space-y-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300 text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 shrink-0">
                <Icon size={20} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900 font-heading">{title}</h3>
                <p className="text-xs leading-relaxed text-slate-600 font-body">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
