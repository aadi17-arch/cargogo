import React from 'react';

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline' | 'danger';
  isLoading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export default function PrimaryButton({
  variant = 'primary',
  isLoading = false,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}: PrimaryButtonProps) {
  const baseStyles = 'px-4 py-2.5 text-xs font-bold rounded-lg transition-all focus:outline-none flex items-center justify-center gap-2 select-none shadow-sm';
  
  const variants = {
    primary: 'bg-slate-900 hover:bg-slate-800 text-white border border-transparent disabled:bg-slate-200 disabled:text-slate-400',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 border border-transparent disabled:bg-transparent disabled:text-slate-300',
    outline: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 disabled:bg-white disabled:text-slate-300',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white border border-transparent disabled:bg-rose-200 disabled:text-rose-400'
  };

  const widthStyle = fullWidth ? 'w-full' : 'w-auto';

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${widthStyle} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <span>Processing...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
