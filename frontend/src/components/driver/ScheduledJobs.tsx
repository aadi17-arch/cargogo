import { useState } from 'react';
import { ScheduledJob } from '@/types/booking.types';
import { formatDate } from '@/utils/formatters';
import { CalendarClock, Briefcase, RefreshCw } from 'lucide-react';
import IconButton from '@/components/ui/IconButton';
import EmptyState from '@/components/ui/EmptyState';

interface ScheduledJobsProps {
  scheduledJobs: ScheduledJob[];
  availableScheduledJobs: ScheduledJob[];
  loading: boolean;
  committingJobId: string | null;
  onRefresh: () => void;
  onCommit: (bookingId: string) => void;
  onOptimizeRoute: () => void;
}

export default function ScheduledJobs({
  scheduledJobs,
  availableScheduledJobs,
  loading,
  committingJobId,
  onRefresh,
  onCommit,
  onOptimizeRoute
}: ScheduledJobsProps) {
  const [showScheduledBoard, setShowScheduledBoard] = useState(false);

  return (
    <div className="space-y-3 w-full">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <CalendarClock size={14} className="text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-800 font-heading">Scheduled Deliveries</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center border border-slate-200 rounded-lg p-1 bg-white shadow-xs">
            <button
              type="button"
              onClick={() => setShowScheduledBoard(false)}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                !showScheduledBoard ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Committed
            </button>
            <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />
            <button
              type="button"
              onClick={() => {
                setShowScheduledBoard(true);
                onRefresh();
              }}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                showScheduledBoard ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Find Work
            </button>
          </div>
          <IconButton icon={RefreshCw} onClick={onRefresh} title="Refresh" />
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm font-medium">Loading schedule...</div>
      ) : (
        <div className="divide-y divide-slate-100 border-t border-b border-slate-100">
          {!showScheduledBoard ? (
            scheduledJobs.length > 0 ? (
              scheduledJobs.map((job: ScheduledJob) => (
                <div key={job.id} className="py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs font-body">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 font-heading">{job.cargoType}</span>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{formatDate(job.scheduledAt)}</span>
                    </div>
                    <p className="text-slate-600 mb-1.5"><span className="font-medium text-slate-900">{job.pickupAddress.split(',')[0]} → {job.dropoffAddress.split(',')[0]}</span></p>
                    <div className="text-slate-500 flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-slate-700">₹{Math.round(job.price)}</span>
                      <span>&middot;</span>
                      <span>{job.weightKg} kg</span>
                      <span>&middot;</span>
                      <span>{job.distanceKm} km</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onOptimizeRoute}
                    className="h-8 px-3.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer shrink-0 font-heading self-start md:self-center transition-colors shadow-xs"
                  >
                    Optimize Route
                  </button>
                </div>
              ))
            ) : (
              <EmptyState icon={CalendarClock} title="No committed schedules" description="Go to 'Find Work' to reserve upcoming calendar routes." />
            )
          ) : (
            availableScheduledJobs.length > 0 ? (
              availableScheduledJobs.map((job: ScheduledJob) => (
                <div key={job.id} className="py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs font-body">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 font-heading">{job.cargoType}</span>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{formatDate(job.scheduledAt)}</span>
                    </div>
                    <p className="text-slate-600 mb-1.5"><span className="font-medium text-slate-900">{job.pickupAddress.split(',')[0]} → {job.dropoffAddress.split(',')[0]}</span></p>
                    <div className="text-slate-500 flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-slate-700">₹{Math.round(job.price)}</span>
                      <span>&middot;</span>
                      <span>{job.weightKg} kg</span>
                      <span>&middot;</span>
                      <span>{job.distanceKm} km</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onCommit(job.id)}
                    disabled={committingJobId === job.id}
                    className="h-8 px-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-bold rounded-lg cursor-pointer shrink-0 font-heading self-start md:self-center transition-colors shadow-xs"
                  >
                    {committingJobId === job.id ? 'Reserving...' : 'Reserve Load'}
                  </button>
                </div>
              ))
            ) : (
              <EmptyState icon={Briefcase} title="No loads to reserve" description="Check back later for available contract schedule jobs." />
            )
          )}
        </div>
      )}
    </div>
  );
}
