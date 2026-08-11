import React from 'react';
import { LocateFixed } from 'lucide-react';

interface LocateButtonProps {
  onClick: () => void;
  className?: string;
}

const LocateButton: React.FC<LocateButtonProps> = ({ onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`w-10 h-10 md:w-11 md:h-11 flex items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-slate-950 transition shadow-lg cursor-pointer ${className}`}
      title="Locate Me"
    >
      <LocateFixed size={18} />
    </button>
  );
};

export default LocateButton;
