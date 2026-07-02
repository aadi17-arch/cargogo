import BaseModal from '../ui/BaseModal';

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FAQModal({ isOpen, onClose }: FAQModalProps) {
  const faqs = [
    {
      q: 'How does CargoGo match drivers and shippers?',
      a: 'We use a dynamic local dispatch queue. When a shipper creates a delivery, our system alerts available drivers matching the specific vehicle type requirements in the geographical radius.'
    },
    {
      q: 'What is the purpose of OTP handshake keys?',
      a: 'To guarantee delivery security, shippers share dynamic 4-digit OTP handshakes with drivers. Driver partners enter these codes at pickup and drop-off points to trigger state verification.'
    },
    {
      q: 'How are volumetric weights billed?',
      a: 'Our billing scheme calculates chargeable weight based on the maximum value between actual weight and dimensional volumetric weight, computed as (L × W × H) / 5000.'
    },
    {
      q: 'Who handles payment collection?',
      a: 'Shippers pay securely via the app using digital cards once the package is marked as Delivered. Driver earnings are then disbursed directly to their registered driver wallets.'
    }
  ];

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Frequently Asked Questions">
      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div key={idx} className="p-4 rounded-lg bg-slate-50 border border-slate-100">
            <h4 className="font-bold text-slate-800 mb-1.5 font-heading text-sm">{faq.q}</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-body">{faq.a}</p>
          </div>
        ))}
      </div>
    </BaseModal>
  );
}
