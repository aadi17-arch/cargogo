import BaseModal from '../ui/BaseModal';

interface ServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ServicesModal({ isOpen, onClose }: ServicesModalProps) {
  const services = [
    'Intracity Express Delivery',
    'OTP Secure Handshake',
    'Dynamic Capacity Routing',
    'Realtime GPS Tracking'
  ];

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Services">
      <div className="divide-y divide-slate-100 border-t border-b border-slate-100">
        {services.map((title, idx) => (
          <div key={idx} className="py-3 flex items-center justify-between text-xs font-bold text-slate-900 font-heading">
            <span>{title}</span>
            <span className="text-slate-400 text-sm">✓</span>
          </div>
        ))}
      </div>
    </BaseModal>
  );
}
