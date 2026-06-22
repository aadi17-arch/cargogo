const STATUS_COLORS: Record<string, string> = {
  PENDING:    'var(--color-status-pending)',
  ACCEPTED:   'var(--color-status-accepted)',
  IN_TRANSIT: 'var(--color-status-transit)',
  DELIVERED:  'var(--color-status-delivered)',
  COMPLETED:  'var(--color-status-completed)',
  CANCELLED:  'var(--color-status-cancelled)',
  DISPUTED:   'var(--color-status-cancelled)',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const color = STATUS_COLORS[status] || 'var(--color-text-muted)';
  return (
    <span
      className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold tracking-wide uppercase border-[1.5px] bg-transparent shrink-0 ${className}`}
      style={{ fontFamily: 'var(--font-mono)', borderColor: color, color }}
    >
      {status}
    </span>
  );
}
