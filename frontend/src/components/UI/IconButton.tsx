import { LucideIcon } from 'lucide-react';

interface IconButtonProps {
  icon: LucideIcon;
  onClick: () => void;
  title?: string;
  className?: string;
}

export default function IconButton({ icon: Icon, onClick, title, className = '' }: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-8 h-8 flex items-center justify-center border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition bg-white shadow-xs cursor-pointer ${className}`}
      title={title}
    >
      <Icon size={14} />
    </button>
  );
}
