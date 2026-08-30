import { useState } from 'react';
import { Download } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import InfoRow from '@/components/ui/InfoRow';
import { formatPrice } from '@/utils/formatters';

interface PostDeliveryProps {
  booking: any;
  userRole?: string;
  invoice: any;
  isProcessingPayment: boolean;
  onPayment: () => void;
  onReviewSubmit: (rating: number, comment: string) => Promise<void>;
  onDisputeSubmit: (reason: string) => Promise<void>;
  onDownloadInvoice: () => void;
}

export default function PostDelivery({
  booking,
  userRole,
  invoice,
  isProcessingPayment,
  onPayment,
  onReviewSubmit,
  onDisputeSubmit,
  onDownloadInvoice
}: PostDeliveryProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [showDisputeForm, setShowDisputeForm] = useState(false);

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    await onReviewSubmit(rating, comment);
    setReviewSubmitted(true);
  };

  const handleDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    await onDisputeSubmit(disputeReason);
    setShowDisputeForm(false);
  };

  return (
    <>
      
      {booking.status === 'DELIVERED' && (
        <Card size="md" className="text-center space-y-4 text-xs text-slate-600">
          <p className="text-base sm:text-lg font-black text-emerald-600 font-heading">Package Delivered!</p>
          {userRole === 'SHIPPER' && (
            <div className="space-y-3 flex flex-col items-center">
              <p className="leading-relaxed text-slate-500 max-w-sm text-xs">
                Review your invoice and complete payment for this delivery.
              </p>
              <Button
                type="button"
                onClick={onPayment}
                isLoading={isProcessingPayment}
                fullWidth
              >
                Pay & Complete Delivery ({formatPrice(booking.price)})
              </Button>
            </div>
          )}
        </Card>
      )}

      
      {booking.status === 'COMPLETED' && (
        <Card size="md" className="text-center font-body">
          <p className="text-base sm:text-lg font-black text-emerald-600 font-heading">Delivery Completed & Paid!</p>
        </Card>
      )}

      
      {booking.status === 'DISPUTED' && (
        <Card size="md" variant="danger" className="text-center font-body space-y-2">
          <p className="text-base sm:text-lg font-black text-rose-600 font-heading">Delivery Under Dispute</p>
          <p className="text-xs text-slate-500 leading-normal max-w-sm mx-auto">
            Our support team is reviewing your claim parameters. We will contact you shortly.
          </p>
        </Card>
      )}

      
      {invoice && (
        <Card size="md" className="space-y-4 text-xs text-slate-600">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 font-heading">Invoice Details</h3>
            <button
              type="button"
              onClick={onDownloadInvoice}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs cursor-pointer font-heading"
            >
              <Download size={14} />
              Download Invoice
            </button>
          </div>
          <div className="space-y-2.5">
            <InfoRow label="Base Fare:" value={`₹${Math.round(invoice.basePrice)}`} />
            <InfoRow label="Distance Charge:" value={`₹${Math.round(invoice.distanceCost)}`} />
            <InfoRow label="Weight Surcharge:" value={`₹${Math.round(invoice.weightCost)}`} />
            <InfoRow isTotal label="Total Charge:" value={`₹${Math.round(invoice.totalPrice)}`} />
          </div>
        </Card>
      )}

      
      {booking.review && (
        <Card size="md" className="space-y-3 text-xs text-slate-600">
          <h3 className="text-sm font-bold text-slate-800 font-heading pb-2 border-b border-slate-100">
            Customer Feedback
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-lg font-bold">
              {'★'.repeat(booking.review.rating)}{'☆'.repeat(5 - booking.review.rating)}
            </span>
            <span className="font-bold text-slate-700">({booking.review.rating} / 5)</span>
          </div>
          {booking.review.comment && (
            <p className="italic p-3 rounded-lg bg-slate-50 border border-slate-200/60 leading-normal text-slate-500">
              "{booking.review.comment}"
            </p>
          )}
        </Card>
      )}

      
      {booking.status === 'COMPLETED' && userRole === 'SHIPPER' && !booking.review && !reviewSubmitted && (
        <form onSubmit={handleReview} className="p-4 sm:p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4 font-body text-xs text-slate-600">
          <h4 className="text-xs font-bold text-slate-900 font-heading mb-3">
            Rate Driver
          </h4>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">Rating</label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-2xl ${rating >= star ? 'text-amber-400' : 'text-slate-200'} transition-colors cursor-pointer`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share details about your shipment experience..."
              className="w-full p-3 bg-white text-slate-900 placeholder:text-slate-400 font-medium rounded-md border border-slate-200 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all text-xs h-20 resize-none"
            />
          </div>
          <Button
            type="submit"
            fullWidth
            className="h-10 mt-2"
          >
            Submit Rating
          </Button>
        </form>
      )}

      
      {['DELIVERED', 'COMPLETED'].includes(booking.status) && userRole === 'SHIPPER' && (
        <div className="text-center pt-1">
          {!showDisputeForm ? (
            <button
              type="button"
              onClick={() => setShowDisputeForm(true)}
              className="text-rose-600 hover:text-rose-700 text-xs font-bold underline cursor-pointer"
            >
              File a Dispute / Support Claim
            </button>
          ) : (
            <Modal
              isOpen={showDisputeForm}
              onClose={() => setShowDisputeForm(false)}
              title="File Shipment Dispute"
              maxWidth="max-w-md"
            >
              <form onSubmit={handleDispute} className="space-y-4 text-left">
                <p className="text-xs text-slate-500">
                  Please provide details about any cargo damage, billing discrepancy, or delivery issues:
                </p>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500">Dispute Reason</label>
                  <textarea
                    rows={4}
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="Describe what went wrong with this shipment..."
                    className="w-full p-3 bg-white text-slate-900 placeholder:text-slate-400 font-medium rounded-md border border-slate-200 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all text-xs resize-none"
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDisputeForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="danger"
                  >
                    Submit Dispute
                  </Button>
                </div>
              </form>
            </Modal>
          )}
        </div>
      )}
    </>
  );
}
