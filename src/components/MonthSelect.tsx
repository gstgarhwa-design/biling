import React, { useState } from 'react';
import { FISCAL_MONTHS, FiscalMonthOption } from '../utils/financialYears';
import { CalendarDays, ChevronDown, Check } from 'lucide-react';

interface MonthSelectProps {
  value: string;
  onChange: (month: string) => void;
  className?: string;
  compact?: boolean;
  label?: string;
}

export const MonthSelect: React.FC<MonthSelectProps> = ({
  value,
  onChange,
  className = '',
  compact = false,
  label = 'Month'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedMonthOption = FISCAL_MONTHS.find(m => 
    m.key === value || 
    m.label.toLowerCase() === (value || '').toLowerCase()
  ) || FISCAL_MONTHS[0];

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200/70 dark:border-blue-900/60 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold shadow-2xs transition-all ${
          compact ? 'px-2.5 py-1 text-[11px]' : ''
        }`}
        title="Select Month (April to March or All Months)"
      >
        <CalendarDays className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
        <span>
          {label ? `${label}: ` : ''}
          <strong className="text-blue-600 dark:text-blue-400 font-bold">{selectedMonthOption.short}</strong>
        </span>
        <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 ml-0.5" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 mt-2 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                  Select Month
                </div>
                <div className="text-[10px] text-slate-500">
                  Fiscal Order: April to March
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded-full">
                12 Months
              </span>
            </div>

            {/* Months List */}
            <div className="max-h-64 overflow-y-auto mt-1 space-y-0.5 pr-1">
              {FISCAL_MONTHS.map(m => {
                const isSelected = selectedMonthOption.key === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => {
                      onChange(m.key);
                      setIsOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 text-left text-xs rounded-xl flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        m.key === 'ALL' ? 'bg-amber-400' : isSelected ? 'bg-white' : 'bg-blue-500'
                      }`} />
                      <span>{m.label}</span>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-white shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
