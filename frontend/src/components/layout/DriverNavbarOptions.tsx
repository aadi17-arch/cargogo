import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBooking } from '@/hooks/useBooking';

export function DriverNavbarOptions() {
  const { bookings, fetchMyBookings } = useBooking();
  
  const [showSupport, setShowSupport] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showDriverStats, setShowDriverStats] = useState(false);

  useEffect(() => {
    if (showDriverStats) {
      fetchMyBookings().catch(err => console.error('Failed to load bookings for driver', err));
    }
  }, [showDriverStats]);

  const completedDriverJobs = bookings.filter((b: any) => b.status === 'DELIVERED');
  const driverEarnings = completedDriverJobs.reduce((sum: number, b: any) => sum + (b.price || 0), 0);
  const activeDriverJobs = bookings.filter(
    (b: any) => b.status === 'ACCEPTED' || b.status === 'IN_TRANSIT'
  );

  return (
    <>
      <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-1.5 text-sm font-medium">
        <Link to="/driver" className="w-full md:w-auto px-3.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition">Dashboard</Link>
        <button onClick={() => setShowDriverStats(true)} className="w-full md:w-auto text-left px-3.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition focus:outline-none">Performance Stats</button>
        <button onClick={() => setShowFAQ(true)} className="w-full md:w-auto text-left px-3.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition focus:outline-none">FAQ</button>
        <button onClick={() => setShowSupport(true)} className="w-full md:w-auto text-left px-3.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition focus:outline-none">Support</button>
      </div>

      {/* FAQ Modal */}
      {showFAQ && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl relative max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <p className="font-semibold text-gray-800">How do I start a delivery?</p>
                <p className="text-xs text-gray-500">Ask the shipper for the pickup OTP when you arrive at the pickup point, enter it into your dashboard, and confirm.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-800">How do I mark as delivered?</p>
                <p className="text-xs text-gray-500">Upon reaching the dropoff point, ask the shipper/receiver for the dropoff OTP, enter it, and submit to complete the run.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-800">When do my earnings update?</p>
                <p className="text-xs text-gray-500">Earnings update instantly on your dashboard and performance stats once a shipment status changes to Completed.</p>
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

      {/* Driver Performance Stats Modal */}
      {showDriverStats && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Performance Metrics</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-50 p-4 rounded-lg text-center">
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Total Earnings</p>
                <p className="text-2xl font-bold text-green-600 mt-1">₹{driverEarnings}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg text-center">
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Runs Completed</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{completedDriverJobs.length}</p>
              </div>
            </div>
            <div className="space-y-3 text-sm text-gray-700 border-t pt-3">
              <div className="flex justify-between">
                <span>Active Runs:</span>
                <span className="font-semibold">{activeDriverJobs.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Acceptance Rate:</span>
                <span className="font-semibold">100%</span>
              </div>
              <div className="flex justify-between">
                <span>Profile Status:</span>
                <span className="text-green-600 font-bold">Verified Partner</span>
              </div>
            </div>
            <button 
              onClick={() => setShowDriverStats(false)}
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

