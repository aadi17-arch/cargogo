import { X } from 'lucide-react';

interface StatusModalProps {
  onClose: () => void;
}

export default function StatusModal({ onClose }: StatusModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-xl text-white shadow-2xl space-y-4">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors bg-transparent border-0 cursor-pointer"
        >
          <X size={18} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
          <h3 className="text-lg font-bold">Platform Status</h3>
        </div>
        <p className="text-xs text-slate-300">
          All core CargoGo networks, tracking channels, and booking gateways are fully operational.
        </p>
        <div className="space-y-3 pt-2">
          {[
            { name: 'Cargo Matching Engine', status: 'Operational' },
            { name: 'OTP SMS Authentication Gateway', status: 'Operational' },
            { name: 'Live GPS Tracking Webhook', status: 'Operational' },
            { name: 'API Server & Developer Portal', status: 'Operational' },
          ].map((service) => (
            <div key={service.name} className="flex justify-between items-center text-xs border-b border-slate-800 pb-2">
              <span className="text-slate-200">{service.name}</span>
              <span className="text-[10px] font-bold text-green-400 bg-green-950/50 border border-green-800 px-1.5 py-0.5 rounded">
                {service.status}
              </span>
            </div>
          ))}
        </div>
        <div className="text-[10px] text-slate-400 text-center pt-2">
          Average API Uptime over last 90 days: <span className="font-bold text-white">99.98%</span>
        </div>
      </div>
    </div>
  );
}
