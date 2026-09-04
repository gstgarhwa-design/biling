// 50 Financial Years Generator & Utility for Indian Fiscal Accounting (1 April - 31 March)

export interface FinancialYearOption {
  value: string; // e.g., "2025-26"
  label: string; // e.g., "FY 2025-26 (Apr 2025 - Mar 2026)"
  startYear: number; // 2025
  endYear: number; // 2026
  startDate: string; // "2025-04-01"
  endDate: string; // "2026-03-31"
  isCurrent: boolean;
  category: 'CURRENT' | 'PAST' | 'FUTURE';
}

/**
 * Generates an array of exactly 50 Financial Years.
 * Centered around current FY 2025-26, spanning 35 past years and 14 future years (total 50).
 * e.g., from 1990-91 to 2039-40, or 2005-06 to 2054-55.
 */
export function generate50FinancialYears(centerYear: number = 2025): FinancialYearOption[] {
  const years: FinancialYearOption[] = [];
  const currentStartYear = 2025; // standard current active base year for Indian FY 2025-26

  // 50 financial years: 30 past years, current year, and 19 future years (e.g. 1995-96 to 2044-45)
  // or 2005-06 to 2054-55 (50 consecutive years)
  const startFromYear = 2005; // 2005-06
  const totalCount = 50;

  for (let i = 0; i < totalCount; i++) {
    const sYear = startFromYear + i;
    const eYear = sYear + 1;
    const sSuffix = String(sYear);
    const eSuffix = String(eYear).slice(-2);
    const value = `${sSuffix}-${eSuffix}`;
    const isCurrent = sYear === currentStartYear;

    let category: 'CURRENT' | 'PAST' | 'FUTURE' = 'PAST';
    if (sYear === currentStartYear) {
      category = 'CURRENT';
    } else if (sYear > currentStartYear) {
      category = 'FUTURE';
    }

    years.push({
      value,
      label: `FY ${value} (${isCurrent ? 'Current' : category === 'FUTURE' ? 'Upcoming' : 'Historical'})`,
      startYear: sYear,
      endYear: eYear,
      startDate: `${sYear}-04-01`,
      endDate: `${eYear}-03-31`,
      isCurrent,
      category
    });
  }

  // Sort descending by default (most recent & future first, followed by historical)
  return years.reverse();
}

export const FIFTY_FINANCIAL_YEARS = generate50FinancialYears();

/**
 * Checks if a transaction date string (YYYY-MM-DD) falls within a financial year string ("2025-26")
 */
export function isDateInFinancialYear(dateStr: string, fyValue: string): boolean {
  if (!dateStr || !fyValue) return true;
  const parts = fyValue.split('-');
  if (parts.length < 2) return true;
  
  const startYear = parseInt(parts[0], 10);
  if (isNaN(startYear)) return true;
  
  const fyStartDate = new Date(`${startYear}-04-01T00:00:00Z`);
  const fyEndDate = new Date(`${startYear + 1}-03-31T23:59:59Z`);
  const txDate = new Date(`${dateStr.split('T')[0]}T12:00:00Z`);

  return txDate >= fyStartDate && txDate <= fyEndDate;
}

export interface FiscalMonthOption {
  key: string; // 'ALL' | '04' | '05' | ... | '03'
  label: string; // 'All Months (Full FY)' | 'April' | ...
  short: string; // 'All' | 'Apr' | ...
  monthNum: number; // 0 for ALL, 4 for Apr, 5 for May, ..., 1 for Jan, 2 for Feb, 3 for Mar
}

export const FISCAL_MONTHS: FiscalMonthOption[] = [
  { key: 'ALL', label: 'All Months (Full FY)', short: 'Full FY', monthNum: 0 },
  { key: '04', label: 'April', short: 'Apr', monthNum: 4 },
  { key: '05', label: 'May', short: 'May', monthNum: 5 },
  { key: '06', label: 'June', short: 'Jun', monthNum: 6 },
  { key: '07', label: 'July', short: 'Jul', monthNum: 7 },
  { key: '08', label: 'August', short: 'Aug', monthNum: 8 },
  { key: '09', label: 'September', short: 'Sep', monthNum: 9 },
  { key: '10', label: 'October', short: 'Oct', monthNum: 10 },
  { key: '11', label: 'November', short: 'Nov', monthNum: 11 },
  { key: '12', label: 'December', short: 'Dec', monthNum: 12 },
  { key: '01', label: 'January', short: 'Jan', monthNum: 1 },
  { key: '02', label: 'February', short: 'Feb', monthNum: 2 },
  { key: '03', label: 'March', short: 'Mar', monthNum: 3 },
];

