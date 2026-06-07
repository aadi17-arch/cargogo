import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { useAuth } from '@/hooks/useAuth';
import { useBooking } from '@/hooks/useBooking';
import { useSocket } from '@/hooks/useSocket';
import api from '@/services/api';
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
      await api.post('/payment/checkout', {
        bookingId,
        paymentMethod: 'CARD',
        amount: booking.price
      });
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
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Track Booking</h2>
      <div className="bg-white p-4 rounded-lg shadow">
        <p>Status: <span className="font-bold">{booking.status}</span></p>
        <p>Cargo: {booking.cargoType}</p>
        <p>Price: ₹{booking.price}</p>
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
        <div className="bg-yellow-50 p-4 rounded-lg">
          {user?.role === 'DRIVER' ? (
            <>
              <p className="font-bold mb-2">Enter Pickup OTP to start trip</p>
              <input value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} className="p-2 border rounded w-40 text-center text-2xl tracking-widest" placeholder="000000" />
              <button onClick={() => verifyOTP('pickup')} className="ml-2 bg-green-600 text-white px-4 py-2 rounded">Verify Pickup</button>
            </>
          ) : (
            <p className="font-bold text-yellow-800 text-lg">
              Share this Pickup OTP with your driver to start the trip: <span className="bg-yellow-200 px-3 py-1 rounded font-mono text-2xl ml-2">{booking.pickupOTP}</span>
            </p>
          )}
        </div>
      )}

      {booking.status === 'IN_TRANSIT' && (
        <div className="bg-blue-50 p-4 rounded-lg">
          {user?.role === 'DRIVER' ? (
            <>
              <p className="font-bold mb-2">Enter Dropoff OTP to complete</p>
              <input value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} className="p-2 border rounded w-40 text-center text-2xl tracking-widest" placeholder="000000" />
              <button onClick={() => verifyOTP('dropoff')} className="ml-2 bg-green-600 text-white px-4 py-2 rounded">Verify Dropoff</button>
            </>
          ) : (
            <p className="font-bold text-blue-800 text-lg">
              Share this Dropoff OTP with your driver to complete the delivery: <span className="bg-blue-200 px-3 py-1 rounded font-mono text-2xl ml-2">{booking.dropoffOTP}</span>
            </p>
          )}
        </div>
      )}

      {booking.status === 'DELIVERED' && (
        <div className="bg-green-50 p-6 rounded-lg shadow space-y-4">
          <p className="text-2xl font-bold text-green-700 text-center">Package Delivered!</p>
          {user?.role === 'SHIPPER' && (
            <div className="text-center">
              <p className="text-gray-600 mb-4">Please review the invoice details below and complete the payment.</p>
              <button 
                onClick={handlePayment} 
                className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-lg text-lg shadow-md transition"
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
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100 space-y-4">
          <h3 className="text-xl font-bold border-b pb-2 text-gray-800">Invoice Details</h3>
          <div className="grid grid-cols-2 gap-2 text-gray-700">
            <span>Base Fare:</span>
            <span className="font-semibold text-right">₹{invoice.baseFare}</span>
            <span>Distance Charge:</span>
            <span className="font-semibold text-right">₹{invoice.distanceFare}</span>
            <span>Weight Surcharge:</span>
            <span className="font-semibold text-right">₹{invoice.weightSurcharge}</span>
            <span>Tolls & Taxes:</span>
            <span className="font-semibold text-right">₹{invoice.tollsAndTaxes}</span>
            <div className="col-span-2 border-t my-2"></div>
            <span className="text-lg font-bold text-gray-900">Total Price:</span>
            <span className="text-lg font-bold text-right text-green-600">₹{invoice.total}</span>
          </div>
        </div>
      )}

      {booking.status === 'COMPLETED' && user?.role === 'SHIPPER' && !reviewSubmitted && (
        <form onSubmit={handleReviewSubmit} className="bg-white p-6 rounded-lg shadow border border-gray-100 space-y-4">
          <h3 className="text-xl font-bold border-b pb-2 text-gray-800">Rate Driver Experience</h3>
          
          <div>
            <label className="block text-gray-700 font-medium mb-1">Rating</label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-2xl ${rating >= star ? 'text-yellow-400' : 'text-gray-300'} transition`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience..."
              className="w-full p-2 border rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition shadow">
            Submit Rating
          </button>
        </form>
      )}

      {['DELIVERED', 'COMPLETED'].includes(booking.status) && user?.role === 'SHIPPER' && (
        <div className="pt-4 text-center">
          {!showDisputeForm ? (
            <button 
              onClick={() => setShowDisputeForm(true)} 
              className="text-red-600 hover:text-red-800 text-sm font-semibold underline"
            >
              Have an issue? File a Dispute
            </button>
          ) : (
            <form onSubmit={handleDisputeSubmit} className="bg-red-50 p-6 rounded-lg shadow border border-red-100 text-left space-y-4 mt-2">
              <h3 className="text-lg font-bold text-red-800">File a Dispute</h3>
              <p className="text-sm text-red-600">Please describe the problem you encountered with your delivery (e.g., damaged items, delay, driver behavior).</p>
              
              <div>
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Describe your issue in detail..."
                  required
                  className="w-full p-2 border rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                />
              </div>

              <div className="flex space-x-2">
                <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg transition shadow">
                  Submit Dispute
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowDisputeForm(false)} 
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-4 py-2 rounded-lg transition"
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
