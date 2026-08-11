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
    <BaseModal isOpen={isOpen} onClose={onClose} title="Performance" maxWidth="max-w-md">
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
    </BaseModal>
  );
}
