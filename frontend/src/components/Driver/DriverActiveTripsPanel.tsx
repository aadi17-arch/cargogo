import { useNavigate } from 'react-router-dom';
import { Clock, RefreshCw } from 'lucide-react';
import BookingRouteRow from '@/components/UI/BookingRouteRow';
import IconButton from '@/components/UI/IconButton';
import EmptyState from '@/components/UI/EmptyState';

interface DriverActiveTripsPanelProps {
  activeBookings: any[];
  isOnline: boolean;
  onRefresh: () => void;
  onBrowseJobs: () => void;
  onToggleOnline?: () => void;
}

export default function DriverActiveTripsPanel({
  activeBookings,
  isOnline,
  onRefresh,
  onBrowseJobs,
  onToggleOnline
}: DriverActiveTripsPanelProps) {
  const navigate = useNavigate();

  return (
    <>
      {/* Desktop MapOverlayCard Content */}
      <div className="hidden md:block">
        {activeBookings.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No active jobs"
            description="Go online to receive deliveries."
            action={
              <button
                type="button"
                onClick={onBrowseJobs}
                className="text-xs font-bold text-slate-950 hover:underline bg-transparent border-none cursor-pointer"
              >
                Browse Jobs
              </button>
            }
          />
        ) : (
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-heading">Active Trips</h3>
                <p className="text-[11px] text-slate-500">Overview of currently active jobs</p>
              </div>
              <IconButton icon={RefreshCw} onClick={onRefresh} title="Refresh" />
            </div>
            <div className="divide-y divide-slate-100">
              {activeBookings.map((b: any) => (
                <div key={b.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900 truncate">{b.cargoType}</span>
                    </div>
                    <BookingRouteRow pickupAddress={b.pickupAddress} dropoffAddress={b.dropoffAddress} />
                    <div className="text-slate-500 flex items-center gap-1.5">
                      <span>₹{Math.round(b.price || b.totalPrice || 0)}</span>
                      <span>&middot;</span>
                      <span>{b.weightKg} kg</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/track/${b.id}`)}
                    className="bg-slate-950 hover:bg-slate-800 text-white px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer shrink-0 font-heading"
                  >
                    Track
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Overlay */}
      <div
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
        className="absolute bottom-2.5 left-2.5 right-2.5 z-10 bg-white rounded-xl border border-slate-200 shadow-xl p-3 md:hidden flex flex-col gap-2 max-h-[44vh]"
      >
        {onToggleOnline && (
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full shrink-0 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-xs font-bold text-slate-900 font-heading">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            <button
              type="button"
              onClick={onToggleOnline}
              disabled={isOnline && activeBookings.length > 0}
              className="text-[11px] font-bold text-white bg-slate-950 hover:bg-slate-800 rounded-md px-2.5 py-1 transition-all cursor-pointer font-heading disabled:opacity-50"
            >
              {isOnline ? 'Go Offline' : 'Go Online'}
            </button>
          </div>
        )}

        {activeBookings.length === 0 ? (
          <div className="py-2 px-1 flex items-center justify-between text-left">
            <div className="flex items-center gap-2 text-slate-500">
              <Clock size={16} className="text-slate-400 shrink-0" />
              <span className="text-xs font-medium text-slate-600 font-body">No active jobs</span>
            </div>
            <button
              type="button"
              onClick={onBrowseJobs}
              className="text-xs font-bold text-slate-950 hover:underline bg-transparent border-none cursor-pointer font-heading"
            >
              Browse Jobs →
            </button>
          </div>
        ) : (
          <div className="overflow-y-auto space-y-2 max-h-[30vh]">
            {activeBookings.map((b: any) => (
              <div key={b.id} className="p-2 border border-slate-200 rounded-lg flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1 text-left">
                  <p className="font-bold text-slate-900 truncate text-xs font-heading">{b.cargoType}</p>
                  <BookingRouteRow pickupAddress={b.pickupAddress} dropoffAddress={b.dropoffAddress} className="text-slate-500 text-[10px]" />
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/track/${b.id}`)}
                  className="bg-slate-950 text-white px-2.5 py-1 text-xs font-bold rounded-md shrink-0 cursor-pointer font-heading"
                >
                  Track
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
