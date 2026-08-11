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
    <div className="flex flex-col items-center justify-center text-center p-8 md:p-12 border border-slate-200 border-dashed rounded-xl bg-slate-50/50">
      <div className="p-3 bg-slate-100 rounded-full text-slate-400 mb-4 shadow-inner">
        <Icon size={28} />
      </div>
      <h4 className="text-sm font-bold text-slate-800 font-heading mb-1.5">{title}</h4>
      <p className="text-xs text-slate-500 max-w-xs leading-normal font-body mb-4">{description}</p>
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
}
