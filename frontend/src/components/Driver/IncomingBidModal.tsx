interface IncomingBidModalProps {
  bid: {
    bookingId: string;
    cargoType: string;
    price: number;
    distanceKm: number;
  };
  countdown: number;
  onAccept: () => void;
  onReject: () => void;
}

export default function IncomingBidModal({
  bid,
  countdown,
  onAccept,
  onReject
}: IncomingBidModalProps) {
  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 w-[320px]">
      <div className="bg-white border-2 border-slate-900 rounded-xl shadow-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 font-heading">New Delivery Request!</h3>
          <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
            {countdown}s
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="block text-[10px] font-bold text-slate-500">Cargo</span>
            <span className="font-bold text-slate-900 truncate block">{bid.cargoType}</span>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-500">Payout</span>
            <span className="font-extrabold text-slate-900">₹{Math.round(bid.price)}</span>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-500">Distance</span>
            <span className="font-bold text-slate-900">{bid.distanceKm} km</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onAccept}
            className="flex-1 bg-slate-950 hover:bg-slate-800 text-white py-1.5 text-xs font-bold rounded-lg cursor-pointer font-heading"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={onReject}
            className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-1.5 text-xs font-bold rounded-lg cursor-pointer font-heading"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
