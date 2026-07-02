import BaseModal from '../ui/BaseModal';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const schemes = [
    { type: 'Mini Tempo', capacity: '1,000 kg', base: '₹350', perKm: '₹14', perKg: '₹2.5' },
    { type: 'Pickup Truck', capacity: '2,000 kg', base: '₹600', perKm: '₹18', perKg: '₹3.5' },
    { type: '3-Ton Container', capacity: '3,000 kg', base: '₹1,200', perKm: '₹25', perKg: '₹5.0' }
  ];

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Pricing Plans">
      <div className="space-y-4">
        <p className="text-xs text-slate-500 leading-normal mb-2">
          CargoGo computes transparent dynamic rates based on base fare, total travel distance, and total cargo chargeable weight:
        </p>
        <div className="overflow-x-auto border border-slate-100 rounded-lg">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-700">
                <th className="p-3">Vehicle Type</th>
                <th className="p-3">Capacity</th>
                <th className="p-3">Base</th>
                <th className="p-3">Dist Rate</th>
                <th className="p-3">Weight Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {schemes.map((s, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="p-3 font-semibold text-slate-800">{s.type}</td>
                  <td className="p-3">{s.capacity}</td>
                  <td className="p-3">{s.base}</td>
                  <td className="p-3">{s.perKm}/km</td>
                  <td className="p-3">{s.perKg}/kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-indigo-50/50 border border-indigo-100/50 rounded-lg text-[11px] text-indigo-700 leading-relaxed font-medium">
          <strong>Note:</strong> Chargeable weight represents the higher value between physical scale weight and volumetric weight based on outer box package sizing.
        </div>
      </div>
    </BaseModal>
  );
}
