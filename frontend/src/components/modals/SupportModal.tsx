import BaseModal from '../ui/BaseModal';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Customer Support">
      <div className="space-y-4">
        <p className="text-xs text-slate-500 leading-normal">
          If you encounter any issues during shipment, cargo tracking, driver verification, or payment completion, please reach out to us:
        </p>
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-slate-800">Support Hotline</p>
              <p className="text-xs text-slate-500">24/7 Dispatch and Operations Support</p>
            </div>
            <a href="tel:+18002274646" className="text-sm font-bold text-indigo-600 hover:underline font-mono">
              +1-800-CARGOGO
            </a>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-slate-800">Email Assistance</p>
              <p className="text-xs text-slate-500">For claims, billing, and partner inquiries</p>
            </div>
            <a href="mailto:help@cargogo.com" className="text-sm font-bold text-indigo-600 hover:underline">
              help@cargogo.com
            </a>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 leading-relaxed text-center pt-2">
          Claims for disputes can also be raised directly on the delivery invoice view from the shipment page.
        </div>
      </div>
    </BaseModal>
  );
}
