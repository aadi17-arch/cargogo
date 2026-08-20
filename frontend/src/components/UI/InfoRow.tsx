import React from 'react';

interface InfoRowProps {
  label: React.ReactNode;
  value: React.ReactNode;
  isTotal?: boolean;
  className?: string;
}

export default function InfoRow({
  label,
  value,
  isTotal = false,
  className = ''
}: InfoRowProps) {
  if (isTotal) {
    return (
      <div className={`border-t border-slate-100 pt-3 flex justify-between items-center text-xs ${className}`}>
        <span className="font-bold text-slate-900 font-heading">{label}</span>
        <span className="text-base font-extrabold text-slate-900 font-heading">{value}</span>
      </div>
    );
  }

  return (
    <div className={`flex justify-between items-center text-xs ${className}`}>
      <span className="font-medium text-slate-500">{label}</span>
      <span className="font-bold text-slate-900 font-heading">{value}</span>
    </div>
  );
}
