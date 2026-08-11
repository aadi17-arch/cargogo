import BaseModal from '../ui/BaseModal';

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FAQModal({ isOpen, onClose }: FAQModalProps) {
  const faqs = [
    { q: 'How does dispatch work?', a: 'CargoGo matches nearby drivers instantly based on vehicle type and location.' },
    { q: 'What is the OTP key?', a: 'A 4-digit code required at pickup and dropoff to verify package handoff.' },
    { q: 'How are payments handled?', a: 'Pay securely via card after delivery completion.' }
  ];

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="FAQ">
      <div className="divide-y divide-slate-100 border-t border-b border-slate-100">
        {faqs.map((item, idx) => (
          <div key={idx} className="py-3 space-y-1 text-xs text-left">
            <span className="font-bold text-slate-900 block font-heading">{item.q}</span>
            <span className="text-slate-600 block text-[11px] font-body">{item.a}</span>
          </div>
        ))}
      </div>
    </BaseModal>
  );
}
