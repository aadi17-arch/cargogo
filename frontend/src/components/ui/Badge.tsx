const STATUS_CONFIG: Record<string, { label: string; className: string; dotColor: string }> = {
  PENDING:    { label: 'Pending', className: 'bg-amber-100 text-amber-900 border-amber-200', dotColor: 'bg-amber-500' },
  ACCEPTED:   { label: 'Accepted', className: 'bg-blue-100 text-blue-900 border-blue-200', dotColor: 'bg-blue-600' },
  IN_TRANSIT: { label: 'In Transit', className: 'bg-indigo-100 text-indigo-900 border-indigo-200', dotColor: 'bg-indigo-600 animate-pulse' },
  DELIVERED:  { label: 'Delivered', className: 'bg-emerald-100 text-emerald-900 border-emerald-200', dotColor: 'bg-emerald-600' },
  COMPLETED:  { label: 'Completed', className: 'bg-emerald-100 text-emerald-900 border-emerald-200', dotColor: 'bg-emerald-600' },
  CANCELLED:  { label: 'Cancelled', className: 'bg-rose-100 text-rose-900 border-rose-200', dotColor: 'bg-rose-600' },
  DISPUTED:   { label: 'Disputed', className: 'bg-red-100 text-red-900 border-red-200', dotColor: 'bg-red-600' },
};

interface BadgeProps {
  status: string;
  className?: string;
}

export default function Badge({ status, className = '' }: BadgeProps) {
  const config = STATUS_CONFIG[status] || { label: status, className: 'bg-slate-100 text-slate-800 border-slate-200', dotColor: 'bg-slate-500' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${config.className} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-sm shrink-0 ${config.dotColor}`} />
      <span>{config.label}</span>
    </span>
  );
}
