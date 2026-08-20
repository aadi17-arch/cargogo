import { useNavigate } from 'react-router-dom';
import { formatDate } from '@/utils/formatters';
import { Navigation, FileText, RefreshCw } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import BookingRouteRow from '@/components/ui/BookingRouteRow';
import SectionHeader from '@/components/ui/SectionHeader';
import IconButton from '@/components/ui/IconButton';
import EmptyState from '@/components/ui/EmptyState';

interface JobsBoardProps {
  type: 'available' | 'history';
  bookings: any[];
  onRefresh?: () => void;
  onAccept?: (bookingId: string) => void;
}

export default function JobsBoard({
  type,
  bookings,
  onRefresh,
  onAccept
}: JobsBoardProps) {
  const navigate = useNavigate();

  if (type === 'available') {
    return (
      <div className="space-y-3 w-full">
        <SectionHeader
          title="Available Shipments"
          action={onRefresh ? <IconButton icon={RefreshCw} onClick={onRefresh} title="Refresh" /> : undefined}
        />

        <div className="divide-y divide-slate-100 border-t border-b border-slate-100">
          {bookings.length > 0 ? (
            bookings.map((b: any) => (
              <div key={b.id} className="py-3 flex items-center justify-between gap-4 text-xs font-body">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="font-bold text-sm text-slate-900 font-heading">{b.cargoType}</span>
                    <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">
                      #{b.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <BookingRouteRow pickupAddress={b.pickupAddress} dropoffAddress={b.dropoffAddress} className="text-slate-600" />
                  <div className="text-slate-500 flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-slate-700">₹{Math.round(b.price)}</span>
                    <span>&middot;</span>
                    <span>{b.distanceKm} km</span>
                    <span>&middot;</span>
                    <span>{formatDate(b.createdAt)}</span>
                  </div>
                </div>
                {onAccept && (
                  <button
                    type="button"
                    onClick={() => onAccept(b.id)}
                    className="h-8 px-3.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer shrink-0 font-heading transition-colors shadow-xs"
                  >
                    Accept Shipment
                  </button>
                )}
              </div>
            ))
          ) : (
            <EmptyState
              icon={Navigation}
              title="No shipments available"
              description="Refresh to check for new load offers."
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 w-full">
      <SectionHeader title="Past Trips" />

      <div className="divide-y divide-slate-100 border-t border-b border-slate-100">
        {bookings.length > 0 ? (
          bookings.map((b: any) => (
            <div key={b.id} className="py-3 flex items-center justify-between gap-4 text-xs font-body">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                  <span className="font-bold text-sm text-slate-900 font-heading">{b.cargoType}</span>
                  <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">
                    #{b.id.slice(0, 8).toUpperCase()}
                  </span>
                  <Badge status={b.status} />
                </div>
                <BookingRouteRow pickupAddress={b.pickupAddress} dropoffAddress={b.dropoffAddress} className="text-slate-600" />
                <div className="text-slate-500 flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-slate-700">₹{Math.round(b.price)}</span>
                  <span>&middot;</span>
                  <span>{formatDate(b.createdAt)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/track/${b.id}`)}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 text-xs font-bold rounded-lg cursor-pointer shrink-0 font-heading"
              >
                Trip Log
              </button>
            </div>
          ))
        ) : (
          <EmptyState
            icon={FileText}
            title="No trip history found"
            description="Completed shipments will be listed here."
          />
        )}
      </div>
    </div>
  );
}
