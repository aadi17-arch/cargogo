import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string; 
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg'
}: ModalProps) {
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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-4 bg-slate-900/40"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className={`w-full h-full sm:h-auto ${maxWidth} rounded-none sm:rounded-xl shadow-xl border border-slate-200 bg-white flex flex-col sm:max-h-[90vh] overflow-hidden transform transition-all`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h3 className="text-lg font-bold text-slate-800 tracking-tight font-heading">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 px-6 py-5 overflow-y-auto text-sm text-slate-600 font-body">
          {children}
        </div>
      </div>
    </div>
  );
}
