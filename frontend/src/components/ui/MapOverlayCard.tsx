import React from 'react';

interface MapOverlayCardProps {
  children: React.ReactNode;
  className?: string;
}

const MapOverlayCard: React.FC<MapOverlayCardProps> = ({ children, className = '' }) => {
  return (
    <div
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
      className={`absolute bottom-2.5 left-2.5 right-2.5 md:bottom-auto md:top-4 md:left-4 md:right-auto z-10 w-[calc(100%-20px)] md:w-[380px] bg-white rounded-2xl shadow-xl border border-slate-200 p-4 md:p-5 flex flex-col text-slate-800 text-left max-h-[75vh] md:max-h-[calc(100%-32px)] overflow-y-auto ${className}`}
    >
      {children}
    </div>
  );
};

export default MapOverlayCard;
