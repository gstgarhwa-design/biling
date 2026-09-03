import React, { useState } from 'react';
import { FIFTY_FINANCIAL_YEARS, FinancialYearOption } from '../utils/financialYears';
import { Calendar, ChevronDown, Check, Search } from 'lucide-react';

interface FinancialYearSelectProps {
  value: string;
  onChange: (fy: string) => void;
  className?: string;
  compact?: boolean;
  label?: string;
}

export const FinancialYearSelect: React.FC<FinancialYearSelectProps> = ({
  value,
  onChange,
  className = '',
  compact = false,
  label = 'FY'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'CURRENT' | 'PAST' | 'FUTURE'>('ALL');

  const filteredYears = FIFTY_FINANCIAL_YEARS.filter(item => {
    const matchesSearch = item.value.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.startYear.toString().includes(searchTerm) ||
                          item.endYear.toString().includes(searchTerm);
    if (!matchesSearch) return false;

    if (filterTab === 'CURRENT') return item.isCurrent;
    if (filterTab === 'PAST') return item.category === 'PAST';
    if (filterTab === 'FUTURE') return item.category === 'FUTURE';
    return true;
  });

  const selectedItem = FIFTY_FINANCIAL_YEARS.find(y => y.value === value) || {
    value: value || '2025-26',
    label: `FY ${value || '2025-26'}`,
    isCurrent: true
  };

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200/70 dark:border-indigo-900/60 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold shadow-2xs transition-all ${
          compact ? 'px-2.5 py-1 text-[11px]' : ''
        }`}
        title="Select from 50 Financial Years (2005-06 to 2054-55)"
      >
        <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <span>
          {label ? `${label}: ` : ''}
          <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{selectedItem.value}</strong>
        </span>
        <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 ml-0.5" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-2.5 z-50 animate-in fade-in zoom-in-95">
            {/* Header / Info */}
            <div className="px-2 py-1 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  50 Financial Years (FY)
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Select any Indian fiscal year (Apr 1 - Mar 31)
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded-full">
                50 Years Range
              </span>
            </div>

            {/* Search Input */}
            <div className="mt-2 relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search year (e.g. 2024, 2026, 2030)..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                autoFocus
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 mt-2 text-[10px] font-semibold border-b border-slate-100 dark:border-slate-800 pb-1.5">
              {(['ALL', 'CURRENT', 'PAST', 'FUTURE'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={`px-2 py-0.5 rounded-lg transition-colors ${
                    filterTab === tab
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab === 'ALL' ? 'All (50)' : tab === 'CURRENT' ? 'Current' : tab === 'PAST' ? 'Past' : 'Upcoming'}
                </button>
              ))}
            </div>

            {/* Scrollable list of 50 Financial Years */}
            <div className="mt-1.5 max-h-60 overflow-y-auto space-y-0.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredYears.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No matching financial year found
                </div>
              ) : (
                filteredYears.map(fy => {
                  const isSelected = fy.value === value;
                  return (
                    <button
                      key={fy.value}
                      type="button"
                      onClick={() => {
                        onChange(fy.value);
                        setIsOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{fy.value}</span>
                        {fy.isCurrent && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Current FY
                          </span>
                        )}
                        {fy.category === 'FUTURE' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Upcoming
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-normal">
                          {fy.startYear}-{fy.endYear}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
