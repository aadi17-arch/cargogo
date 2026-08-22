import { Map, List } from 'lucide-react';

interface MobileViewToggleProps {
  activeView: 'map' | 'details';
  onToggle: (view: 'map' | 'details') => void;
  className?: string;
}

export default function MobileViewToggle({
  activeView,
  onToggle,
  className = ''
}: MobileViewToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Toggle between Map and Details view"
      className={`inline-flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 lg:hidden select-none ${className}`}
    >
      <button
        type="button"
        role="tab"
        aria-selected={activeView === 'map'}
        onClick={() => onToggle('map')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
          activeView === 'map'
            ? 'bg-slate-950 text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
        }`}
      >
        <Map size={13} aria-hidden="true" />
        <span>Map</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeView === 'details'}
        onClick={() => onToggle('details')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
          activeView === 'details'
            ? 'bg-slate-950 text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
        }`}
      >
        <List size={13} aria-hidden="true" />
        <span>Details</span>
      </button>
    </div>
  );
}
