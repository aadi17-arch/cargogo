import { PhoneCall, Receipt, Truck, Mail } from 'lucide-react';

const SUPPORT = [
  { title: '24/7 Dispatch Hotline', sub: '+1-800-CARGOGO', description: 'Direct line to active dispatch agents standing by to secure your cargo lanes.', Icon: PhoneCall },
  { title: 'Billing & Rates', sub: 'billing@cargogo.com', description: 'Invoice & volumetric quote inquiries.', Icon: Receipt },
  { title: 'Driver Assistance', sub: 'drivers@cargogo.com', description: 'Dedicated support for payout & match issues.', Icon: Truck },
  { title: 'General Support', sub: 'help@cargogo.com', description: 'General platform questions (15-min response).', Icon: Mail },
];

const FAQS = [
  { q: 'How is shipment pricing calculated?', a: 'Our volumetric engine takes your cargo dimensions (Length × Width × Height) and computes volumetric weight. The quote uses the larger value between actual weight and volumetric weight, multiplied by the distance.' },
  { q: 'What is the OTP verification system?', a: 'To ensure cargo safety, the shipper receives a secure Pickup OTP and a Drop-off OTP. The matched driver must input these keys at both points to confirm shipment transfers in the ledger.' },
  { q: 'Can I cancel a booking?', a: 'Yes. You can cancel any cargo request directly from your shipper dashboard as long as a driver has not accepted/claimed it.' },
];

export function FaqSection() {
  return (
    <section id="faq" className="py-24 px-6 border-b border-[var(--color-border)]" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-[1750px] mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start text-left">
          <div className="lg:col-span-5 space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">FAQ</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>Frequently Asked Questions</h2>
            <p className="text-base font-medium" style={{ color: 'var(--color-text-muted)' }}>Everything you need to know about booking, volumetric pricing calculation, and OTP safety verification.</p>
            <div className="h-64 rounded-[var(--radius-card)] overflow-hidden border border-[var(--color-border)] shadow-sm">
              <img src="https://images.unsplash.com/photo-1521791136368-1a8519007b51?auto=format&fit=crop&w=800&q=80" alt="Customer support" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="lg:col-span-7 space-y-6">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="p-5 border border-[var(--color-border)] rounded-[var(--radius-card)] bg-[var(--color-background)]">
                <h4 className="font-bold text-md mb-2" style={{ color: 'var(--color-text-main)' }}>{q}</h4>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function SupportSection() {
  return (
    <section id="support" className="py-24 px-6" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-[1750px] mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-left">
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Support</span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>Here to Help 24/7</h2>
              <p className="text-base font-medium" style={{ color: 'var(--color-text-muted)' }}>Our dedicated dispatch support team is always standing by to secure your cargo lanes.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {SUPPORT.map(({ title, sub, description, Icon }) => (
                <div key={title} className="p-5 border border-[var(--color-border)] rounded-[var(--radius-card)] bg-[var(--color-card)] space-y-3 shadow-sm flex items-start gap-4">
                  <div className="p-2.5 bg-slate-100 rounded-lg text-slate-600 mt-1"><Icon size={20} /></div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm" style={{ color: 'var(--color-text-main)' }}>{title}</h4>
                    <p className="text-md font-bold" style={{ color: 'var(--color-text-main)' }}>{sub}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden lg:block lg:col-span-5 h-[340px] rounded-[var(--radius-card)] overflow-hidden border border-[var(--color-border)] shadow-sm">
            <img src="https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&w=800&q=80" alt="Support helpline" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}
