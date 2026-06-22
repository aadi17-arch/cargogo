import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { useAuth } from '@/hooks/useAuth';
import { useBooking } from '@/hooks/useBooking';
import { useSocketListener } from '@/hooks/useSocket';
import { bookingService } from '@/services/booking.service';
import { paymentService } from '@/services/payment.service';
import { toast } from 'react-hot-toast';
import { formatDate, formatPrice } from '@/utils/formatters';
import StatusBadge from '@/components/ui/StatusBadge';
import OtpVerifyInput from '@/components/tracking/OtpVerifyInput';
import 'leaflet/dist/leaflet.css';


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
    try {
      await paymentService.processCheckout(bookingId!, 'CARD', booking.price);
      toast.success('Payment Successful! Booking status updated to COMPLETED.');
      fetchBooking();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Payment failed');
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

  if (!booking) return <div>Loading...</div>;

  const pickup: [number, number] = [booking.pickupLat, booking.pickupLng];
  const dropoff: [number, number] = [booking.dropoffLat, booking.dropoffLng];

  return (
    <div className="space-y-6">
      <h2
        className="text-[24px] font-bold tracking-tight"
        style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}
      >
        Track Delivery
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Map */}
        <div className="space-y-6">
          <div className="h-96 lg:h-[600px] overflow-hidden shadow-none card">
            <MapContainer center={pickup} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={pickup}><Popup>Pickup</Popup></Marker>
              <Marker position={dropoff}><Popup>Dropoff</Popup></Marker>
              {driverLocation && <Marker position={driverLocation}><Popup>Driver</Popup></Marker>}
              <Polyline positions={[pickup, dropoff]} color="blue" />
              {driverLocation && <Polyline positions={[pickup, driverLocation]} color="green" />}
            </MapContainer>
          </div>
        </div>

        {/* Right Column: Details & Actions */}
        <div className="space-y-6">
          {/* Booking info card */}
          <div className="p-6 shadow-none space-y-2 card" style={{ fontFamily: 'var(--font-body)' }}>
            <p className="text-sm flex items-center gap-2" style={{ color: 'var(--color-text-main)' }}>
              Status: <StatusBadge status={booking.status} />
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-main)' }}>
              Cargo: <span className="font-semibold">{booking.cargoType}</span>
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-main)' }}>
              Price: <span className="font-bold" style={{ color: 'var(--color-primary)' }}>{formatPrice(booking.price)}</span>
            </p>
            {booking.createdAt && (
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Booked: {formatDate(booking.createdAt)}
              </p>
            )}
          </div>

          {/* OTP Verify — ACCEPTED */}
          {booking.status === 'ACCEPTED' && (
            <div className="p-6 shadow-none card" style={{ fontFamily: 'var(--font-body)' }}>
              {user?.role === 'DRIVER' ? (
                <OtpVerifyInput type="pickup" otp={otp} setOtp={setOtp} onVerify={() => verifyOTP('pickup')} />
              ) : (
                <p className="font-semibold text-sm" style={{ color: 'var(--color-text-main)' }}>
                  Share this OTP with the driver to start the delivery:{' '}
                  <span
                    className="border px-3 py-1 font-mono text-xl ml-2 font-bold"
                    style={{
                      backgroundColor: 'var(--color-background)',
                      borderColor: 'var(--color-border)',
                      borderRadius: 'var(--radius-card)',
                      color: 'var(--color-primary)',
                    }}
                  >
                    {booking.pickupOTP}
                  </span>
                </p>
              )}
            </div>
          )}

          {/* OTP Verify — IN_TRANSIT */}
          {booking.status === 'IN_TRANSIT' && (
            <div className="p-6 shadow-none card" style={{ fontFamily: 'var(--font-body)' }}>
              {user?.role === 'DRIVER' ? (
                <OtpVerifyInput type="dropoff" otp={otp} setOtp={setOtp} onVerify={() => verifyOTP('dropoff')} />
              ) : (
                <p className="font-semibold text-sm" style={{ color: 'var(--color-text-main)' }}>
                  Share this OTP with the driver to complete the delivery:{' '}
                  <span
                    className="border px-3 py-1 font-mono text-xl ml-2 font-bold"
                    style={{
                      backgroundColor: 'var(--color-background)',
                      borderColor: 'var(--color-border)',
                      borderRadius: 'var(--radius-card)',
                      color: 'var(--color-primary)',
                    }}
                  >
                    {booking.dropoffOTP}
                  </span>
                </p>
              )}
            </div>
          )}

          {/* DELIVERED — payment prompt */}
          {booking.status === 'DELIVERED' && (
            <div className="p-6 shadow-none text-center space-y-4 card" style={{ fontFamily: 'var(--font-body)' }}>
              <p className="text-xl font-bold" style={{ color: 'var(--color-status-delivered)' }}>Package Delivered!</p>
              {user?.role === 'SHIPPER' && (
                <div className="flex flex-col items-center">
                  <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                    Please review the invoice details below and complete the payment.
                  </p>
                  <button
                    onClick={handlePayment}
                    className="text-white font-bold px-6 py-2.5 text-sm transition hover:opacity-90"
                    style={{ backgroundColor: 'var(--color-primary)', borderRadius: 'var(--radius-button)', fontFamily: 'var(--font-heading)' }}
                  >
                    Pay & Complete Delivery ({formatPrice(booking.price)})
                  </button>
                </div>
              )}
            </div>
          )}

          {/* COMPLETED */}
          {booking.status === 'COMPLETED' && (
            <div className="p-6 shadow-none text-center card" style={{ fontFamily: 'var(--font-body)' }}>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-status-completed)' }}>Delivery Completed & Paid!</p>
            </div>
          )}

          {/* DISPUTED */}
          {booking.status === 'DISPUTED' && (
            <div className="p-6 shadow-none text-center card-danger" style={{ fontFamily: 'var(--font-body)' }}>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-status-cancelled)' }}>Delivery Under Dispute</p>
              <p className="mt-2" style={{ color: 'var(--color-text-muted)' }}>
                Our support team is currently reviewing your claim. We will contact you shortly.
              </p>
            </div>
          )}

          {/* Invoice */}
          {invoice && (
            <div className="p-6 shadow-none space-y-4 card" style={{ fontFamily: 'var(--font-body)' }}>
              <h3 className="text-xl font-semibold pb-2 border-b" style={{ color: 'var(--color-text-main)', borderColor: 'var(--color-border)', fontFamily: 'var(--font-heading)' }}>
                Invoice Details
              </h3>
              <div className="grid grid-cols-2 gap-y-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                <span>Base Fare:</span>
                <span className="font-semibold text-right" style={{ color: 'var(--color-text-main)' }}>{formatPrice(invoice.basePrice)}</span>
                <span>Distance Charge:</span>
                <span className="font-semibold text-right" style={{ color: 'var(--color-text-main)' }}>{formatPrice(invoice.distanceCost)}</span>
                <span>Weight Surcharge:</span>
                <span className="font-semibold text-right" style={{ color: 'var(--color-text-main)' }}>{formatPrice(invoice.weightCost)}</span>
                <div className="col-span-2 border-t my-2" style={{ borderColor: 'var(--color-border)' }}></div>
                <span className="text-sm font-bold" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>Total Price:</span>
                <span className="text-lg font-bold text-right" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-heading)' }}>{formatPrice(invoice.totalPrice)}</span>
              </div>
            </div>
          )}

          {/* Existing review display */}
          {booking.review && (
            <div className="p-6 shadow-none space-y-3 card" style={{ fontFamily: 'var(--font-body)' }}>
              <h3 className="text-xl font-semibold pb-2 border-b" style={{ color: 'var(--color-text-main)', borderColor: 'var(--color-border)', fontFamily: 'var(--font-heading)' }}>
                Customer Feedback
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 text-xl font-bold">
                  {'★'.repeat(booking.review.rating)}{'☆'.repeat(5 - booking.review.rating)}
                </span>
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text-main)' }}>({booking.review.rating} / 5 stars)</span>
              </div>
              {booking.review.comment && (
                <p className="text-sm italic p-4 border mt-2" style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius-card)', color: 'var(--color-text-main)' }}>
                  "{booking.review.comment}"
                </p>
              )}
            </div>
          )}

          {/* Review form */}
          {booking.status === 'COMPLETED' && user?.role === 'SHIPPER' && !booking.review && !reviewSubmitted && (
            <form onSubmit={handleReviewSubmit} className="p-6 shadow-none space-y-4 card" style={{ fontFamily: 'var(--font-body)' }}>
              <h3 className="text-md font-bold pb-2 border-b" style={{ color: 'var(--color-text-main)', borderColor: 'var(--color-border)', fontFamily: 'var(--font-heading)' }}>
                Rate Driver Experience
              </h3>
              <div>
                <label className="block text-[10px] font-bold tracking-[0.08em] mb-1" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>Rating</label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button type="button" key={star} onClick={() => setRating(star)} className={`text-2xl ${rating >= star ? 'text-amber-400' : 'text-slate-200'} transition`}>★</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-[0.08em] mb-1" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>Comment</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us about your experience..."
                  className="input-field h-24"
                  style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-body)' }}
                />
              </div>
              <button type="submit" className="w-full text-white font-bold py-2.5 text-sm transition" style={{ backgroundColor: 'var(--color-primary)', borderRadius: 'var(--radius-button)', fontFamily: 'var(--font-heading)' }}>
                Submit Rating
              </button>
            </form>
          )}

          {/* Dispute section */}
          {['DELIVERED', 'COMPLETED'].includes(booking.status) && user?.role === 'SHIPPER' && (
            <div className="pt-4 text-center font-sans">
              {!showDisputeForm ? (
                <button onClick={() => setShowDisputeForm(true)} className="text-[#DC2626] hover:opacity-85 text-xs font-bold underline tracking-wider">
                  Have an issue? File a Dispute
                </button>
              ) : (
                <form onSubmit={handleDisputeSubmit} className="p-6 text-left space-y-4 mt-2 card-danger" style={{ fontFamily: 'var(--font-body)' }}>
                  <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--color-status-cancelled)', fontFamily: 'var(--font-heading)' }}>File a Dispute</h3>
                  <p className="text-xs" style={{ color: 'var(--color-status-cancelled)' }}>
                    Please describe the problem you encountered with your delivery (e.g., damaged items, delay, driver behavior).
                  </p>
                  <div>
                    <textarea
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      placeholder="Describe your issue in detail..."
                      required
                      className="input-field h-24 bg-white"
                      style={{ color: 'var(--color-text-main)' }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="text-white px-4 py-2 text-sm font-bold transition" style={{ backgroundColor: 'var(--color-status-cancelled)', borderRadius: 'var(--radius-button)', fontFamily: 'var(--font-heading)' }}>
                      Submit Dispute
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDisputeForm(false)}
                      className="px-4 py-2 text-sm font-bold transition hover:bg-[var(--color-background)]"
                      style={{ backgroundColor: 'var(--color-card)', color: 'var(--color-text-muted)', border: 'var(--border-width) solid var(--color-input-border)', borderRadius: 'var(--radius-button)', fontFamily: 'var(--font-heading)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TrackingPage;
