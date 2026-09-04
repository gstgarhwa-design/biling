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
  ArrowRight,
  ArrowUpDown,
  Filter
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
  const [quickSelectedFy, setQuickSelectedFy] = useState(selectedFinancialYear);
  const [dateError, setDateError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const fyListRef = useRef<HTMLDivElement>(null);

  // Sync activeTab and local custom dates when modal opens or global mode changes
  useEffect(() => {
    setActiveTab(dateSelectionMode);
    if (customStartDate) setLocalStartDate(customStartDate);
    if (customEndDate) setLocalEndDate(customEndDate);
    setQuickSelectedFy(selectedFinancialYear);
  }, [dateSelectionMode, customStartDate, customEndDate, selectedFinancialYear, isOpen]);

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

  // Smooth scroll to selected year when FY tab is opened
  useEffect(() => {
    if (isOpen && activeTab === 'FY' && fyListRef.current) {
      const timer = setTimeout(() => {
        const selectedEl = fyListRef.current?.querySelector('[data-selected="true"]');
        if (selectedEl) {
          selectedEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeTab, fySortOrder]);

  // Filtered and Sorted Financial Years for FY tab (Ascending by default: 2005-06 -> 2054-55)
  const filteredFys = [...FIFTY_FINANCIAL_YEARS]
    .filter(item => 
      item.label.toLowerCase().includes(fySearch.toLowerCase()) ||
      item.value.includes(fySearch) ||
      item.startYear.toString().includes(fySearch) ||
      item.endYear.toString().includes(fySearch)
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

  // Helper to calculate start and end dates from an FY and Month
  const setDatesFromFyAndMonth = (fyVal: string, monthKey: string) => {
    setQuickSelectedFy(fyVal);
    const parts = fyVal.split('-');
    const startYear = parseInt(parts[0], 10) || 2026;
    const nextYear = startYear + 1;

    if (monthKey === 'ALL') {
      setLocalStartDate(`${startYear}-04-01`);
      setLocalEndDate(`${nextYear}-03-31`);
      setDateError(null);
      return;
    }

    const mObj = FISCAL_MONTHS.find(m => m.key === monthKey);
    if (!mObj || mObj.monthNum === 0) return;

    const calYear = mObj.monthNum >= 4 ? startYear : nextYear;
    const mStr = String(mObj.monthNum).padStart(2, '0');
    const lastDay = new Date(calYear, mObj.monthNum, 0).getDate();

    setLocalStartDate(`${calYear}-${mStr}-01`);
    setLocalEndDate(`${calYear}-${mStr}-${String(lastDay).padStart(2, '0')}`);
    setDateError(null);
  };

  // Preset custom date helpers
  const applyPreset = (preset: 'TODAY' | 'YESTERDAY' | 'THIS_MONTH' | 'LAST_MONTH' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'FULL_FY') => {
    const parts = quickSelectedFy.split('-');
    const startYear = parseInt(parts[0], 10) || 2026;
    const nextYear = startYear + 1;

    let start = '';
    let end = '';

    const today = new Date();
    const todayStr = today.toISOString().substring(0, 10);

    switch (preset) {
      case 'TODAY':
        start = todayStr;
        end = todayStr;
        break;
      case 'YESTERDAY': {
        const yest = new Date();
        yest.setDate(yest.getDate() - 1);
        const yestStr = yest.toISOString().substring(0, 10);
        start = yestStr;
        end = yestStr;
        break;
      }
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
      {/* Trigger Button: ONLY "Custom Date Calendar" option in Header */}
      <button
        type="button"
        id="custom-date-calendar-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-xl font-semibold transition-all border shadow-2xs cursor-pointer ${
          compact
            ? 'px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-indigo-200 dark:border-indigo-800/80 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-slate-700/60'
            : 'px-3.5 py-2 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-indigo-200/80 dark:border-slate-700 hover:border-indigo-500 hover:shadow-xs'
        }`}
        title="Custom Date Calendar - Select Date Range, Financial Year (2005-2055) & Month"
      >
        <div className="w-5 h-5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
          <Calendar className="w-3.5 h-3.5" />
        </div>

        <div className="flex flex-col text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 leading-none">
            Custom Date Calendar
          </span>
          <span className="font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[200px] sm:max-w-[260px]">
            {selectedPeriodLabel}
          </span>
        </div>

        <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 shrink-0 hidden md:inline-block">
          {dateSelectionMode === 'CUSTOM' ? 'Custom Date' : dateSelectionMode === 'MONTH' ? 'Month' : `FY ${selectedFinancialYear}`}
        </span>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Custom Date Calendar Dropdown Dialog */}
      {isOpen && (
        <div className="absolute right-0 sm:right-auto sm:left-0 mt-2 w-[340px] sm:w-[480px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-2xs">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  Custom Date Calendar
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Select Custom Date, Financial Year (2005-2055), or Month
                </p>
              </div>
            </div>

            <div className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 font-semibold">
              Active: {selectedFinancialYear}
            </div>
          </div>

          {/* Mode Switcher Tabs inside Custom Date Calendar */}
          <div className="grid grid-cols-3 p-1.5 bg-slate-100/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-center">
            <button
              type="button"
              onClick={() => setActiveTab('CUSTOM')}
              className={`py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'CUSTOM'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Custom Date</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('FY')}
              className={`py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
              className={`py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'MONTH'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Month</span>
            </button>
          </div>

          {/* TAB CONTENT */}
          <div className="p-4">
            {/* 1. CUSTOM DATE TAB (With Integrated FY & Month quick options) */}
            {activeTab === 'CUSTOM' && (
              <div className="space-y-3.5">
                {/* Quick Select by FY and Month shortcut bar */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      Quick Pick from FY & Month:
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Auto-fills start & end dates
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* FY Dropdown with 50 FYs */}
                    <div className="relative flex-1">
                      <select
                        value={quickSelectedFy}
                        onChange={(e) => {
                          const val = e.target.value;
                          setQuickSelectedFy(val);
                          setSelectedFinancialYear(val);
                          setDatesFromFyAndMonth(val, 'ALL');
                        }}
                        className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        {FIFTY_FINANCIAL_YEARS.map(fy => (
                          <option key={fy.value} value={fy.value}>
                            FY {fy.value} {fy.isCurrent ? '(Current)' : ''} ({fy.startYear}-{fy.endYear})
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDatesFromFyAndMonth(quickSelectedFy, 'ALL')}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 shrink-0 transition-colors"
                    >
                      Full FY
                    </button>
                  </div>

                  {/* 12 Fiscal Month pills */}
                  <div className="grid grid-cols-6 gap-1 pt-1">
                    {FISCAL_MONTHS.filter(m => m.key !== 'ALL').map(m => (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setDatesFromFyAndMonth(quickSelectedFy, m.key)}
                        className="px-1 py-1 rounded-md text-[10px] font-semibold text-center bg-white dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                        title={`Fill dates for ${m.label}`}
                      >
                        {m.label.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Direct Date Range Inputs */}
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
                      onClick={() => applyPreset('YESTERDAY')}
                      className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                    >
                      Yesterday
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
                      onClick={() => applyPreset('LAST_MONTH')}
                      className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                    >
                      Last Month
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
                      Full FY
                    </button>
                  </div>
                </div>

                {/* Apply Button */}
                <button
                  type="button"
                  onClick={handleApplyCustomDate}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Apply Custom Date Range</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 2. FINANCIAL YEAR TAB (50 Fiscal Years with Smooth Scrolling) */}
            {activeTab === 'FY' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search 50 Financial Years (e.g. 2025, 2030)..."
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
                    <ArrowUpDown className="w-3 h-3" />
                    <span>{fySortOrder === 'asc' ? 'Asc (2005→2055)' : 'Desc (2055→2005)'}</span>
                  </button>
                </div>

                {/* Sub-bar with Jump to Current FY */}
                <div className="flex items-center justify-between text-[11px] px-1 text-slate-500 dark:text-slate-400">
                  <span className="font-semibold flex items-center gap-1">
                    <span>Scroll 50 Fiscal Years</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      ({filteredFys.length} Available)
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

                {/* Smooth Scrollable Container */}
                <div 
                  ref={fyListRef}
                  className="max-h-60 sm:max-h-68 overflow-y-auto space-y-1 pr-1 overscroll-contain"
                  style={{ scrollBehavior: 'smooth' }}
                >
                  {filteredFys.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No matching financial year found
                    </div>
                  ) : (
                    filteredFys.map((fy) => {
                      const isSelected = selectedFinancialYear === fy.value && dateSelectionMode === 'FY';
                      return (
                        <button
                          key={fy.value}
                          type="button"
                          data-selected={fy.value === selectedFinancialYear ? 'true' : 'false'}
                          onClick={() => {
                            setSelectedFinancialYear(fy.value);
                            setDateSelectionMode('FY');
                            setIsOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                              : 'hover:bg-indigo-50/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs sm:text-sm">FY {fy.value}</span>
                            {fy.isCurrent && (
                              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                              }`}>
                                CURRENT
                              </span>
                            )}
                            {fy.category === 'FUTURE' && (
                              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                              }`}>
                                Upcoming
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
                    })
                  )}
                </div>
              </div>
            )}

            {/* 3. MONTH TAB */}
            {activeTab === 'MONTH' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Financial Year Context:</span>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={selectedFinancialYear}
                      onChange={(e) => setSelectedFinancialYear(e.target.value)}
                      className="px-2 py-0.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 rounded border border-indigo-200/60"
                    >
                      {FIFTY_FINANCIAL_YEARS.map(fy => (
                        <option key={fy.value} value={fy.value}>
                          FY {fy.value}
                        </option>
                      ))}
                    </select>
                  </div>
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
                        className={`p-2.5 rounded-xl text-xs font-semibold text-center border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="font-bold">{m.label}</div>
                        {m.key !== 'ALL' && (
                          <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                            {m.monthNum >= 4 
                              ? selectedFinancialYear.split('-')[0] 
                              : String(parseInt(selectedFinancialYear.split('-')[0], 10) + 1)}
                          </div>
                        )}
                        {m.key === 'ALL' && (
                          <div className={`text-[9px] uppercase tracking-wider font-bold mt-0.5 ${isSelected ? 'text-indigo-200' : 'text-indigo-600 dark:text-indigo-400'}`}>
                            Full Year
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>Filter Active: <strong className="text-slate-800 dark:text-slate-200">{selectedPeriodLabel}</strong></span>
            {dateSelectionMode !== 'FY' && (
              <button
                type="button"
                onClick={() => {
                  setDateSelectionMode('FY');
                  setSelectedMonth('ALL');
                  setIsOpen(false);
                }}
                className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset to Full FY
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
