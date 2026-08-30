import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { useNavigate } from 'react-router-dom';

export function FAQModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="FAQ">
      <div className="divide-y divide-slate-100 border-t border-b border-slate-100">
        {[
          { q: 'How does dispatch work?', a: 'CargoGo matches nearby drivers instantly based on vehicle type and location.' },
          { q: 'What is the OTP key?', a: 'A 6-digit code required at pickup and dropoff to verify package handoff.' },
          { q: 'How are payments handled?', a: 'Pay securely via card after delivery completion.' }
        ].map((item, idx) => (
          <div key={idx} className="py-3 space-y-1 text-xs text-left">
            <span className="font-bold text-slate-900 block font-heading">{item.q}</span>
            <span className="text-slate-600 block text-[11px] font-body">{item.a}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export function RatesModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pricing">
      <div className="divide-y divide-slate-100 border-t border-b border-slate-100">
        {[
          { type: 'Mini Tempo', capacity: 'Up to 500 kg', fare: '₹350 base + ₹14/km' },
          { type: 'Pickup Truck', capacity: 'Up to 1.5 Tons', fare: '₹600 base + ₹18/km' },
          { type: '3-Ton Container', capacity: 'Up to 3.0 Tons', fare: '₹1,200 base + ₹25/km' }
        ].map((s, idx) => (
          <div key={idx} className="py-3.5 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-slate-900 block font-heading">{s.type}</span>
              <span className="text-[11px] text-slate-400 font-medium">{s.capacity}</span>
            </div>
            <span className="font-mono font-bold text-slate-900">{s.fare}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export function ServicesModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Services">
      <div className="divide-y divide-slate-100 border-t border-b border-slate-100">
        {[
          'Intracity Express Delivery',
          'OTP Secure Handshake',
          'Dynamic Capacity Routing',
          'Realtime GPS Tracking'
        ].map((title, idx) => (
          <div key={idx} className="py-3 flex items-center justify-between text-xs font-bold text-slate-900 font-heading">
            <span>{title}</span>
            <span className="text-slate-400 text-sm">✓</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export function SupportModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Support">
      <div className="divide-y divide-slate-100 border-t border-b border-slate-100">
        <div className="py-3.5 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-900 font-heading">Hotline</span>
          <a href="tel:+18002274646" className="font-mono font-bold text-slate-900 hover:underline">
            +1-800-CARGOGO
          </a>
        </div>
        <div className="py-3.5 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-900 font-heading">Email</span>
          <a href="mailto:help@cargogo.com" className="font-bold text-slate-900 hover:underline">
            help@cargogo.com
          </a>
        </div>
      </div>
    </Modal>
  );
}

export function ActiveRunsModal({
  isOpen,
  onClose,
  activeRuns
}: {
  isOpen: boolean;
  onClose: () => void;
  activeRuns: any[];
}) {
  const navigate = useNavigate();
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Active Shipments" maxWidth="max-w-xl">
      {activeRuns.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-xs font-medium">
          No active shipments.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 border-t border-b border-slate-100">
          {activeRuns.map((b: any) => (
            <div key={b.id} className="py-3.5 flex items-center justify-between gap-4 text-left">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-slate-900 font-heading">{b.cargoType}</span>
                  <Badge status={b.status} />
                </div>
                <span className="text-[10px] font-mono text-slate-400">#{b.id.substring(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-xs font-black text-slate-900 font-heading">₹{b.price}</span>
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/track/${b.id}`);
                  }}
                  className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  Track
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

export function DriverStatsModal({
  isOpen,
  onClose,
  driverEarnings,
  completedCount,
  activeCount
}: {
  isOpen: boolean;
  onClose: () => void;
  driverEarnings: number;
  completedCount: number;
  activeCount: number;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Performance" maxWidth="max-w-md">
      <div className="divide-y divide-slate-100 border-t border-b border-slate-100">
        <div className="py-3 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-900 font-heading">Total Earnings</span>
          <span className="font-mono font-black text-slate-900 text-sm">₹{driverEarnings}</span>
        </div>
        <div className="py-3 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-900 font-heading">Completed Jobs</span>
          <span className="font-bold text-slate-900">{completedCount}</span>
        </div>
        <div className="py-3 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-900 font-heading">Active Jobs</span>
          <span className="font-bold text-slate-900">{activeCount}</span>
        </div>
        <div className="py-3 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-900 font-heading">Acceptance Rate</span>
          <span className="font-bold text-slate-900">100%</span>
        </div>
      </div>
    </Modal>
  );
}

export function TrackModal({
  isOpen,
  onClose,
  trackingId,
  setTrackingId,
  onSubmit
}: {
  isOpen: boolean;
  onClose: () => void;
  trackingId: string;
  setTrackingId: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quick Track Shipment">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-500 text-left">
            Enter your Booking Tracking ID:
          </label>
          <input
            type="text"
            placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            className="w-full p-3 bg-white text-slate-800 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm transition-all shadow-sm"
            required
          />
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Go Back
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            Track Status
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function ShippersModal({ isOpen, onClose, onSignUp }: { isOpen: boolean; onClose: () => void; onSignUp: () => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="CargoGo For Shippers">
      <div className="space-y-4 text-left">
        <p className="text-xs text-slate-500 leading-normal">
          Ship cargo seamlessly with enterprise-grade logistics tools built for businesses and individuals:
        </p>
        <ul className="space-y-2 text-xs text-slate-600 pl-4 list-disc">
          <li><strong>Volumetric Math Engine</strong>: Input physical package sizes to automatically generate transparent estimates based on size or weight.</li>
          <li><strong>OTP Security Handshakes</strong>: High-value cargo keys are shared directly with the driver to authenticate both pickup and deliveries safely.</li>
          <li><strong>Instant Driver Matching</strong>: Post your shipment and get automatically connected with vetted local truck and tempo drivers immediately.</li>
        </ul>
        <div className="flex gap-2 justify-end pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Go Back
          </button>
          <button
            onClick={onSignUp}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            Sign Up as Shipper
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function DriversModal({ isOpen, onClose, onJoin }: { isOpen: boolean; onClose: () => void; onJoin: () => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="CargoGo For Drivers">
      <div className="space-y-4 text-left">
        <p className="text-xs text-slate-500 leading-normal">
          Earn more money and maximize your vehicle efficiency by partner dispatching with CargoGo:
        </p>
        <ul className="space-y-2 text-xs text-slate-600 pl-4 list-disc">
          <li><strong>Smart Route Optimization</strong>: Accept multiple nearby freight runs and get instant navigation route planning directly to save fuel.</li>
          <li><strong>Prompt Digital Payouts</strong>: Earnings update instantly on your dashboard when a shipper confirms the drop-off verification key.</li>
          <li><strong>Flexible Schedule</strong>: Work on your own terms. Select runs matching your tempo, pickup truck, or container vehicle type.</li>
        </ul>
        <div className="flex gap-2 justify-end pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Go Back
          </button>
          <button
            onClick={onJoin}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            Join as Driver Partner
          </button>
        </div>
      </div>
    </Modal>
  );
}
