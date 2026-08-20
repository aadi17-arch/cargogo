import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'rounded-lg transition-all focus:outline-none flex items-center justify-center gap-2 select-none shadow-sm cursor-pointer disabled:cursor-not-allowed';
  
  const sizes = {
    sm: 'h-8 px-3 text-xs font-bold',
    md: 'h-10 min-h-[40px] px-4 text-xs font-bold',
    lg: 'h-11 min-h-[44px] px-5 text-sm font-bold',
  };

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
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${widthStyle} ${className}`}
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
