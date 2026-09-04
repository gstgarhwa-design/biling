import React from 'react';
import { useApp } from '../context/AppContext';
import { DateSelectionControl } from './DateSelectionControl';
import { CalendarRange, RotateCcw } from 'lucide-react';

export const StickyPeriodHeader: React.FC = () => {
  const { 
    selectedPeriodLabel,
    dateSelectionMode,
    setDateSelectionMode,
    setSelectedMonth,
    activeCompany
  } = useApp();

  return (
    <div className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 px-4 py-3 rounded-2xl shadow-xs mb-5 flex flex-wrap items-center justify-between gap-3 transition-all">
      {/* Left: Active Period Indicator */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/60 dark:border-indigo-800/40 shrink-0">
          <CalendarRange className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {selectedPeriodLabel}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Date Filter
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden xs:block">
            {activeCompany?.name} • Invoices, reports, and ledger entries strictly filtered by this period
          </p>
        </div>
      </div>

      {/* Right: Unified Date Selection */}
      <div className="flex items-center gap-2">
        <DateSelectionControl />

        {/* Reset Filter Button if not Full FY */}
        {dateSelectionMode !== 'FY' && (
          <button
            onClick={() => {
              setDateSelectionMode('FY');
              setSelectedMonth('ALL');
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
            title="Reset to Full Financial Year"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
