import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-5 border border-slate-200 border-dashed rounded-xl bg-slate-50/50">
      <div className="p-2.5 bg-slate-100 rounded-full text-slate-400 mb-3">
        <Icon size={20} />
      </div>
      <h4 className="text-xs font-semibold text-slate-700 font-heading mb-1">{title}</h4>
      <p className="text-xs text-slate-400 max-w-xs leading-normal font-body mb-3">{description}</p>
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
}
