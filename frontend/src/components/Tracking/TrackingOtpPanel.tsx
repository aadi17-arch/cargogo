import { Copy } from 'lucide-react';
import OtpVerifyInput from '@/components/Tracking/OtpVerifyInput';
import toast from 'react-hot-toast';

interface TrackingOtpPanelProps {
  status: string;
  userRole?: string;
  pickupOTP: string;
  dropoffOTP: string;
  otp: string;
  setOtp: (val: string) => void;
  onVerify: (type: 'pickup' | 'dropoff') => void;
}

export default function TrackingOtpPanel({
  status,
  userRole,
  pickupOTP,
  dropoffOTP,
  otp,
  setOtp,
  onVerify
}: TrackingOtpPanelProps) {
  if (status === 'ACCEPTED') {
    return (
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs font-body text-xs text-slate-600 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 font-heading">Pickup Verification</h3>
        {userRole === 'DRIVER' ? (
          <OtpVerifyInput type="pickup" otp={otp} setOtp={setOtp} onVerify={() => onVerify('pickup')} />
        ) : (
          <div className="space-y-3 text-center">
            <p className="leading-relaxed text-slate-500 text-xs text-left">
              Share this pickup code with your driver:
            </p>
            <div className="py-2 px-4 bg-slate-50 rounded-lg inline-block border border-slate-200">
              <span className="font-mono text-2xl font-black text-slate-900 tracking-widest">
                {pickupOTP}
              </span>
            </div>
            <div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(pickupOTP);
                  toast.success('Pickup code copied!');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer font-heading"
              >
                <Copy size={13} />
                Copy Code
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (status === 'IN_TRANSIT') {
    return (
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs font-body text-xs text-slate-600 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 font-heading">Drop-off Verification</h3>
        {userRole === 'DRIVER' ? (
          <OtpVerifyInput type="dropoff" otp={otp} setOtp={setOtp} onVerify={() => onVerify('dropoff')} />
        ) : (
          <div className="space-y-3 text-center">
            <p className="leading-relaxed text-slate-500 text-xs text-left">
              Share this drop-off code with your driver:
            </p>
            <div className="py-2 px-4 bg-slate-50 rounded-lg inline-block border border-slate-200">
              <span className="font-mono text-2xl font-black text-slate-900 tracking-widest">
                {dropoffOTP}
              </span>
            </div>
            <div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(dropoffOTP);
                  toast.success('Drop-off code copied!');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer font-heading"
              >
                <Copy size={13} />
                Copy Code
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
