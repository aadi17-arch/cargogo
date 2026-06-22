import { useState } from 'react';
import { Check, ExternalLink, Lock } from 'lucide-react';
import ApiDocsModal from './ApiDocsModal';
import StatusModal from './StatusModal';
import SlaModal from './SlaModal';

const NAV_LINKS = [
  { href: '#pricing', label: 'Volumetric Quote Calculator' },
  { href: '#services', label: 'Our Services' },
  { href: '#faq', label: 'FAQ Support' },
  { href: '#support', label: 'Dispatch Helpline' },
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
    setTimeout(() => { setSubmitting(false); setSubscribed(true); }, 800);
  };

  return (
    <>
      <footer className="mt-auto py-16 px-6 border-t border-slate-800 text-sm" style={{ background: 'linear-gradient(to right, #050b14, #101c2c)', color: '#94A3B8' }}>
        <div className="max-w-[1750px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-12 border-b border-slate-800 text-left">

            {/* Brand */}
            <div className="space-y-5">
              <div className="flex items-center">
                <span className="px-2 py-0.5 text-xs font-black tracking-tighter text-[#09121F] bg-white rounded" style={{ fontFamily: 'Space Grotesk' }}>Cargo</span>
                <span className="text-lg font-black tracking-tight text-white ml-1.5" style={{ fontFamily: 'Space Grotesk' }}>Go</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-400 max-w-xs">Next-generation freight coordination, volumetric transit calculation, and secure OTP-verified dispatch networks.</p>
              <div className="flex gap-4 pt-1">
                {[
                  { href: '#linkedin', label: 'LinkedIn', d: 'M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z' },
                  { href: '#twitter', label: 'Twitter/X', d: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
                  { href: '#github', label: 'GitHub', d: 'M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z', fillRule: 'evenodd' as const, clipRule: 'evenodd' as const },
                ].map(({ href, label, d, ...svgProps }) => (
                  <a key={label} href={href} aria-label={label} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded">
                    <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24"><path {...svgProps} d={d} /></svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Platform Nav */}
            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-white">Platform</h4>
              <ul className="space-y-2.5 text-xs">
                {NAV_LINKS.map(({ href, label }) => (
                  <li key={href}><a href={href} className="text-slate-300 hover:text-white transition-colors">{label}</a></li>
                ))}
              </ul>
            </div>

            {/* Developer Hub */}
            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-white">Developer Hub</h4>
              <ul className="space-y-2.5 text-xs">
                <li><button type="button" onClick={() => setApiDocsOpen(true)} className="text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 bg-transparent border-0 p-0 cursor-pointer">API Documentation <ExternalLink size={12} className="text-indigo-400" /></button></li>
                <li><button type="button" onClick={() => setStatusOpen(true)} className="text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 bg-transparent border-0 p-0 cursor-pointer">System Status <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" /></button></li>
                <li><button type="button" onClick={() => setSlaOpen(true)} className="text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 bg-transparent border-0 p-0 cursor-pointer">Enterprise SLA Terms <Lock size={12} className="text-slate-400" /></button></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-white">Insights Newsletter</h4>
              <p className="text-xs leading-relaxed text-slate-300">Get quarterly updates on transit metrics, fuel rates, and direct APIs.</p>
              {subscribed ? (
                <div className="flex items-center gap-2 p-3 bg-slate-900/80 border border-green-800 text-green-400 text-xs rounded font-medium">
                  <Check size={16} /> Subscribed to insights!
                </div>
              ) : (
                <form className="space-y-2" onSubmit={handleNewsletter}>
                  <input type="email" placeholder="corp@address.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 text-xs border rounded bg-slate-900/50 border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500" required />
                  <button type="submit" disabled={submitting} className="w-full px-4 py-2 text-xs font-bold text-[#09121F] bg-white hover:bg-slate-100 rounded transition-colors shadow-sm disabled:opacity-50">
                    {submitting ? 'Subscribing...' : 'Join Insights List'}
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <div className="text-slate-400">&copy; {new Date().getFullYear()} CargoGo Technologies Inc. All rights reserved. &bull; Registered DOT No. 3940822</div>
            <div className="flex gap-6 text-slate-400">
              <button type="button" onClick={() => setSlaOpen(true)} className="hover:text-white transition-colors bg-transparent border-0 p-0 cursor-pointer">Security SLA</button>
              <button type="button" onClick={() => setStatusOpen(true)} className="hover:text-white transition-colors bg-transparent border-0 p-0 cursor-pointer">Platform Status</button>
            </div>
          </div>
        </div>
      </footer>

      {apiDocsOpen && <ApiDocsModal onClose={() => setApiDocsOpen(false)} />}
      {statusOpen  && <StatusModal  onClose={() => setStatusOpen(false)} />}
      {slaOpen     && <SlaModal     onClose={() => setSlaOpen(false)} />}
    </>
  );
}
