import { PhoneCall, Receipt, Truck, Mail, HelpCircle } from 'lucide-react';

const SUPPORT_CHANNELS = [
  {
    title: 'Live Phone Support',
    contact: '+1-800-CARGOGO',
    description: 'Call our direct helpline anytime for urgent help with ongoing deliveries.',
    icon: PhoneCall,
  },
  {
    title: 'Billing & Invoices',
    contact: 'billing@cargogo.com',
    description: 'Get help with price receipts, trip fare breakdown, and GST invoices.',
    icon: Receipt,
  },
  {
    title: 'Driver Support',
    contact: 'drivers@cargogo.com',
    description: 'Help with joining as a driver, vehicle checks, and bank payouts.',
    icon: Truck,
  },
  {
    title: 'General Questions',
    contact: 'help@cargogo.com',
    description: 'Send us an email and our team will reply within a few minutes.',
    icon: Mail,
  },
];

const FAQS = [
  {
    q: 'How is the delivery price calculated?',
    a: 'Your fare is calculated simply using your total cargo weight, the vehicle type you choose, and the exact road distance in kilometers.'
  },
  {
    q: 'How does the secure OTP code work?',
    a: 'When you make a booking, you get two 4-digit codes. The driver enters the first code at pickup to load your goods, and the second code at delivery to confirm you received everything safely.'
  },
  {
    q: 'Can I track my delivery without creating an account?',
    a: 'Yes. Anyone with your unique tracking link can open the map on their phone to see the driver’s live location and estimated arrival time.'
  },
  {
    q: 'What if no driver is nearby right now?',
    a: 'Our system instantly searches nearby roads. If all drivers in your area are busy, we will notify you right away so you can pick another time or truck.'
  }
];

export function FaqSection() {
  return (
    <section id="faq" className="py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <span className="text-xs font-bold text-slate-500">
            Questions &amp; Answers
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 font-heading">
            Common Questions
          </h2>
          <p className="text-sm font-medium text-slate-600 font-body">
            Quick answers about booking trucks, safety codes, and tracking your items.
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
          <span className="text-xs font-bold text-slate-500">
            Help Center
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 font-heading">
            We Are Here to Help
          </h2>
          <p className="text-sm font-medium text-slate-600 font-body">
            Get in touch with our friendly support team anytime day or night.
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
                  <h3 className="text-xs font-bold text-slate-500">{title}</h3>
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
