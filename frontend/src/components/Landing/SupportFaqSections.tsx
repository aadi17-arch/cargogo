import { PhoneCall, Receipt, Truck, Mail, HelpCircle } from 'lucide-react';

const SUPPORT_CHANNELS = [
  {
    title: '24/7 Dispatch Control',
    contact: '+1-800-CARGOGO',
    description: 'Direct phone line to our operational center for live route or load exceptions.',
    icon: PhoneCall,
  },
  {
    title: 'Billing & Invoicing',
    contact: 'billing@cargogo.com',
    description: 'Assistance with volumetric quotes, digital receipts, and GST invoices.',
    icon: Receipt,
  },
  {
    title: 'Driver Partner Care',
    contact: 'drivers@cargogo.com',
    description: 'Vehicle onboarding, bank settlement, and app verification support.',
    icon: Truck,
  },
  {
    title: 'General Support',
    contact: 'help@cargogo.com',
    description: 'General platform inquiries with typical response time under 15 minutes.',
    icon: Mail,
  },
];

const FAQS = [
  {
    q: 'How is shipment pricing calculated?',
    a: 'Our volumetric engine calculates the package dimensional weight (Length × Width × Height ÷ 5000) and compares it with actual weight. You are only charged for whichever value is greater, multiplied by standard road distance.'
  },
  {
    q: 'How does the OTP verification handshake work?',
    a: 'Upon booking creation, you receive two secure 4-digit codes: Pickup OTP and Drop-off OTP. The assigned driver partner must enter these codes in their terminal to authorize physical loading and completed unloading.'
  },
  {
    q: 'Can I track my cargo in real time without registering?',
    a: 'Yes. Anyone with a valid Booking UUID can access the public tracking URL to view live driver GPS coordinates, vehicle details, and route progress.'
  },
  {
    q: 'What happens if no driver is available nearby?',
    a: 'Our dispatch engine broadcasts your request in expanding radiuses for 60 seconds. If all local partners are busy, you will be notified immediately so you can adjust your schedule or retry.'
  }
];

export function FaqSection() {
  return (
    <section id="faq" className="py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Frequently Asked Questions
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 font-heading">
            Everything You Need to Know
          </h2>
          <p className="text-sm font-medium text-slate-600 font-body">
            Common questions regarding freight calculation, OTP security, and delivery handoffs.
          </p>
        </div>

        <div className="max-w-3xl mx-auto divide-y divide-slate-200 border-t border-b border-slate-200 text-left">
          {FAQS.map(({ q, a }) => (
            <div key={q} className="py-5 space-y-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 font-heading flex items-start gap-2.5">
                <HelpCircle size={18} className="text-slate-400 shrink-0 mt-0.5" />
                <span>{q}</span>
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-600 font-body pl-7">
                {a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SupportSection() {
  return (
    <section id="support" className="py-20 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Help Center
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 font-heading">
            Here to Help 24/7
          </h2>
          <p className="text-sm font-medium text-slate-600 font-body">
            Our operational team is standing by around the clock to support your shipments.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          {SUPPORT_CHANNELS.map(({ title, contact, description, icon: Icon }) => (
            <div
              key={title}
              className="p-6 rounded-lg border border-slate-200 bg-white shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900">
                  <Icon size={20} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</h3>
                  <p className="text-sm font-black text-slate-900 font-heading">{contact}</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 font-body pt-3 border-t border-slate-100">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
