import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBooking } from '@/hooks/useBooking';
import { useSocketListener } from '@/hooks/useSocket';
import { bookingService } from '@/services/booking.service';
import { paymentService } from '@/services/payment.service';
import { toast } from 'react-hot-toast';
import { formatDate, formatPrice } from '@/utils/formatters';
import StatusBadge from '@/components/ui/StatusBadge';
import OtpVerifyInput from '@/components/tracking/OtpVerifyInput';
import MapView, { MapMarker } from '@/components/map/MapView';
import BaseModal from '@/components/ui/BaseModal';

function TrackingPage() {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const { confirmPickup, confirmDropoff } = useBooking();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<[number, number] | null>(null);
  const [otp, setOtp] = useState('');
  const [invoice, setInvoice] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const fetchBooking = async () => {
    try {
      const res = await bookingService.getBookingById(bookingId!);
      const data = res as any;
      if (user && data) {
        if (user.role === 'SHIPPER' && data.shipperId !== user.id) {
          toast.error('You are not authorized to track this booking.');
          navigate('/shipper');
          return;
        }
        if (user.role === 'DRIVER' && data.driverId !== user.id) {
          toast.error('You are not authorized to track this booking.');
          navigate('/driver');
          return;
        }
      }
      setBooking(data);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Unauthorized or booking not found.';
      toast.error(errMsg);
      navigate(user?.role === 'DRIVER' ? '/driver' : '/shipper');
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  useSocketListener('driver:location:update', (data: any) => {
    if (data.bookingId === bookingId) setDriverLocation([data.lat, data.lng]);
  }, [bookingId]);

  useSocketListener('driver:arrived', (data: any) => {
    if (data.bookingId === bookingId) { toast.success('Driver has arrived at the destination!'); fetchBooking(); }
  }, [bookingId]);

  useSocketListener('trip:completed', () => {
    toast.success('Trip completed!'); fetchBooking();
  }, [bookingId]);

  const verifyOTP = async (type: 'pickup' | 'dropoff') => {
    try {
      if (type === 'pickup') await confirmPickup(bookingId!, otp);
      else await confirmDropoff(bookingId!, otp);
      toast.success(`${type === 'pickup' ? 'Pickup' : 'Dropoff'} verified!`);
      setOtp('');
      fetchBooking();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Invalid OTP');
    }
  };

  const fetchInvoice = async () => {
    try {
      setInvoice(await bookingService.getInvoice(bookingId!));
    } catch (err) {
      console.error('Failed to fetch invoice:', err);
    }
  };

  const handlePayment = async () => {
    setIsProcessingPayment(true);
    try {
      await paymentService.processCheckout(bookingId!, 'CARD', booking.price);
      toast.success('Payment Successful! Booking status updated to COMPLETED.');
      fetchBooking();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await bookingService.submitReview(bookingId!, rating, comment);
      toast.success('Thank you! Your review has been submitted.');
      setReviewSubmitted(true);
      fetchBooking();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    }
  };

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await bookingService.fileDispute(bookingId!, disputeReason);
      toast.success('Dispute filed successfully. Booking status changed to DISPUTED.');
      setShowDisputeForm(false);
      fetchBooking();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to file dispute');
    }
  };

  useEffect(() => {
    if (booking && ['DELIVERED', 'COMPLETED', 'DISPUTED'].includes(booking.status)) {
      fetchInvoice();
    }
  }, [booking?.status]);

  const mapCenter: [number, number] = useMemo(() => {
    if (!booking) return [19.0760, 72.8777];
    return [booking.pickupLat, booking.pickupLng];
  }, [booking]);

  const mapMarkers = useMemo(() => {
    if (!booking) return [];
    const list: MapMarker[] = [
      { lat: booking.pickupLat, lng: booking.pickupLng, popupText: 'Pickup' },
      { lat: booking.dropoffLat, lng: booking.dropoffLng, popupText: 'Dropoff' }
    ];
    if (driverLocation) {
      list.push({ lat: driverLocation[0], lng: driverLocation[1], popupText: 'Driver', isDriver: true });
    }
    return list;
  }, [booking, driverLocation]);

  const routePolyline = useMemo(() => {
    if (!booking) return [];
    const positions: [number, number][] = [
      [booking.pickupLat, booking.pickupLng],
      [booking.dropoffLat, booking.dropoffLng]
    ];
    return positions;
  }, [booking]);

  const driverPolyline = useMemo(() => {
    if (!booking || !driverLocation) return [];
    const positions: [number, number][] = [
      [booking.pickupLat, booking.pickupLng],
      driverLocation
    ];
    return positions;
  }, [booking, driverLocation]);

  if (!booking) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center font-heading">
        <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold text-slate-500">Retrieving cargo parameters...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight text-slate-800 font-heading">
        Track Delivery
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Map */}
        <div className="lg:col-span-7 h-96 lg:h-[500px] overflow-hidden border border-slate-200 rounded-xl shadow-sm">
          <MapView 
            center={mapCenter} 
            zoom={13} 
            markers={mapMarkers} 
            routePositions={routePolyline} 
            polylineColor="blue"
          >
            {driverLocation && <MapView routePositions={driverPolyline} polylineColor="green" center={mapCenter} />}
          </MapView>
        </div>

        {/* Right Column: Status & Handshakes */}
        <div className="lg:col-span-5 space-y-6">
          {/* Booking info card */}
          <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3 font-body text-xs text-slate-600">
            <h3 className="text-sm font-bold text-slate-800 font-heading">Delivery Parameters</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span>Status:</span>
                <StatusBadge status={booking.status} />
              </div>
              <div className="flex justify-between">
                <span>Cargo Type:</span>
                <span className="font-bold text-slate-800">{booking.cargoType}</span>
              </div>
              <div className="flex justify-between">
                <span>Price:</span>
                <span className="font-bold text-indigo-600 font-mono">{formatPrice(booking.price)}</span>
              </div>
              {booking.createdAt && (
                <div className="flex justify-between">
                  <span>Booked:</span>
                  <span className="font-semibold text-slate-500">{formatDate(booking.createdAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* OTP Handshake — ACCEPTED */}
          {booking.status === 'ACCEPTED' && (
            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm font-body text-xs text-slate-600 space-y-3">
              <h3 className="text-sm font-bold text-slate-800 font-heading">Pickup Verification</h3>
              {user?.role === 'DRIVER' ? (
                <OtpVerifyInput type="pickup" otp={otp} setOtp={setOtp} onVerify={() => verifyOTP('pickup')} />
              ) : (
                <div className="space-y-2">
                  <p className="leading-relaxed text-slate-500">
                    Share this security OTP with the driver partner at the pickup point to authorize the departure:
                  </p>
                  <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl text-center">
                    <span className="font-mono text-2xl font-black text-indigo-600 tracking-wider">
                      {booking.pickupOTP}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* OTP Handshake — IN_TRANSIT */}
          {booking.status === 'IN_TRANSIT' && (
            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm font-body text-xs text-slate-600 space-y-3">
              <h3 className="text-sm font-bold text-slate-800 font-heading">Dropoff Verification</h3>
              {user?.role === 'DRIVER' ? (
                <OtpVerifyInput type="dropoff" otp={otp} setOtp={setOtp} onVerify={() => verifyOTP('dropoff')} />
              ) : (
                <div className="space-y-2">
                  <p className="leading-relaxed text-slate-500">
                    Share this security OTP with the driver partner at the delivery point to confirm completion:
                  </p>
                  <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl text-center">
                    <span className="font-mono text-2xl font-black text-indigo-600 tracking-wider">
                      {booking.dropoffOTP}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DELIVERED — payment prompt */}
          {booking.status === 'DELIVERED' && (
            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm text-center space-y-4 font-body text-xs text-slate-600">
              <p className="text-lg font-black text-emerald-600 font-heading">Package Delivered!</p>
              {user?.role === 'SHIPPER' && (
                <div className="space-y-3 flex flex-col items-center">
                  <p className="leading-relaxed text-slate-500 max-w-sm">
                    Please review the invoice breakdown and finalize your digital dispatch payment.
                  </p>
                  <button
                    onClick={handlePayment}
                    disabled={isProcessingPayment}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 text-xs rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessingPayment ? 'Processing Payment...' : `Pay & Complete Delivery (${formatPrice(booking.price)})`}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* COMPLETED */}
          {booking.status === 'COMPLETED' && (
            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm text-center font-body">
              <p className="text-lg font-black text-emerald-600 font-heading">Delivery Completed & Paid!</p>
            </div>
          )}

          {/* DISPUTED */}
          {booking.status === 'DISPUTED' && (
            <div className="p-6 bg-red-50/50 border border-red-200 rounded-xl shadow-sm text-center font-body space-y-2">
              <p className="text-lg font-black text-red-600 font-heading">Delivery Under Dispute</p>
              <p className="text-xs text-slate-500 leading-normal max-w-sm mx-auto">
                Our support team is reviewing your claim parameters. We will contact you shortly.
              </p>
            </div>
          )}

          {/* Invoice details */}
          {invoice && (
            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4 font-body text-xs text-slate-600">
              <h3 className="text-sm font-bold text-slate-800 font-heading pb-2 border-b border-slate-100">
                Invoice Details
              </h3>
              <div className="space-y-2.5">
                <div className="flex justify-between">
                  <span>Base Fare:</span>
                  <span className="font-bold text-slate-800 font-mono">{formatPrice(invoice.basePrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Distance Charge:</span>
                  <span className="font-bold text-slate-800 font-mono">{formatPrice(invoice.distanceCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Weight Surcharge:</span>
                  <span className="font-bold text-slate-800 font-mono">{formatPrice(invoice.weightCost)}</span>
                </div>
                <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-800 font-heading">Total Charge:</span>
                  <span className="text-lg font-black text-indigo-600 font-heading font-mono">{formatPrice(invoice.totalPrice)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Existing review display */}
          {booking.review && (
            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3 font-body text-xs text-slate-600">
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

          {/* Review form */}
          {booking.status === 'COMPLETED' && user?.role === 'SHIPPER' && !booking.review && !reviewSubmitted && (
            <form onSubmit={handleReviewSubmit} className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4 font-body text-xs text-slate-600">
              <h3 className="text-sm font-bold text-slate-800 font-heading pb-2 border-b border-slate-100">
                Rate Driver Partner
              </h3>
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
              <button 
                type="submit" 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 text-xs rounded-lg transition-colors shadow-sm"
              >
                Submit Rating
              </button>
            </form>
          )}

          {/* Dispute section */}
          {['DELIVERED', 'COMPLETED'].includes(booking.status) && user?.role === 'SHIPPER' && (
            <div className="text-center">
              {!showDisputeForm ? (
                <button 
                  onClick={() => setShowDisputeForm(true)} 
                  className="text-rose-600 hover:text-rose-700 text-xs font-bold underline"
                >
                  File a Dispute / Support Claim
                </button>
              ) : (
                <BaseModal 
                  isOpen={showDisputeForm} 
                  onClose={() => setShowDisputeForm(false)} 
                  title="File a Dispute"
                >
                  <form onSubmit={handleDisputeSubmit} className="space-y-4 text-xs font-body text-slate-600">
                    <p className="text-rose-600 font-medium">
                      Please describe the issue you encountered (e.g., damaged items, delays, driver partner behavior).
                    </p>
                    <div className="space-y-1">
                      <textarea
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        placeholder="Provide details about your support claim..."
                        required
                        className="input-field h-24"
                      />
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setShowDisputeForm(false)}
                        className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                      >
                        Submit Dispute
                      </button>
                    </div>
                  </form>
                </BaseModal>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TrackingPage;
