import { useState } from 'react';
import { paymentService } from '@/services/payment.service';
import { toast } from 'react-hot-toast';

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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[2000] p-4">
      <div className="border p-6 max-w-md w-full shadow-none animate-fade-in" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius-card)', fontFamily: 'var(--font-body)' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>Complete Payment</h3>
        <div className="space-y-3 mb-6">
          <p className="text-sm" style={{ color: 'var(--color-text-main)' }}>Cargo: <span className="font-semibold">{booking.cargoType}</span></p>
          <p className="text-sm" style={{ color: 'var(--color-text-main)' }}>Total Amount: <span className="font-bold" style={{ color: 'var(--color-primary)' }}>₹{booking.price}</span></p>
          
          <div>
            <label className="block text-[10px] font-normal tracking-[0.08em] mb-1" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>Select Payment Method</label>
            <select 
              value={paymentMethod} 
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="input-field w-full"
              style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-body)' }}
            >
              <option value="CARD">Credit / Debit Card</option>
              <option value="UPI">UPI (Google Pay / PhonePe)</option>
              <option value="NET_BANKING">Net Banking</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            type="button"
            onClick={onClose} 
            disabled={processingPayment}
            className="flex-1 text-sm font-semibold transition hover:bg-[var(--color-background)]"
            style={{
              backgroundColor: 'var(--color-card)',
              color: 'var(--color-text-muted)',
              border: 'var(--border-width) solid var(--color-input-border)',
              borderRadius: 'var(--radius-button)',
              fontFamily: 'var(--font-heading)'
            }}
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleProcessPayment} 
            disabled={processingPayment}
            className="flex-1 text-white py-2.5 text-sm font-semibold transition flex items-center justify-center gap-1 hover:opacity-90"
            style={{
              backgroundColor: 'var(--color-primary)',
              borderRadius: 'var(--radius-button)',
              fontFamily: 'var(--font-heading)'
            }}
          >
            {processingPayment ? 'Processing...' : `Pay ₹${booking.price}`}
          </button>
        </div>
      </div>
    </div>
  );
}
