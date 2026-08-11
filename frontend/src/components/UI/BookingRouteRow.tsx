interface BookingRouteRowProps {
  pickupAddress?: string;
  dropoffAddress?: string;
  className?: string;
}

export default function BookingRouteRow({ pickupAddress, dropoffAddress, className = '' }: BookingRouteRowProps) {
  if (!pickupAddress || !dropoffAddress) return null;
  return (
    <p className={`text-[11px] text-slate-600 truncate mb-1 ${className}`}>
      {pickupAddress.split(',')[0]} &rarr; {dropoffAddress.split(',')[0]}
    </p>
  );
}