export type DateSelectionMode = 'FY' | 'MONTH' | 'CUSTOM';

/**
 * Formats ISO YYYY-MM-DD to Indian standard DD/MM/YYYY
 */
export function formatDateToIndianDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const clean = dateStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Returns a human-friendly display label for the currently active Date Selection
 */
export function getPeriodDisplayLabel(
  mode: DateSelectionMode,
  fyValue: string,
  monthKey: string,
  customStartDate: string,
  customEndDate: string
): string {
  if (mode === 'CUSTOM') {
    const from = formatDateToIndianDisplay(customStartDate);
    const to = formatDateToIndianDisplay(customEndDate);
    return `Custom Date (${from || 'Start'} to ${to || 'End'})`;
  }

  if (mode === 'MONTH') {
    const targetOption = FISCAL_MONTHS.find(m => 
      m.key === monthKey || 
      m.key === monthKey.padStart(2, '0') ||
      m.label.toLowerCase() === monthKey.toLowerCase() ||
      m.short.toLowerCase() === monthKey.toLowerCase()
    );
    const mLabel = targetOption ? targetOption.label : monthKey;
    if (mLabel.toLowerCase().includes('all')) {
      return `FY ${fyValue} (Full Year)`;
    }
    // Calculate calendar year for the month
    const parts = fyValue.split('-');
    const startYear = parseInt(parts[0], 10) || 2025;
    const mNum = targetOption ? targetOption.monthNum : 4;
    const calYear = mNum >= 4 ? startYear : startYear + 1;
    return `${mLabel} ${calYear}`;
  }

  return `FY ${fyValue}`;
}

/**
 * Checks if a date (YYYY-MM-DD) falls within the selected period:
 * - 'FY': Matches entire Financial Year (1 April - 31 March)
 * - 'MONTH': Matches specific Fiscal Month of the Financial Year
 * - 'CUSTOM': Matches Custom Date Range (customStartDate <= date <= customEndDate, inclusive)
 */
export function isDateInSelectedPeriod(
  dateStr: string,
  mode: DateSelectionMode = 'FY',
  fyValue: string = '2025-26',
  monthKey: string = 'ALL',
  customStartDate?: string,
  customEndDate?: string
): boolean {
  if (!dateStr) return false;
  const cleanDate = dateStr.split('T')[0];

  // 1. CUSTOM DATE RANGE (Inclusive of boundary dates)
  if (mode === 'CUSTOM') {
    if (!customStartDate && !customEndDate) return true;
    if (customStartDate && customEndDate) {
      return cleanDate >= customStartDate && cleanDate <= customEndDate;
    }
    if (customStartDate) return cleanDate >= customStartDate;
    if (customEndDate) return cleanDate <= customEndDate;
    return true;
  }

  // 2. MONTH MODE
  if (mode === 'MONTH') {
    // If month is 'ALL', fallback to FY
    if (!monthKey || monthKey === 'ALL') {
      return isDateInFinancialYear(cleanDate, fyValue);
    }

    const parts = fyValue.split('-');
    const startYear = parseInt(parts[0], 10) || 2025;

    const targetOption = FISCAL_MONTHS.find(m => 
      m.key === monthKey || 
      m.key === monthKey.padStart(2, '0') ||
      m.label.toLowerCase() === monthKey.toLowerCase() ||
      m.short.toLowerCase() === monthKey.toLowerCase()
    );

    if (!targetOption || targetOption.key === 'ALL') {
      return isDateInFinancialYear(cleanDate, fyValue);
    }

    const mNum = targetOption.monthNum;
    const calYear = mNum >= 4 ? startYear : startYear + 1;
    const mm = String(mNum).padStart(2, '0');
    const lastDay = new Date(calYear, mNum, 0).getDate();
    const monthStart = `${calYear}-${mm}-01`;
    const monthEnd = `${calYear}-${mm}-${String(lastDay).padStart(2, '0')}`;

    return cleanDate >= monthStart && cleanDate <= monthEnd;
  }

  // 3. FINANCIAL YEAR MODE
  return isDateInFinancialYear(cleanDate, fyValue);
}

/**
 * Legacy compatibility wrapper: Checks if a date falls within fiscal period
 */
export function isDateInFiscalPeriod(
  dateStr: string,
  fyValue: string,
  monthKey: string = 'ALL',
  mode: DateSelectionMode = 'FY',
  customStartDate?: string,
  customEndDate?: string
): boolean {
  return isDateInSelectedPeriod(dateStr, mode, fyValue, monthKey, customStartDate, customEndDate);
}
