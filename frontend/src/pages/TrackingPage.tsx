import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBooking } from '@/hooks/useBooking';
import { useSocket, useSocketListener } from '@/hooks/useSocket';
import { bookingService } from '@/services/booking.service';
import { paymentService } from '@/services/payment.service';
import { toast } from 'react-hot-toast';
import { formatDate } from '@/utils/formatters';
import StatusBadge from '@/components/UI/StatusBadge';
import MapView, { MapMarker } from '@/components/Map/MapView';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import ChatDrawer from '@/components/Tracking/ChatDrawer';
import TrackingOtpPanel from '@/components/Tracking/TrackingOtpPanel';
import TrackingPostDelivery from '@/components/Tracking/TrackingPostDelivery';
import MobileViewToggle from '@/components/UI/MobileViewToggle';

function TrackingPage() {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const { confirmPickup, confirmDropoff } = useBooking();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<[number, number] | null>(null);
  const [otp, setOtp] = useState('');
  const [invoice, setInvoice] = useState<any>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const token = localStorage.getItem('token');
  useSocket(token);

  useSocketListener('receive-chat-message', (msg: any) => {
    if (!isChatOpen && msg.bookingId === bookingId && msg.senderId !== user?.id) {
      setUnreadCount(prev => prev + 1);
    }
  }, [isChatOpen, bookingId, user?.id]);

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
    if (data.bookingId === bookingId) {
      toast.success('Driver has arrived at the destination!');
      fetchBooking();
    }
  }, [bookingId]);

  useSocketListener('trip:completed', () => {
    toast.success('Trip completed!');
    fetchBooking();
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

  const handleReviewSubmit = async (rating: number, comment: string) => {
    try {
      await bookingService.submitReview(bookingId!, rating, comment);
      toast.success('Thank you! Your review has been submitted.');
      fetchBooking();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
      throw err;
    }
  };

  const handleDisputeSubmit = async (reason: string) => {
    try {
      await bookingService.fileDispute(bookingId!, reason);
      toast.success('Dispute filed successfully. Booking status changed to DISPUTED.');
      fetchBooking();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to file dispute');
      throw err;
    }
  };

  useEffect(() => {
    if (booking && ['DELIVERED', 'COMPLETED', 'DISPUTED'].includes(booking.status)) {
      fetchInvoice();
    }
  }, [booking?.status]);

  const downloadInvoice = () => {
    if (!invoice || !booking) return;
    const invoiceDate = new Date(booking.createdAt || Date.now()).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CargoGo Invoice - ${bookingId}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; color: #1e293b; padding: 40px 20px; }
    .page { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #4F46E5 0%, #6366f1 100%); padding: 36px 40px; color: white; }
    .header .brand { font-size: 28px; font-weight: 900; letter-spacing: -1px; margin-bottom: 4px; }
    .header .brand span { color: #a5f3fc; }
    .header .tagline { font-size: 12px; opacity: 0.8; }
    .header .invoice-label { margin-top: 24px; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; opacity: 0.7; }
    .header .invoice-id { font-size: 16px; font-weight: 800; font-family: monospace; margin-top: 4px; }
    .body { padding: 36px 40px; }
    .section-title { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #94a3b8; margin-bottom: 12px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px; }
    .info-item label { font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; display: block; margin-bottom: 3px; }
    .info-item p { font-size: 13px; font-weight: 600; color: #1e293b; }
    .route-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin-bottom: 28px; display: flex; align-items: center; gap: 16px; }
    .route-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .route-dot.pickup { background: #4F46E5; }
    .route-dot.dropoff { background: #10b981; }
    .route-text { font-size: 12px; color: #475569; flex: 1; line-height: 1.5; }
    .route-text strong { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8; margin-bottom: 2px; }
    .route-arrow { font-size: 20px; color: #cbd5e1; }
    .fare-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .fare-table tr td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
    .fare-table tr td:last-child { text-align: right; font-weight: 600; color: #1e293b; }
    .fare-table tr td:first-child { color: #64748b; }
    .total-row { background: #f8fafc; border-radius: 10px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
    .total-row span { font-size: 13px; font-weight: 700; color: #64748b; }
    .total-row strong { font-size: 24px; font-weight: 900; color: #4F46E5; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 100px; font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; background: #dcfce7; color: #15803d; }
    .footer { border-top: 1px solid #f1f5f9; padding: 24px 40px; text-align: center; }
    .footer p { font-size: 12px; color: #94a3b8; line-height: 1.8; }
    .footer .thanks { font-size: 14px; font-weight: 700; color: #4F46E5; margin-bottom: 4px; }
    @media print { body { background: white; padding: 0; } .page { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="brand">Cargo<span>Go</span></div>
      <div class="tagline">Freight & Logistics Platform</div>
      <div class="invoice-label">Tax Invoice</div>
      <div class="invoice-id">#${bookingId?.slice(0, 8).toUpperCase()}</div>
    </div>
    <div class="body">
      <div class="section-title">Booking Details</div>
      <div class="info-grid">
        <div class="info-item"><label>Date</label><p>${invoiceDate}</p></div>
        <div class="info-item"><label>Status</label><p><span class="status-badge">${booking.status}</span></p></div>
        <div class="info-item"><label>Cargo Type</label><p>${booking.cargoType || 'N/A'}</p></div>
        <div class="info-item"><label>Vehicle Type</label><p>${(booking.vehicleType || 'MINI_TEMPO').replace(/_/g, ' ')}</p></div>
      </div>

      <div class="section-title">Route</div>
      <div class="route-card">
        <div><div class="route-dot pickup"></div></div>
        <div class="route-text"><strong>Pickup</strong>${booking.pickupAddress || 'N/A'}</div>
        <div class="route-arrow">→</div>
        <div><div class="route-dot dropoff"></div></div>
        <div class="route-text"><strong>Dropoff</strong>${booking.dropoffAddress || 'N/A'}</div>
      </div>

      <div class="section-title">Fare Breakdown</div>
      <table class="fare-table">
        <tr><td>Base Fare</td><td>₹${invoice.basePrice?.toFixed(2) ?? '0.00'}</td></tr>
        <tr><td>Distance Charge</td><td>₹${invoice.distanceCost?.toFixed(2) ?? '0.00'}</td></tr>
        <tr><td>Weight Surcharge</td><td>₹${invoice.weightCost?.toFixed(2) ?? '0.00'}</td></tr>
      </table>
      <div class="total-row">
        <span>Total Amount</span>
        <strong>₹${invoice.totalPrice?.toFixed(2) ?? booking.price?.toFixed(2) ?? '0.00'}</strong>
      </div>
    </div>
    <div class="footer">
      <p class="thanks">🚚 Thank you for shipping with CargoGo!</p>
      <p>This is a computer-generated invoice and does not require a signature.<br/>For support, contact support@cargogo.in | cargogo.vercel.app</p>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CargoGo-Invoice-${bookingId?.slice(0, 8).toUpperCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Invoice downloaded!');
  };

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
    return [
      [booking.pickupLat, booking.pickupLng],
      [booking.dropoffLat, booking.dropoffLng]
    ] as [number, number][];
  }, [booking]);

  const driverPolyline = useMemo(() => {
    if (!booking || !driverLocation) return [];
    return [
      [booking.pickupLat, booking.pickupLng],
      driverLocation
    ] as [number, number][];
  }, [booking, driverLocation]);

  if (!booking) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center font-heading">
        <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold text-slate-500">Retrieving cargo parameters...</p>
      </div>
    );
  }

  const [mobileView, setMobileView] = useState<'map' | 'details'>('map');

  return (
    <div className="min-h-[calc(100vh-64px)] lg:h-[calc(100vh-64px)] overflow-y-auto lg:overflow-y-hidden flex flex-col p-3 sm:p-4 gap-3 bg-white">
      {/* Top Header Navigation & Mobile Toggle */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(user?.role === 'DRIVER' ? '/driver' : '/shipper')}
            className="p-1 -ml-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-heading">
            Track Delivery
          </h2>
        </div>

        <MobileViewToggle
          activeView={mobileView}
          onToggle={setMobileView}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch flex-1 min-h-0">
        {/* Left Live Leaflet Map Column */}
        <div
          className={`lg:col-span-7 w-full overflow-hidden border border-slate-200 rounded-xl shadow-xs relative z-10 bg-white shrink-0 lg:shrink lg:block ${
            mobileView === 'map' ? 'h-[calc(100vh-160px)] sm:h-[480px] lg:h-full block' : 'hidden'
          }`}
        >
          <MapView
            center={mapCenter}
            zoom={13}
            markers={mapMarkers}
            routePositions={routePolyline}
            polylineColor="#0F172A"
          >
            {driverLocation && <MapView routePositions={driverPolyline} polylineColor="#0F172A" center={mapCenter} />}
          </MapView>
        </div>

        {/* Right Details, OTP & Payment/Dispute Column */}
        <div
          className={`lg:col-span-5 w-full lg:h-full lg:overflow-y-auto space-y-4 pr-0 lg:pr-1 ${
            mobileView === 'details' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Delivery Parameters Card */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3 font-body text-xs text-slate-600">
            <h3 className="text-sm font-bold text-slate-900 font-heading">Delivery Parameters</h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Status</span>
                <StatusBadge status={booking.status} />
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700">Cargo Type</span>
                <span className="font-bold text-slate-900">{booking.cargoType}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700">Price</span>
                <span className="font-extrabold text-slate-900 text-sm font-heading">₹{Math.round(booking.price)}</span>
              </div>
              {booking.createdAt && (
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700">Booked</span>
                  <span className="font-medium text-slate-500 font-mono text-[11px]">{formatDate(booking.createdAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* OTP Verification & Display */}
          <TrackingOtpPanel
            status={booking.status}
            userRole={user?.role}
            pickupOTP={booking.pickupOTP}
            dropoffOTP={booking.dropoffOTP}
            otp={otp}
            setOtp={setOtp}
            onVerify={verifyOTP}
          />

          {/* Post-Delivery (Payment, Invoice, Review, Dispute) */}
          <TrackingPostDelivery
            booking={booking}
            userRole={user?.role}
            invoice={invoice}
            isProcessingPayment={isProcessingPayment}
            onPayment={handlePayment}
            onReviewSubmit={handleReviewSubmit}
            onDisputeSubmit={handleDisputeSubmit}
            onDownloadInvoice={downloadInvoice}
          />
        </div>
      </div>

      {/* Floating Instant Chat Action Trigger */}
      {booking && booking.driverId && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsChatOpen(true);
            setUnreadCount(0);
          }}
          className="fixed bottom-6 right-6 z-[1001] bg-slate-950 hover:bg-slate-800 text-white p-3.5 rounded-full shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 group scale-100 hover:scale-105 active:scale-95"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-bold text-xs whitespace-nowrap">
            Chat
          </span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Live Chat Drawer */}
      {isChatOpen && user && booking && (
        <ChatDrawer
          bookingId={bookingId!}
          currentUser={{ id: user.id, name: user.name, role: user.role }}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </div>
  );
}

export default TrackingPage;
