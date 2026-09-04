import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FIFTY_FINANCIAL_YEARS, 
  FISCAL_MONTHS, 
  DateSelectionMode, 
  formatDateToIndianDisplay 
} from '../utils/financialYears';
import { 
  Calendar, 
  CalendarRange, 
  CalendarDays, 
  ChevronDown, 
  Check, 
  Search, 
  RotateCcw,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface DateSelectionControlProps {
  compact?: boolean;
  className?: string;
}

export const DateSelectionControl: React.FC<DateSelectionControlProps> = ({ 
  compact = false,
  className = ''
}) => {
  const {
    dateSelectionMode,
    setDateSelectionMode,
    selectedFinancialYear,
    setSelectedFinancialYear,
    selectedMonth,
    setSelectedMonth,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    selectedPeriodLabel
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DateSelectionMode>(dateSelectionMode);
  const [fySearch, setFySearch] = useState('');
  const [fySortOrder, setFySortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Local state for Custom Date inputs until "Apply" is clicked
  const [localStartDate, setLocalStartDate] = useState(customStartDate || '2026-04-01');
  const [localEndDate, setLocalEndDate] = useState(customEndDate || '2026-06-30');
  const [dateError, setDateError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync activeTab and local custom dates when modal opens or global mode changes
  useEffect(() => {
    setActiveTab(dateSelectionMode);
    if (customStartDate) setLocalStartDate(customStartDate);
    if (customEndDate) setLocalEndDate(customEndDate);
  }, [dateSelectionMode, customStartDate, customEndDate, isOpen]);

  // Click away listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filtered and Sorted Financial Years for FY tab (Ascending by default: 2005-06 -> 2054-55)
  const filteredFys = [...FIFTY_FINANCIAL_YEARS]
    .filter(item => 
      item.label.toLowerCase().includes(fySearch.toLowerCase()) ||
      item.value.includes(fySearch)
    )
    .sort((a, b) => fySortOrder === 'asc' ? a.startYear - b.startYear : b.startYear - a.startYear);

  // Apply custom date range
  const handleApplyCustomDate = () => {
    if (!localStartDate || !localEndDate) {
      setDateError('Please provide both Start Date and End Date.');
      return;
    }
    if (localStartDate > localEndDate) {
      setDateError('Start Date cannot be after End Date.');
      return;
    }
    setDateError(null);
    setCustomStartDate(localStartDate);
    setCustomEndDate(localEndDate);
    setDateSelectionMode('CUSTOM');
    setIsOpen(false);
  };

  // Preset custom date helpers
  const applyPreset = (preset: 'TODAY' | 'THIS_MONTH' | 'LAST_MONTH' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'FULL_FY') => {
    const parts = selectedFinancialYear.split('-');
    const startYear = parseInt(parts[0], 10) || 2026;
    const nextYear = startYear + 1;

    let start = '';
    let end = '';

    const todayStr = new Date().toISOString().substring(0, 10);

    switch (preset) {
      case 'TODAY':
        start = todayStr;
        end = todayStr;
        break;
      case 'THIS_MONTH': {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
        start = `${y}-${m}-01`;
        end = `${y}-${m}-${lastDay}`;
        break;
      }
      case 'LAST_MONTH': {
        const now = new Date();
        now.setMonth(now.getMonth() - 1);
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
        start = `${y}-${m}-01`;
        end = `${y}-${m}-${lastDay}`;
        break;
      }
      case 'Q1':
        start = `${startYear}-04-01`;
        end = `${startYear}-06-30`;
        break;
      case 'Q2':
        start = `${startYear}-07-01`;
        end = `${startYear}-09-30`;
        break;
      case 'Q3':
        start = `${startYear}-10-01`;
        end = `${startYear}-12-31`;
        break;
      case 'Q4':
        start = `${nextYear}-01-01`;
        end = `${nextYear}-03-31`;
        break;
      case 'FULL_FY':
        start = `${startYear}-04-01`;
        end = `${nextYear}-03-31`;
        break;
    }

    setLocalStartDate(start);
    setLocalEndDate(end);
    setDateError(null);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      {/* Trigger Button with unified "Date Selection" Label */}
      <button
        type="button"
        id="date-selection-trigger-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-xl font-semibold transition-all border shadow-2xs ${
          compact
            ? 'px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500'
            : 'px-3.5 py-2 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-300/80 dark:border-slate-700 hover:border-indigo-500 hover:shadow-xs'
        }`}
        title="Click to change Date Selection (Financial Year, Month, or Custom Date)"
      >
        <div className="w-5 h-5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
          {dateSelectionMode === 'CUSTOM' ? (
            <CalendarRange className="w-3.5 h-3.5" />
          ) : dateSelectionMode === 'MONTH' ? (
            <CalendarDays className="w-3.5 h-3.5" />
          ) : (
            <Calendar className="w-3.5 h-3.5" />
          )}
        </div>

        <div className="flex flex-col text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 leading-none">
            Date Selection
          </span>
          <span className="font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[200px] sm:max-w-[260px]">
            {selectedPeriodLabel}
          </span>
        </div>

        <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 shrink-0 hidden md:inline-block">
          {dateSelectionMode === 'CUSTOM' ? 'Custom' : dateSelectionMode === 'MONTH' ? 'Month' : 'FY'}
        </span>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Date Selection Modal / Dropdown Dialog */}
      {isOpen && (
        <div className="absolute right-0 sm:right-auto sm:left-0 mt-2 w-[340px] sm:w-[440px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                <CalendarRange className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  Date Selection
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Filter live database records and reports
                </p>
              </div>
            </div>

            <div className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50">
              Live DB
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-3 p-1.5 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-center">
            <button
              type="button"
              onClick={() => setActiveTab('FY')}
              className={`py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'FY'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Financial Year</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('MONTH')}
              className={`py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'MONTH'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Month</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('CUSTOM')}
              className={`py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'CUSTOM'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Custom Date</span>
            </button>
          </div>

          {/* TAB CONTENT */}
          <div className="p-4">
            {/* 1. FINANCIAL YEAR TAB */}
            {activeTab === 'FY' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search Financial Year (e.g. 2025, 2026)..."
                      value={fySearch}
                      onChange={(e) => setFySearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Ascending / Descending Toggle */}
                  <button
                    type="button"
                    onClick={() => setFySortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="px-2.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/70 dark:bg-indigo-950/50 hover:bg-indigo-100 text-[11px] font-extrabold text-indigo-700 dark:text-indigo-300 flex items-center gap-1 shrink-0 transition-colors shadow-2xs"
                    title="Toggle Ascending (Oldest to Newest) or Descending"
                  >
                    <span>{fySortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}</span>
                  </button>
                </div>

                {/* Sub-bar with Sorting Info and Jump to Current FY */}
                <div className="flex items-center justify-between text-[11px] px-1 text-slate-500 dark:text-slate-400">
                  <span className="font-semibold flex items-center gap-1">
                    <span>Order:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {fySortOrder === 'asc' ? 'Ascending (2005 → 2055)' : 'Descending (2055 → 2005)'}
                    </span>
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFinancialYear('2025-26');
                      setDateSelectionMode('FY');
                      setIsOpen(false);
                    }}
                    className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-bold hover:underline"
                  >
                    Current FY (2025-26)
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {filteredFys.map((fy) => {
                    const isSelected = selectedFinancialYear === fy.value && dateSelectionMode === 'FY';
                    return (
                      <button
                        key={fy.value}
                        type="button"
                        onClick={() => {
                          setSelectedFinancialYear(fy.value);
                          setDateSelectionMode('FY');
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{fy.label}</span>
                          {fy.isCurrent && (
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            }`}>
                              CURRENT
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                            {fy.startYear} - {fy.endYear}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. MONTH TAB */}
            {activeTab === 'MONTH' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Selected FY Context:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    FY {selectedFinancialYear}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FISCAL_MONTHS.map((m) => {
                    const isSelected = selectedMonth === m.key && dateSelectionMode === 'MONTH';
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => {
                          setSelectedMonth(m.key);
                          setDateSelectionMode('MONTH');
                          setIsOpen(false);
                        }}
                        className={`p-2 rounded-xl text-xs font-semibold text-center border transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div>{m.label}</div>
                        {m.key !== 'ALL' && (
                          <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                            {m.monthNum >= 4 
                              ? selectedFinancialYear.split('-')[0] 
                              : String(parseInt(selectedFinancialYear.split('-')[0], 10) + 1)}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. CUSTOM DATE TAB */}
            {activeTab === 'CUSTOM' && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      From Date (Start)
                    </label>
                    <input
                      type="date"
                      value={localStartDate}
                      onChange={(e) => setLocalStartDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                      {formatDateToIndianDisplay(localStartDate)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      To Date (End)
                    </label>
                    <input
                      type="date"
                      value={localEndDate}
                      onChange={(e) => setLocalEndDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                      {formatDateToIndianDisplay(localEndDate)}
                    </span>
                  </div>
                </div>

                {dateError && (
                  <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 text-red-600 text-xs font-semibold">
                    {dateError}
                  </div>
                )}

                {/* Quick Presets */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                    Quick Presets
                  </label>
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => applyPreset('TODAY')}
                      className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('THIS_MONTH')}
                      className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                    >
                      This Month
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('Q1')}
                      className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                    >
                      Q1 (Apr-Jun)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('Q2')}
                      className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                    >
                      Q2 (Jul-Sep)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('Q3')}
                      className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                    >
                      Q3 (Oct-Dec)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('Q4')}
                      className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                    >
                      Q4 (Jan-Mar)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('FULL_FY')}
                      className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                    >
                      Full Financial Year
                    </button>
                  </div>
                </div>

                {/* Apply Button */}
                <button
                  type="button"
                  onClick={handleApplyCustomDate}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Apply Date Range</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>Selected Range: <strong className="text-slate-800 dark:text-slate-200">{selectedPeriodLabel}</strong></span>
            {dateSelectionMode !== 'FY' && (
              <button
                type="button"
                onClick={() => {
                  setDateSelectionMode('FY');
                  setSelectedMonth('ALL');
                  setIsOpen(false);
                }}
                className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset to FY
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
