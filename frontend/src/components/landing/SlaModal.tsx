import { X, Lock } from 'lucide-react';

interface SlaModalProps {
  onClose: () => void;
}

export default function SlaModal({ onClose }: SlaModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-xl text-white shadow-2xl space-y-4">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors bg-transparent border-0 cursor-pointer"
        >
          <X size={18} />
        </button>
        <div className="flex items-center gap-2 text-indigo-400">
          <Lock size={18} />
          <h3 className="text-lg font-bold text-white">Security & SLA Agreement</h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          We offer enterprise-grade service level commitments and security standards to guarantee reliability and compliance.
        </p>
        <div className="space-y-3 text-xs pt-2">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-md">
            <span className="font-bold text-white block mb-1">99.99% Uptime Commitment</span>
            <span className="text-slate-400 text-[11px] leading-relaxed">
              Financial service credits are provided for any unplanned core service interruptions exceeding 0.01% in any billing cycle.
            </span>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-md">
            <span className="font-bold text-white block mb-1">Cryptographic Protection</span>
            <span className="text-slate-400 text-[11px] leading-relaxed">
              All transit logs and client tracking IDs are protected using AES-256 standards with OTP validations.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
