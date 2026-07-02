import { useState, useEffect } from 'react';
import { paymentService } from '@/services/payment.service';
import { toast } from 'react-hot-toast';
import BaseModal from '../ui/BaseModal';
import PrimaryButton from '../ui/PrimaryButton';
import { CreditCard, ShieldCheck } from 'lucide-react';

interface PaymentModalProps {
  booking: {
    id: string;
    cargoType: string;
    price: number;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({ booking, onClose, onSuccess }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [processingPayment, setProcessingPayment] = useState(false);

  // Validate cart price edge states
  useEffect(() => {
    if (!booking || booking.price <= 0) {
      toast.error('Invalid checkout transaction. Returning to dashboard.');
      onClose();
    }
  }, [booking, onClose]);

  if (!booking || booking.price <= 0) return null;

  const handleProcessPayment = async () => {
    setProcessingPayment(true);
    try {
      await paymentService.processCheckout(
        booking.id,
        paymentMethod,
        booking.price
      );
      toast.success('Payment successful! Booking completed.');
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <BaseModal isOpen={true} onClose={onClose} title="Billing Information" maxWidth="max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start font-body text-slate-600 relative pb-20 md:pb-0">
        {/* Left Column: Form Fields (Payment Options) */}
        <div className="md:col-span-7 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            <CreditCard size={14} className="text-indigo-500" />
            Billing Information
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 font-heading">
                Payment Channel
              </label>
              <select 
                value={paymentMethod} 
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-3 bg-white text-slate-800 font-medium rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 transition-all text-sm shadow-sm"
              >
                <option value="CARD">Credit / Debit Card</option>
                <option value="UPI">UPI (Google Pay / PhonePe)</option>
                <option value="NET_BANKING">Net Banking</option>
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-2.5 text-xs text-slate-500 leading-normal">
              <ShieldCheck size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Payments are processed securely via SSL encryption handshakes. Disbursals will update driver wallets instantly.</span>
            </div>
          </div>

          {/* Cancel button for desktop */}
          <div className="hidden md:flex gap-2 justify-start pt-4">
            <PrimaryButton 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={processingPayment}
            >
              Go Back
            </PrimaryButton>
          </div>
        </div>

        {/* Right Column: Sticky Summary Box */}
        <div className="md:col-span-5 bg-slate-50 p-5 rounded-xl border border-slate-200/60 space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
            Cost Summary
          </h4>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span>Cargo Type:</span>
              <span className="font-bold text-slate-800">{booking.cargoType}</span>
            </div>
            <div className="flex justify-between">
              <span>Security shake:</span>
              <span className="font-semibold text-slate-500">OTP verified</span>
            </div>
            <div className="flex justify-between">
              <span>Service Fee:</span>
              <span className="font-semibold text-slate-500">₹0 (Waived)</span>
            </div>
          </div>

          <div className="border-t border-slate-200/60 pt-3 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Charge</span>
            <span className="text-3xl font-black text-slate-900 font-heading tracking-tight mt-1">
              ₹{booking.price}
            </span>
          </div>

          {/* Desktop primary confirmation button inside summary box */}
          <div className="hidden md:block">
            <PrimaryButton
              type="button"
              onClick={handleProcessPayment}
              isLoading={processingPayment}
              fullWidth
              className="py-3 text-xs"
            >
              Confirm Payment
            </PrimaryButton>
          </div>
        </div>

        {/* Pinned action buttons on bottom for mobile view */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 z-[2001] flex gap-3 shadow-lg">
          <PrimaryButton 
            type="button" 
            variant="outline" 
            onClick={onClose} 
            disabled={processingPayment}
            className="flex-1 py-3 text-xs"
          >
            Go Back
          </PrimaryButton>
          <PrimaryButton
            type="button"
            onClick={handleProcessPayment}
            isLoading={processingPayment}
            fullWidth
            className="flex-1 py-3 text-xs"
          >
            Confirm Payment
          </PrimaryButton>
        </div>
      </div>
    </BaseModal>
  );
}
