import { Lock } from 'lucide-react';
import ContentModal from './ContentModal';

interface SlaModalProps {
  onClose: () => void;
}

export default function SlaModal({ onClose }: SlaModalProps) {
  return (
    <ContentModal
      isOpen={true}
      onClose={onClose}
      title="Security & SLA Agreement"
      icon={<Lock size={18} className="text-indigo-400" />}
      subtitle="We offer enterprise-grade service level commitments and security standards to guarantee reliability and compliance."
    >
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
    </ContentModal>
  );
}
