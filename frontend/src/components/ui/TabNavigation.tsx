import { LucideIcon } from 'lucide-react';

interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
}

interface TabNavigationProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: any) => void;
  className?: string;
}

export default function TabNavigation({
  tabs,
  activeTab,
  onChange,
  className = ''
}: TabNavigationProps) {
  return (
    <div className={`inline-flex items-center border border-slate-200 rounded-lg p-1 bg-white shadow-xs max-w-full overflow-x-auto ${className}`}>
      {tabs.map((tab, idx) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <div key={tab.id} className="flex items-center">
            {idx > 0 && <div className="w-[1px] h-4 bg-slate-200 mx-0.5 shrink-0" />}
            <button
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-slate-950 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {Icon && <Icon size={14} />}
              {tab.label}
            </button>
          </div>
        );
      })}
    </div>
  );
}
