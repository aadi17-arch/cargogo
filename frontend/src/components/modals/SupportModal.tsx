import BaseModal from '../ui/BaseModal';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Support">
      <div className="divide-y divide-slate-100 border-t border-b border-slate-100">
        <div className="py-3.5 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-900 font-heading">Hotline</span>
          <a href="tel:+18002274646" className="font-mono font-bold text-slate-900 hover:underline">
            +1-800-CARGOGO
          </a>
        </div>
        <div className="py-3.5 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-900 font-heading">Email</span>
          <a href="mailto:help@cargogo.com" className="font-bold text-slate-900 hover:underline">
            help@cargogo.com
          </a>
        </div>
      </div>
    </BaseModal>
  );
}
