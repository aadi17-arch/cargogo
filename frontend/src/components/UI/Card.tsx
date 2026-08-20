import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'muted' | 'danger' | 'success';
  children: React.ReactNode;
  className?: string;
}

export default function Card({
  size = 'md',
  variant = 'default',
  children,
  className = '',
  ...props
}: CardProps) {
  const baseStyles = 'rounded-xl border shadow-xs transition-all text-left font-body';

  const sizes = {
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-6 sm:p-8',
  };

  const variants = {
    default: 'bg-white border-slate-200 text-slate-800',
    muted: 'bg-slate-50/70 border-slate-200 text-slate-700',
    danger: 'bg-white border-rose-200 text-slate-800',
    success: 'bg-white border-emerald-200 text-slate-800',
  };

  return (
    <div
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
