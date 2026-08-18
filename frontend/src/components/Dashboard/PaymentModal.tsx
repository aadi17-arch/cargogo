import { useState, useEffect } from 'react';
import { paymentService } from '@/services/payment.service';
import { toast } from 'react-hot-toast';
import BaseModal from '../UI/BaseModal';
import { CreditCard, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface PaymentModalProps {
  booking: {
    id: string;
    cargoType: string;
    price: number;
  };
  onClose: () => void;
  onSuccess: () => void;
}

const PAYMENT_METHODS = [
  { id: 'CARD', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay, Amex' },
  { id: 'UPI', label: 'UPI', desc: 'Google Pay, PhonePe, Paytm' },
  { id: 'NET_BANKING', label: 'Net Banking', desc: 'All major Indian banks' },
];

export default function PaymentModal({ booking, onClose, onSuccess }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [processingPayment, setProcessingPayment] = useState(false);

  
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
        {}
        <div className="md:col-span-7 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            <CreditCard size={14} className="text-indigo-500" />
            Payment Channel
          </div>

          <div className="space-y-2.5">
            {PAYMENT_METHODS.map((method) => {
              const isSelected = paymentMethod === method.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className={`block text-sm font-bold ${isSelected ? 'text-indigo-700' : 'text-slate-800'}`}>
                      {method.label}
                    </span>
                    <span className="block text-[11px] text-slate-500">{method.desc}</span>
                  </div>
                  <span
                    className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? 'border-indigo-600' : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <CheckCircle2 size={14} className="text-indigo-600" />}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-slate-500 leading-normal">
            <ShieldCheck size={16} className="text-emerald-500 shrink-0 mt-0.5" />
            <span>Payments are processed securely via SSL encryption handshakes. Disbursals will update driver wallets instantly.</span>
          </div>
        </div>

        {}
        <div className="md:col-span-5 bg-slate-50 p-5 rounded-xl border border-slate-200/70 space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
            Cost Summary
          </h4>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Cargo Type:</span>
              <span className="font-bold text-slate-800">{booking.cargoType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Security shake:</span>
              <span className="font-semibold text-emerald-600">OTP verified</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Service Fee:</span>
              <span className="font-semibold text-slate-500">₹0 (Waived)</span>
            </div>
          </div>

          <div className="border-t border-slate-200/70 pt-3 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Charge</span>
            <span className="text-3xl font-black text-slate-900 font-heading tracking-tight mt-1">
              ₹{booking.price}
            </span>
          </div>

          {}
          <div className="hidden md:block">
            <button
              type="button"
              onClick={handleProcessPayment}
              disabled={processingPayment}
              className="dash-btn-primary"
            >
              {processingPayment ? 'Processing...' : 'Confirm Payment'}
            </button>
          </div>
        </div>

        {}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-[2001] flex gap-3 shadow-[0_-4px_12px_-4px_rgb(15_23_42_/_0.08)]">
          <button
            type="button"
            onClick={onClose}
            disabled={processingPayment}
            className="flex-1 h-12 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors"
          >
            Go Back
          </button>
          <button
            type="button"
            onClick={handleProcessPayment}
            disabled={processingPayment}
            className="flex-1 dash-btn-primary"
          >
            {processingPayment ? 'Processing...' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
