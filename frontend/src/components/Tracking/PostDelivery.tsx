import { useState } from 'react';
import { Download } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
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
      {/* Delivered Status Card */}
      {booking.status === 'DELIVERED' && (
        <div className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm text-center space-y-4 font-body text-xs text-slate-600">
          <p className="text-lg font-black text-emerald-600 font-heading">Package Delivered!</p>
          {userRole === 'SHIPPER' && (
            <div className="space-y-3 flex flex-col items-center">
              <p className="leading-relaxed text-slate-500 max-w-sm">
                Review your invoice and complete payment for this delivery.
              </p>
              <button
                type="button"
                onClick={onPayment}
                disabled={isProcessingPayment}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 text-xs rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessingPayment ? 'Processing Payment...' : `Pay & Complete Delivery (${formatPrice(booking.price)})`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Completed Status Card */}
      {booking.status === 'COMPLETED' && (
        <div className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm text-center font-body">
          <p className="text-lg font-black text-emerald-600 font-heading">Delivery Completed & Paid!</p>
        </div>
      )}

      {/* Disputed Status Card */}
      {booking.status === 'DISPUTED' && (
        <div className="p-6 bg-white border border-red-200 rounded-lg shadow-sm text-center font-body space-y-2">
          <p className="text-lg font-black text-red-600 font-heading">Delivery Under Dispute</p>
          <p className="text-xs text-slate-500 leading-normal max-w-sm mx-auto">
            Our support team is reviewing your claim parameters. We will contact you shortly.
          </p>
        </div>
      )}

      {/* Invoice Details Card */}
      {invoice && (
        <div className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm space-y-4 font-body text-xs text-slate-600">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 font-heading">Invoice Details</h3>
            <button
              type="button"
              onClick={onDownloadInvoice}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-[#09121F] bg-white rounded hover:bg-slate-100 transition-colors shadow-sm cursor-pointer"
            >
              <Download size={14} />
              Download Invoice
            </button>
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between">
              <span>Base Fare:</span>
              <span className="font-bold text-slate-900 font-heading">₹{Math.round(invoice.basePrice)}</span>
            </div>
            <div className="flex justify-between">
              <span>Distance Charge:</span>
              <span className="font-bold text-slate-900 font-heading">₹{Math.round(invoice.distanceCost)}</span>
            </div>
            <div className="flex justify-between">
              <span>Weight Surcharge:</span>
              <span className="font-bold text-slate-900 font-heading">₹{Math.round(invoice.weightCost)}</span>
            </div>
            <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-900 font-heading">Total Charge:</span>
              <span className="text-base font-extrabold text-slate-900 font-heading">₹{Math.round(invoice.totalPrice)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Customer Feedback Card */}
      {booking.review && (
        <div className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm space-y-3 font-body text-xs text-slate-600">
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
        </div>
      )}

      {/* Review Submission Form */}
      {booking.status === 'COMPLETED' && userRole === 'SHIPPER' && !booking.review && !reviewSubmitted && (
        <form onSubmit={handleReview} className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm space-y-4 font-body text-xs text-slate-600">
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
              className="input-field h-20"
            />
          </div>
          <Button
            type="submit"
            fullWidth
            className="py-2.5 text-xs mt-2"
          >
            Submit Rating
          </Button>
        </form>
      )}

      {/* Dispute Claim Modal & Trigger */}
      {['DELIVERED', 'COMPLETED'].includes(booking.status) && userRole === 'SHIPPER' && (
        <div className="text-center">
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
              maxWidth="md"
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
                    className="input-field text-xs resize-none"
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
