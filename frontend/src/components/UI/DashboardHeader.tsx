import React from 'react';

export interface DashboardTab {
  id: string;
  label: string;
}

interface DashboardHeaderProps {
  title: string;
  tabs: DashboardTab[];
  activeTab: string;
  onChange: (id: any) => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  tabs,
  activeTab,
  onChange,
}) => {
  return (
    <div className="w-full bg-white border-b border-slate-100 px-3 sm:px-6 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 shrink-0 z-20">
      <h2 className="text-base sm:text-xl font-bold text-slate-900 font-heading text-left">{title}</h2>

      {/* Tabs list with horizontal scroll support on mobile */}
      <div className="inline-flex items-center border border-slate-200 rounded-lg p-1 bg-white shadow-xs max-w-full overflow-x-auto no-scrollbar">
        {tabs.map((tab, idx) => (
          <React.Fragment key={tab.id}>
            {idx > 0 && <div className="w-[1px] h-4 bg-slate-200 mx-0.5 shrink-0" />}
            <button
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default DashboardHeader;
