import React from 'react';
import { useApp } from '../context/AppContext';
import { FinancialYearSelect } from './FinancialYearSelect';
import { MonthSelect } from './MonthSelect';
import { FISCAL_MONTHS } from '../utils/financialYears';
import { CalendarRange, Filter, RotateCcw } from 'lucide-react';

export const StickyPeriodHeader: React.FC = () => {
  const { 
    selectedFinancialYear, 
    setSelectedFinancialYear,
    selectedMonth,
    setSelectedMonth,
    activeCompany
  } = useApp();

  const currentMonthOption = FISCAL_MONTHS.find(m => m.key === selectedMonth) || FISCAL_MONTHS[0];

  return (
    <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/70 dark:border-white/10 px-3.5 py-2.5 rounded-2xl shadow-2xs mb-5 flex flex-wrap items-center justify-between gap-3 transition-all">
      {/* Left: Active Period Indicator */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/50 dark:border-indigo-800/40 shrink-0">
          <CalendarRange className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              FY {selectedFinancialYear}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
              {currentMonthOption.label}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live DB Filter
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden xs:block">
            {activeCompany?.name} • Records strictly filtered by this period
          </p>
        </div>
      </div>

      {/* Right: Selectors */}
      <div className="flex items-center gap-2">
        {/* 50 Financial Years Dropdown */}
        <FinancialYearSelect
          value={selectedFinancialYear}
          onChange={setSelectedFinancialYear}
          compact
          label="FY"
        />

        {/* 12 Fiscal Months Dropdown */}
        <MonthSelect
          value={selectedMonth}
          onChange={setSelectedMonth}
          compact
          label="Month"
        />

        {/* Reset Filter Button */}
        {selectedMonth !== 'ALL' && (
          <button
            onClick={() => setSelectedMonth('ALL')}
            className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
            title="Reset to Full Financial Year"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
