import React from 'react';

interface AuthPageShellProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthPageShell({ children, title, subtitle }: AuthPageShellProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 px-4 py-8 font-body">
      <div className="flex items-center gap-2 mb-4 cursor-pointer select-none font-tech-space">
        <span className="font-black text-sm text-white bg-slate-900 px-3 py-1 rounded-[var(--radius-card)] tracking-tight shadow-sm">
          Cargo
        </span>
        <span className="font-bold text-2xl text-slate-800 tracking-tight">
          Go
        </span>
      </div>

      <div className="bg-white p-8 w-full max-w-sm card shadow-sm space-y-5 rounded-[var(--radius-card)]">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight font-heading">
            {title}
          </h2>
          <p className="text-xs text-slate-400 font-medium leading-none">
            {subtitle}
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
