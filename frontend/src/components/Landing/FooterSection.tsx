import { useState } from 'react';
import { Check, ExternalLink, Lock } from 'lucide-react';
import ApiDocsModal from './ApiDocsModal';
import StatusModal from './StatusModal';
import SlaModal from './SlaModal';

const NAV_LINKS = [
  { href: '#pricing', label: 'Price Estimator' },
  { href: '#services', label: 'Capabilities' },
  { href: '#shippers', label: 'For Shippers' },
  { href: '#drivers', label: 'For Drivers' },
  { href: '#faq', label: 'FAQ' },
  { href: '#support', label: '24/7 Helpline' },
];

export default function FooterSection() {
  const [apiDocsOpen, setApiDocsOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [slaOpen, setSlaOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubscribed(true);
    }, 600);
  };

  return (
    <>
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800 text-left">
            {/* Column 1: Brand & Summary */}
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 font-tech-space">
                <span className="px-2 py-0.5 text-xs font-black text-slate-950 bg-white rounded shadow-sm">
                  Cargo
                </span>
                <span className="text-xl font-bold text-white tracking-tight">
                  Go
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-400 max-w-xs font-body">
                Next-generation freight dispatch, volumetric calculation engine, and dual OTP-verified cargo coordination.
              </p>
            </div>

            {/* Column 2: Navigation Links */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-white font-heading">
                Platform
              </h4>
              <ul className="space-y-2">
                {NAV_LINKS.map(({ href, label }) => (
                  <li key={href}>
                    <a href={href} className="text-slate-400 hover:text-white transition-colors">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Developer & Operational Hub */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-white font-heading">
                Resources
              </h4>
              <ul className="space-y-2">
                <li>
                  <button
                    type="button"
                    onClick={() => setApiDocsOpen(true)}
                    className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 bg-transparent border-0 p-0 cursor-pointer"
                  >
                    <span>REST &amp; Socket APIs</span>
                    <ExternalLink size={12} className="text-slate-400" />
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setStatusOpen(true)}
                    className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 bg-transparent border-0 p-0 cursor-pointer"
                  >
                    <span>System Status</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setSlaOpen(true)}
                    className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 bg-transparent border-0 p-0 cursor-pointer"
                  >
                    <span>Enterprise SLA Terms</span>
                    <Lock size={12} className="text-slate-500" />
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Newsletter */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-white font-heading">
                Logistics Newsletter
              </h4>
              <p className="text-xs leading-relaxed text-slate-400">
                Quarterly updates on fuel indices, freight lanes, and API updates.
              </p>
              {subscribed ? (
                <div className="flex items-center gap-2 p-3 bg-slate-900 border border-emerald-500/50 text-emerald-400 text-xs rounded-lg font-medium">
                  <Check size={14} /> Subscribed to updates!
                </div>
              ) : (
                <form className="space-y-2" onSubmit={handleNewsletter}>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-9 px-3 text-xs border rounded-lg bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-slate-600"
                    required
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-9 px-4 text-xs font-bold text-slate-950 bg-white hover:bg-slate-100 rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'Subscribing...' : 'Subscribe'}
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-500 text-xs">
            <div>&copy; {new Date().getFullYear()} CargoGo Inc. All rights reserved. &bull; Registered DOT No. 3940822</div>
            <div className="flex gap-6">
              <button type="button" onClick={() => setSlaOpen(true)} className="hover:text-white transition-colors bg-transparent border-0 p-0 cursor-pointer">
                Security SLA
              </button>
              <button type="button" onClick={() => setStatusOpen(true)} className="hover:text-white transition-colors bg-transparent border-0 p-0 cursor-pointer">
                Status Monitor
              </button>
            </div>
          </div>
        </div>
      </footer>

      {apiDocsOpen && <ApiDocsModal onClose={() => setApiDocsOpen(false)} />}
      {statusOpen && <StatusModal onClose={() => setStatusOpen(false)} />}
      {slaOpen && <SlaModal onClose={() => setSlaOpen(false)} />}
    </>
  );
}
