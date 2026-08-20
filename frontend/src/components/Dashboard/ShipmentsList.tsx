import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import TabNavigation from '@/components/ui/TabNavigation';
import IconButton from '@/components/ui/IconButton';
import Badge from '@/components/ui/Badge';
import { formatDate } from '@/utils/formatters';
import { RefreshCw, ChevronDown, MapPin } from 'lucide-react';

interface ShipmentsListProps {
  bookings: any[];
  onRefresh: () => void;
  onPay: (booking: any) => void;
  onCancelClick: (bookingId: string) => void;
}

export default function ShipmentsList({
  bookings,
  onRefresh,
  onPay,
  onCancelClick
}: ShipmentsListProps) {
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'INSTANT' | 'SCHEDULED'>('ALL');
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const filteredBookings = useMemo(() => {
    if (historyFilter === 'ALL') return bookings;
    return bookings.filter((b: any) => b.bookingType === historyFilter);
  }, [bookings, historyFilter]);

  return (
    <div className="flex-1 w-full bg-white flex flex-col overflow-y-auto px-8 py-6 space-y-4">
      {/* Header controls */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-150">
        <TabNavigation
          tabs={[
            { id: 'ALL', label: 'All' },
            { id: 'INSTANT', label: 'Instant' },
            { id: 'SCHEDULED', label: 'Scheduled' }
          ]}
          activeTab={historyFilter}
          onChange={setHistoryFilter}
        />

        <IconButton
          icon={RefreshCw}
          onClick={onRefresh}
          title="Refresh"
        />
      </div>

      {/* Shipments list */}
      <div className="divide-y divide-slate-100 border-t border-b border-slate-100">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm font-medium">
            No shipments.
          </div>
        ) : (
          filteredBookings.map((b: any) => {
            const isExpanded = expandedBookingId === b.id;
            return (
              <div
                key={b.id}
                className="py-4 px-2 flex flex-col cursor-pointer hover:bg-slate-50/70 transition-colors"
                onClick={() => setExpandedBookingId(isExpanded ? null : b.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-sm text-slate-900 font-heading">
                      {b.cargoType}
                    </span>
                    <Badge status={b.status} />
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm font-black text-slate-900 font-heading">
                      ₹{Math.round(b.price)}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>
                </div>

                {isExpanded && (
                  <div
                    className="mt-3 pt-3 border-t border-slate-150 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-700 text-left animate-fadeIn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs font-bold text-slate-700 block">Booking ID</span>
                        <span className="font-mono font-bold text-slate-900 text-xs">#{b.id.substring(0, 8).toUpperCase()}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-bold text-slate-700 block">Pickup</span>
                          <span className="font-medium text-slate-800 leading-snug block mt-0.5">{b.pickupAddress}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin size={14} className="text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-bold text-slate-700 block">Dropoff</span>
                          <span className="font-medium text-slate-800 leading-snug block mt-0.5">{b.dropoffAddress}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 md:border-l md:border-slate-150 md:pl-5 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-700">Date</span>
                          <span className="font-mono font-medium text-slate-800 text-xs">{formatDate(b.createdAt)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-700">Vehicle</span>
                          <span className="font-bold text-slate-900 text-xs">
                            {b.vehicleType === 'MINI_TEMPO' ? 'Mini Tempo' : b.vehicleType === 'PICKUP_TRUCK' ? 'Pickup Truck' : b.vehicleType === 'CONTAINER_3TON' ? '3-Ton Container' : b.vehicleType}
                          </span>
                        </div>
                        {b.status === 'ACCEPTED' && (
                          <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200 mt-1">
                            <span className="text-slate-700 font-bold text-xs">Pickup OTP</span>
                            <strong className="font-mono text-slate-900 text-xs tracking-wider font-extrabold">{b.pickupOTP}</strong>
                          </div>
                        )}
                        {b.status === 'IN_TRANSIT' && (
                          <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200 mt-1">
                            <span className="text-slate-700 font-bold text-xs">Dropoff OTP</span>
                            <strong className="font-mono text-slate-900 text-xs tracking-wider font-extrabold">{b.dropoffOTP}</strong>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-3 justify-end">
                        {['PENDING', 'ACCEPTED'].includes(b.status) && (
                          <button
                            type="button"
                            onClick={() => onCancelClick(b.id)}
                            className="px-3.5 py-1.5 border border-rose-200 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer font-heading"
                          >
                            Cancel
                          </button>
                        )}
                        {b.status === 'DELIVERED' && (
                          <button
                            type="button"
                            onClick={() => onPay(b)}
                            className="px-3.5 py-1.5 bg-slate-950 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition font-heading shadow-xs cursor-pointer"
                          >
                            Pay Fare
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => navigate(`/track/${b.id}`)}
                          className="px-3.5 py-1.5 bg-slate-950 text-white font-bold rounded-lg text-xs hover:bg-slate-800 transition font-heading shadow-xs cursor-pointer"
                        >
                          Track
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
