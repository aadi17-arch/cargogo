import BaseModal from '../ui/BaseModal';

interface DriverStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverEarnings: number;
  completedCount: number;
  activeCount: number;
}

export default function DriverStatsModal({
  isOpen,
  onClose,
  driverEarnings,
  completedCount,
  activeCount
}: DriverStatsModalProps) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="My Performance" maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-lg text-center border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Earnings</p>
            <p className="text-xl font-bold text-emerald-600 font-mono">₹{driverEarnings}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg text-center border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Completed</p>
            <p className="text-xl font-bold text-slate-800">{completedCount}</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 border-t border-slate-100 pt-3 space-y-2.5 text-xs">
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-500">Active Deliveries:</span>
            <span className="font-bold text-slate-800">{activeCount}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-500">Acceptance Rate:</span>
            <span className="font-bold text-indigo-600">100%</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-500">Profile Status:</span>
            <span className="font-bold text-emerald-600">Verified Partner</span>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
