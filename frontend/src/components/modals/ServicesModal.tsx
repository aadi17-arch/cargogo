import BaseModal from '../ui/BaseModal';

interface ServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ServicesModal({ isOpen, onClose }: ServicesModalProps) {
  const services = [
    { title: 'Intracity Express', desc: 'Guaranteed point-to-point same day cargo shipments and instant truck match-making in local zones.' },
    { title: 'OTP Handshake Verification', desc: 'Secure high-value freights with matching dynamic codes shared strictly with shipper/driver endpoints.' },
    { title: 'Dynamic Capacity Routing', desc: 'Drivers can easily plan stop-by-stop dispatch timelines optimized for vehicle payload capacities.' },
    { title: 'Realtime Fleet Tracking', desc: 'Shippers monitor active trucks via live GPS coordinate streams embedded in standard maps.' }
  ];

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Logistics Services">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((s, idx) => (
          <div key={idx} className="p-4 border border-slate-100 rounded-lg hover:border-slate-200 transition-colors">
            <h4 className="font-bold text-slate-800 font-heading mb-1 text-sm">{s.title}</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-body">{s.desc}</p>
          </div>
        ))}
      </div>
    </BaseModal>
  );
}
