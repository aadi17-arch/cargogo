import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function ContentModal({
  isOpen,
  onClose,
  title,
  badge,
  icon,
  subtitle,
  children,
  maxWidth = 'max-w-md'
}: ContentModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef, isOpen);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className={`relative w-full ${maxWidth} p-6 bg-slate-900 border border-slate-800 rounded-2xl text-white shadow-2xl space-y-4`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors bg-transparent border-0 cursor-pointer"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>
        <div className="flex items-center gap-2">
          {badge}
          {icon}
          <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>
        {subtitle && (
          <p className="text-xs text-slate-300 leading-relaxed">
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
