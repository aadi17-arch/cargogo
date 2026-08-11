import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}

export default function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
      <div>
        <h3 className="text-lg font-bold text-slate-900 font-heading">{title}</h3>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
