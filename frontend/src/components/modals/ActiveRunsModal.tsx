import BaseModal from '../ui/BaseModal';
import { useNavigate } from 'react-router-dom';

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
        <div className="text-center py-6 text-slate-400">
          <p className="text-sm font-medium">No active shipments at this time.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeShipperRuns.map((b: any) => (
            <div key={b.id} className="p-4 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between gap-4">
              <div className="min-w-0">
                <span className="text-[10px] font-bold font-mono text-slate-400">ID: {b.id.substring(0, 8)}</span>
                <h4 className="text-sm font-bold text-slate-800 truncate mb-1">{b.cargoType}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100/50 uppercase">
                    {b.status}
                  </span>
                  <span className="text-xs font-bold font-mono text-slate-700">₹{b.price}</span>
                </div>
              </div>
              <button 
                onClick={() => {
                  onClose();
                  navigate(`/track/${b.id}`);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors shadow-sm shrink-0"
              >
                Track
              </button>
            </div>
          ))}
        </div>
      )}
    </BaseModal>
  );
}
