import BaseModal from '../ui/BaseModal';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../ui/StatusBadge';

interface ActiveRunsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeShipperRuns: any[];
}

export default function ActiveRunsModal({ isOpen, onClose, activeShipperRuns }: ActiveRunsModalProps) {
  const navigate = useNavigate();

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Active Shipments" maxWidth="max-w-xl">
      {activeShipperRuns.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-xs font-medium">
          No active shipments.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 border-t border-b border-slate-100">
          {activeShipperRuns.map((b: any) => (
            <div key={b.id} className="py-3.5 flex items-center justify-between gap-4 text-left">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-slate-900 font-heading">{b.cargoType}</span>
                  <StatusBadge status={b.status} />
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
                  className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                >
                  Track
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </BaseModal>
  );
}
