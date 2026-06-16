import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBooking } from '@/hooks/useBooking';

export function ShipperNavbarOptions() {
  const navigate = useNavigate();
  const { bookings, fetchMyBookings } = useBooking();
  
  const [showRates, setShowRates] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showServices, setShowServices] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showActiveRuns, setShowActiveRuns] = useState(false);

  useEffect(() => {
    if (showActiveRuns) {
      fetchMyBookings().catch(err => console.error('Failed to load bookings for shipper', err));
    }
  }, [showActiveRuns]);

  const activeShipperRuns = bookings.filter(
    (b: any) => b.status !== 'DELIVERED' && b.status !== 'COMPLETED' && b.status !== 'CANCELLED'
  );

  return (
    <>
      <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-1.5 text-sm font-medium">
        <Link to="/shipper" className="w-full md:w-auto px-3.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition">Book Delivery</Link>
        <button onClick={() => setShowActiveRuns(true)} className="w-full md:w-auto text-left px-3.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition focus:outline-none">Active Runs</button>
        <button onClick={() => setShowRates(true)} className="w-full md:w-auto text-left px-3.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition focus:outline-none">Rates</button>
        <button onClick={() => setShowServices(true)} className="w-full md:w-auto text-left px-3.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition focus:outline-none">Services</button>
        <button onClick={() => setShowFAQ(true)} className="w-full md:w-auto text-left px-3.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition focus:outline-none">FAQ</button>
        <button onClick={() => setShowSupport(true)} className="w-full md:w-auto text-left px-3.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition focus:outline-none">Support</button>
      </div>

      {/* Pricing Rates Modal */}
      {showRates && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Delivery Rates</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="border-b pb-2 flex justify-between">
                <span className="font-semibold">Vehicle Type</span>
                <span className="font-semibold">Base Price + Per Km</span>
              </div>
              <div className="flex justify-between">
                <span>Mini Tempo</span>
                <span>₹50 + ₹15/km</span>
              </div>
              <div className="flex justify-between">
                <span>Pickup Truck</span>
                <span>₹100 + ₹22/km</span>
              </div>
              <div className="flex justify-between">
                <span>3-Ton Container</span>
                <span>₹200 + ₹35/km</span>
              </div>
              <p className="text-xs text-gray-400 mt-4 pt-2 border-t">
                Note: Total price is calculated based on distance and volumetric weight calculations.
              </p>
            </div>
            <button 
              onClick={() => setShowRates(false)}
              className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Services Modal */}
      {showServices && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Our Services</h3>
            <div className="space-y-4 text-sm text-gray-700">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="font-semibold text-gray-800">Express Delivery</p>
                <p className="text-xs text-gray-500">Fast tracking, priority routing, and quick driver dispatch for urgent loads.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="font-semibold text-gray-800">Bulk Cargo Transport</p>
                <p className="text-xs text-gray-500">Perfect for high-volume items. Fits easily inside our 3-Ton containers.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="font-semibold text-gray-800">Secure Handling</p>
                <p className="text-xs text-gray-500">Sealed cargo chambers and verified OTP authentication for secure pickups.</p>
              </div>
            </div>
            <button 
              onClick={() => setShowServices(false)}
              className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* FAQ Modal */}
      {showFAQ && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl relative max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <p className="font-semibold text-gray-800">How is the price calculated?</p>
                <p className="text-xs text-gray-500">Pricing depends on distance, chosen vehicle type, and the volumetric weight of your items.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-800">What is the OTP verification system?</p>
                <p className="text-xs text-gray-500">We verify runs at pickup and dropoff. When the driver arrives, share the security pin from your dashboard to proceed.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-800">How do I cancel my order?</p>
                <p className="text-xs text-gray-500">You can cancel any booking before a driver accepts it. Once matched, please contact support immediately.</p>
              </div>
            </div>
            <button 
              onClick={() => setShowFAQ(false)}
              className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Active Runs Modal */}
      {showActiveRuns && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4 font-sans">Your Active Shipments</h3>
            {activeShipperRuns.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No active shipments at this time.</p>
            ) : (
              <div className="space-y-3">
                {activeShipperRuns.map((b: any) => (
                  <div key={b.id} className="p-3 bg-slate-50 rounded-lg flex justify-between items-center border border-slate-100">
                    <div>
                      <p className="text-xs text-gray-400 font-mono">ID: {b.id.substring(0, 8)}</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">{b.cargoType}</p>
                      <p className="text-xs text-gray-500">{b.vehicleType.replace('_', ' ')}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-800">
                          {b.status}
                        </span>
                        <span className="text-xs font-semibold text-gray-700">₹{b.price}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setShowActiveRuns(false);
                        navigate(`/track/${b.id}`);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded font-medium transition"
                    >
                      Track
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button 
              onClick={() => setShowActiveRuns(false)}
              className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Support Modal */}
      {showSupport && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Support & Help</h3>
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <p className="font-semibold text-gray-800">Support Hotline</p>
                <p className="text-blue-600 font-medium">+1-800-CARGOGO (227-4646)</p>
              </div>
              <div>
                <p className="font-semibold text-gray-800">Email Assistance</p>
                <p className="text-blue-600 font-medium">help@cargogo.com</p>
              </div>
              <div>
                <p className="font-semibold text-gray-800">Frequently Asked</p>
                <p className="text-gray-500">For active tracking disputes, click "File a Dispute" directly inside your completed delivery invoice on the tracking page.</p>
              </div>
            </div>
            <button 
              onClick={() => setShowSupport(false)}
              className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

