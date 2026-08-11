import BaseModal from '../ui/BaseModal';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const schemes = [
    { type: 'Mini Tempo', capacity: 'Up to 500 kg', fare: '₹350 base + ₹14/km' },
    { type: 'Pickup Truck', capacity: 'Up to 1.5 Tons', fare: '₹600 base + ₹18/km' },
    { type: '3-Ton Container', capacity: 'Up to 3.0 Tons', fare: '₹1,200 base + ₹25/km' }
  ];

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Pricing">
      <div className="divide-y divide-slate-100 border-t border-b border-slate-100">
        {schemes.map((s, idx) => (
          <div key={idx} className="py-3.5 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-slate-900 block font-heading">{s.type}</span>
              <span className="text-[11px] text-slate-400 font-medium">{s.capacity}</span>
            </div>
            <span className="font-mono font-bold text-slate-900">{s.fare}</span>
          </div>
        ))}
      </div>
    </BaseModal>
  );
}
