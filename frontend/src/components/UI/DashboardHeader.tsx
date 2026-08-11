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
    <div className="w-full bg-white border-b border-slate-100 px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shrink-0 z-20">
      <h2 className="text-xl font-bold text-slate-900 font-heading">{title}</h2>

      {}
      <div className="inline-flex items-center border border-slate-200 rounded-lg p-1 bg-white shadow-sm">
        {tabs.map((tab, idx) => (
          <React.Fragment key={tab.id}>
            {idx > 0 && <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />}
            <button
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-md transition-all ${
                activeTab === tab.id
                  ? 'bg-slate-950 text-white'
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
