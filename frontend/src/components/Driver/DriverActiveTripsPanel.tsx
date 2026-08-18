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
        className="absolute bottom-3 left-2.5 right-2.5 z-10 flex flex-col gap-2 md:hidden max-h-[56vh]"
      >
        {onToggleOnline && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-md px-3 py-2 flex items-center gap-2 shrink-0">
            <div className={`w-2 h-2 rounded-sm shrink-0 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-xs font-bold text-slate-900">{isOnline ? 'Online' : 'Offline'}</span>
            <button
              type="button"
              onClick={onToggleOnline}
              disabled={isOnline && activeBookings.length > 0}
              className="ml-auto text-xs font-bold text-white bg-slate-950 rounded-md px-2.5 py-1 cursor-pointer disabled:opacity-50"
            >
              {isOnline ? 'Go Offline' : 'Go Online'}
            </button>
          </div>
        )}
        <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-y-auto p-3 font-body text-slate-800 space-y-2 flex-1 min-h-0 text-left">
          {activeBookings.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No active jobs"
              description="Go online."
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
            <div className="space-y-2 text-xs">
              {activeBookings.map((b: any) => (
                <div key={b.id} className="p-2.5 border border-slate-200 rounded-lg flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 truncate">{b.cargoType}</p>
                    <BookingRouteRow pickupAddress={b.pickupAddress} dropoffAddress={b.dropoffAddress} className="text-slate-500 text-[10px]" />
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/track/${b.id}`)}
                    className="bg-slate-950 text-white px-2.5 py-1 text-xs font-bold rounded-md shrink-0 cursor-pointer"
                  >
                    Track
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
