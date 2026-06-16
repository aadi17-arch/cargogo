import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { useAuth } from '@/hooks/useAuth';
import { useBooking } from '@/hooks/useBooking';
import { useSocket } from '@/hooks/useSocket';
import api from '@/services/api';
import { paymentService } from '@/services/payment.service';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function TrackingPage() {
  const { bookingId } = useParams();
  const { token, user } = useAuth();
  const { confirmPickup, confirmDropoff } = useBooking();
  const { on } = useSocket(token);

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
      const res = await api.get(`/bookings/${bookingId}`);
      setBooking(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBooking();

    const offLocation = on('driver:location:update', (data: any) => {
      if (data.bookingId === bookingId) {
        setDriverLocation([data.lat, data.lng]);
      }
    });

    const offArrived = on('driver:arrived', (data: any) => {
      if (data.bookingId === bookingId) {
        alert('Driver has arrived at the destination!');
        fetchBooking();
      }
    });

    const offTripCompleted = on('trip:completed', () => {
      alert('Trip completed!');
      fetchBooking();
    });

    return () => {
      offLocation();
      offArrived();
      offTripCompleted();
    };
  }, [bookingId, on]);

  const verifyOTP = async (type: 'pickup' | 'dropoff') => {
    try {
      if (type === 'pickup') {
        await confirmPickup(bookingId!, otp);
      } else {
        await confirmDropoff(bookingId!, otp);
      }
      alert(`${type} verified!`);
      setOtp('');
      fetchBooking();
    } catch (err: any) {
      alert(err.message || 'Invalid OTP');
    }
  };

  const fetchInvoice = async () => {
    try {
      const res = await api.get(`/bookings/${bookingId}/invoice`);
      setInvoice(res.data.data);
    } catch (err) {
      console.error('Failed to fetch invoice:', err);
    }
  };

  const handlePayment = async () => {
    try {
      await paymentService.processCheckout(
        bookingId!,
        'CARD',
        booking.price
      );
      alert('Payment Successful! Booking status updated to COMPLETED.');
      fetchBooking();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Payment failed');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/review/createReview', {
        bookingId,
        rating,
        comment
      });
      alert('Thank you! Your review has been submitted.');
      setReviewSubmitted(true);
      fetchBooking();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit review');
    }
  };

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/disputes/fileDispute', {
        bookingId,
        reason: disputeReason
      });
      alert('Dispute filed successfully. Booking status changed to DISPUTED.');
      setShowDisputeForm(false);
      fetchBooking();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to file dispute');
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
      <h2 className="text-3xl font-semibold text-slate-900 font-sans-outfit tracking-tight">Track Booking</h2>
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-2">
        <p className="text-sm text-slate-600 flex items-center gap-2">
          Status: 
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase border font-tech-space ${
            booking.status === 'PENDING' ? 'bg-slate-50 text-slate-600 border-slate-200' :
            booking.status === 'ACCEPTED' ? 'bg-blue-50 text-blue-600 border-blue-200' :
            booking.status === 'IN_TRANSIT' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
            booking.status === 'DELIVERED' ? 'bg-amber-50 text-amber-600 border-amber-200' :
            booking.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
            booking.status === 'CANCELLED' ? 'bg-rose-50 text-rose-600 border-rose-200' :
            'bg-orange-50 text-orange-600 border-orange-200'
          }`}>
            {booking.status}
          </span>
        </p>
        <p className="text-sm text-slate-700">Cargo: <span className="font-semibold text-slate-900">{booking.cargoType}</span></p>
        <p className="text-sm text-slate-700">Price: <span className="font-bold text-slate-900 font-tech-space">₹{booking.price}</span></p>
      </div>

      <div className="h-96 rounded-lg overflow-hidden shadow">
        <MapContainer center={pickup} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={pickup}>
            <Popup>Pickup</Popup>
          </Marker>
          <Marker position={dropoff}>
            <Popup>Dropoff</Popup>
          </Marker>
          {driverLocation && <Marker position={driverLocation}><Popup>Driver</Popup></Marker>}
          <Polyline positions={[pickup, dropoff]} color="blue" />
          {driverLocation && <Polyline positions={[pickup, driverLocation]} color="green" />}
        </MapContainer>
      </div>

      {booking.status === 'ACCEPTED' && (
        <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl shadow-sm">
          {user?.role === 'DRIVER' ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="font-semibold text-amber-800 text-sm">Enter Pickup OTP:</span>
              <div className="flex gap-2">
                <input value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} className="input-field max-w-[120px] text-center font-mono text-lg tracking-widest" placeholder="000000" />
                <button onClick={() => verifyOTP('pickup')} className="bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-xl text-sm font-semibold transition">Verify Pickup</button>
              </div>
            </div>
          ) : (
            <p className="font-semibold text-amber-800 text-sm">
              Share this Pickup OTP with your driver to start the trip: <span className="bg-amber-200 px-3 py-1 rounded-lg font-mono text-xl ml-2">{booking.pickupOTP}</span>
            </p>
          )}
        </div>
      )}

      {booking.status === 'IN_TRANSIT' && (
        <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl shadow-sm">
          {user?.role === 'DRIVER' ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="font-semibold text-blue-800 text-sm">Enter Dropoff OTP:</span>
              <div className="flex gap-2">
                <input value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} className="input-field max-w-[120px] text-center font-mono text-lg tracking-widest" placeholder="000000" />
                <button onClick={() => verifyOTP('dropoff')} className="bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-xl text-sm font-semibold transition">Verify Dropoff</button>
              </div>
            </div>
          ) : (
            <p className="font-semibold text-blue-800 text-sm">
              Share this Dropoff OTP with your driver to complete the delivery: <span className="bg-blue-200 px-3 py-1 rounded-lg font-mono text-xl ml-2">{booking.dropoffOTP}</span>
            </p>
          )}
        </div>
      )}

      {booking.status === 'DELIVERED' && (
        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl shadow-sm text-center space-y-4 animate-pulse">
          <p className="text-xl font-bold text-emerald-800">Package Delivered!</p>
          {user?.role === 'SHIPPER' && (
            <div className="flex flex-col items-center">
              <p className="text-sm text-emerald-700 mb-4">Please review the invoice details below and complete the payment.</p>
              <button 
                onClick={handlePayment} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm shadow-sm transition"
              >
                Pay & Complete Booking (₹{booking.price})
              </button>
            </div>
          )}
        </div>
      )}

      {booking.status === 'COMPLETED' && (
        <div className="bg-blue-50 p-6 rounded-lg shadow text-center">
          <p className="text-2xl font-bold text-blue-700">Booking Completed & Paid!</p>
        </div>
      )}

      {booking.status === 'DISPUTED' && (
        <div className="bg-red-50 p-6 rounded-lg shadow text-center border-l-4 border-red-500">
          <p className="text-2xl font-bold text-red-700">Booking Under Dispute</p>
          <p className="text-gray-700 mt-2">Our support team is currently reviewing your claim. We will contact you shortly.</p>
        </div>
      )}

      {invoice && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-xl font-semibold text-slate-800 border-b border-slate-100 pb-2 font-sans-outfit">Invoice Details</h3>
          <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-600 font-sans-outfit">
            <span>Base Fare:</span>
            <span className="font-semibold text-right text-slate-800 font-tech-space">₹{invoice.basePrice}</span>
            <span>Distance Charge:</span>
            <span className="font-semibold text-right text-slate-800 font-tech-space">₹{invoice.distanceCost}</span>
            <span>Weight Surcharge:</span>
            <span className="font-semibold text-right text-slate-800 font-tech-space">₹{invoice.weightCost}</span>
            <div className="col-span-2 border-t border-slate-100 my-2"></div>
            <span className="text-sm font-bold text-slate-900">Total Price:</span>
            <span className="text-lg font-bold text-right text-green-600 font-tech-space">₹{invoice.totalPrice}</span>
          </div>
        </div>
      )}

      {booking.review && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <h3 className="text-xl font-semibold text-slate-800 border-b border-slate-100 pb-2 font-sans-outfit">Customer Feedback</h3>
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-xl font-bold">
              {'★'.repeat(booking.review.rating)}{'☆'.repeat(5 - booking.review.rating)}
            </span>
            <span className="text-sm font-semibold text-slate-700 font-tech-space">({booking.review.rating} / 5 stars)</span>
          </div>
          {booking.review.comment && (
            <p className="text-sm text-slate-600 italic bg-slate-50 p-4 rounded-xl border border-slate-100 mt-2">
              "{booking.review.comment}"
            </p>
          )}
        </div>
      )}

      {booking.status === 'COMPLETED' && user?.role === 'SHIPPER' && !booking.review && !reviewSubmitted && (
        <form onSubmit={handleReviewSubmit} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-md font-bold text-slate-800 border-b border-slate-100 pb-2">Rate Driver Experience</h3>
          
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Rating</label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-2xl ${rating >= star ? 'text-amber-400' : 'text-slate-200'} transition`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience..."
              className="input-field h-24"
            />
          </div>

          <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white font-semibold py-2.5 rounded-xl text-sm transition">
            Submit Rating
          </button>
        </form>
      )}

      {['DELIVERED', 'COMPLETED'].includes(booking.status) && user?.role === 'SHIPPER' && (
        <div className="pt-4 text-center">
          {!showDisputeForm ? (
            <button 
              onClick={() => setShowDisputeForm(true)} 
              className="text-red-600 hover:text-red-800 text-xs font-semibold underline uppercase tracking-wider"
            >
              Have an issue? File a Dispute
            </button>
          ) : (
            <form onSubmit={handleDisputeSubmit} className="bg-red-50 border border-red-100 p-6 rounded-2xl text-left space-y-4 mt-2">
              <h3 className="text-sm font-bold text-red-800 uppercase tracking-wide">File a Dispute</h3>
              <p className="text-xs text-red-600">Please describe the problem you encountered with your delivery (e.g., damaged items, delay, driver behavior).</p>
              
              <div>
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Describe your issue in detail..."
                  required
                  className="input-field h-24 bg-white"
                />
              </div>

              <div className="flex gap-2">
                <button type="submit" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
                  Submit Dispute
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowDisputeForm(false)} 
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-xl text-sm font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default TrackingPage;
