import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../data/indianStates';
import * as XLSX from 'xlsx';
import { 
  BarChart3, 
  Layers, 
  Tag, 
  Hash, 
  Calendar, 
  Download, 
  Printer, 
  Search, 
  TrendingUp, 
  ArrowUpRight, 
  FileSpreadsheet,
  Boxes,
  PieChart,
  Briefcase
} from 'lucide-react';
import { FinancialYearSelect } from './FinancialYearSelect';

export const AdvancedReportsModule: React.FC = () => {
  const { 
    activeCompany, 
    items, 
    salesInvoices, 
    purchaseInvoices, 
    creditNotes, 
    debitNotes,
    selectedFinancialYear,
    setSelectedFinancialYear
  } = useApp();

  const [activeTab, setActiveTab] = useState<'ITEM_WISE' | 'CATEGORY_WISE' | 'HSN_WISE' | 'PROFESSIONAL_SUMMARY'>('ITEM_WISE');
  const [startDate, setStartDate] = useState('2024-04-01');
  const [endDate, setEndDate] = useState('2025-03-31');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set);
  }, [items]);

  // Filter posted sales invoices within date range
  const filteredSales = useMemo(() => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate + 'T23:59:59').getTime();
    return salesInvoices.filter(inv => {
      if (inv.status !== 'POSTED') return false;
      const t = new Date(inv.date).getTime();
      return t >= start && t <= end;
    });
  }, [salesInvoices, startDate, endDate]);

  // 1. Item Wise Aggregation
  const itemWiseData = useMemo(() => {
    const map: Record<string, {
      itemId: string;
      name: string;
      category: string;
      hsnSac: string;
      unit: string;
      qtySold: number;
      taxableRevenue: number;
      cgst: number;
      sgst: number;
      igst: number;
      totalRevenue: number;
      currentStock: number;
    }> = {};

    // Initialize with all items
    items.forEach(item => {
      map[item.id] = {
        itemId: item.id,
        name: item.name,
        category: item.category || 'General',
        hsnSac: item.hsnSac,
        unit: item.unit,
        qtySold: 0,
        taxableRevenue: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        totalRevenue: 0,
        currentStock: item.currentStock,
      };
    });

    // Aggregate from filtered sales
    filteredSales.forEach(inv => {
      inv.items.forEach(it => {
        if (!map[it.itemId]) {
          map[it.itemId] = {
            itemId: it.itemId,
            name: it.name,
            category: 'General',
            hsnSac: it.hsnSac,
            unit: it.unit,
            qtySold: 0,
            taxableRevenue: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            totalRevenue: 0,
            currentStock: 0,
          };
        }
        map[it.itemId].qtySold += it.qty;
        map[it.itemId].taxableRevenue += it.taxableValue;
        map[it.itemId].cgst += it.cgst;
        map[it.itemId].sgst += it.sgst;
        map[it.itemId].igst += it.igst;
        map[it.itemId].totalRevenue += it.total;
      });
    });

    let list = Object.values(map);

    if (categoryFilter !== 'ALL') {
      list = list.filter(i => i.category === categoryFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(i => i.name.toLowerCase().includes(q) || i.hsnSac.includes(q));
    }

    return list.sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [items, filteredSales, categoryFilter, searchQuery]);

  // 2. Category Wise Aggregation
  const categoryWiseData = useMemo(() => {
    const map: Record<string, {
      category: string;
      itemCount: number;
      qtySold: number;
      taxableValue: number;
      taxAmount: number;
      totalRevenue: number;
    }> = {};

    itemWiseData.forEach(item => {
      const cat = item.category || 'General';
      if (!map[cat]) {
        map[cat] = {
          category: cat,
          itemCount: 0,
          qtySold: 0,
          taxableValue: 0,
          taxAmount: 0,
          totalRevenue: 0,
        };
      }
      map[cat].itemCount += 1;
      map[cat].qtySold += item.qtySold;
      map[cat].taxableValue += item.taxableRevenue;
      map[cat].taxAmount += (item.cgst + item.sgst + item.igst);
      map[cat].totalRevenue += item.totalRevenue;
    });

    const list = Object.values(map);
    const totalRev = list.reduce((s, c) => s + c.totalRevenue, 0) || 1;

    return list.map(c => ({
      ...c,
      sharePercent: ((c.totalRevenue / totalRev) * 100).toFixed(1),
    })).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [itemWiseData]);

  // 3. HSN Wise Aggregation (Govt Table 12 format)
  const hsnWiseData = useMemo(() => {
    const map: Record<string, {
      hsn: string;
      desc: string;
      uqc: string;
      totalQty: number;
      taxableValue: number;
      cgst: number;
      sgst: number;
      igst: number;
      cess: number;
      totalTax: number;
      totalValue: number;
    }> = {};

    filteredSales.forEach(inv => {
      inv.items.forEach(it => {
        const code = it.hsnSac || '9999';
        if (!map[code]) {
          map[code] = {
            hsn: code,
            desc: it.name,
            uqc: it.unit || 'PCS',
            totalQty: 0,
            taxableValue: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            cess: 0,
            totalTax: 0,
            totalValue: 0,
          };
        }
        map[code].totalQty += it.qty;
        map[code].taxableValue += it.taxableValue;
        map[code].cgst += it.cgst;
        map[code].sgst += it.sgst;
        map[code].igst += it.igst;
        map[code].totalTax += (it.cgst + it.sgst + it.igst);
        map[code].totalValue += it.total;
      });
    });

    return Object.values(map).sort((a, b) => b.taxableValue - a.taxableValue);
  }, [filteredSales]);

  // 4. Professional Executive Financial Summary
  const executiveMetrics = useMemo(() => {
    const totalGrossSales = filteredSales.reduce((s, i) => s + i.grandTotal, 0);
    const totalTaxableSales = filteredSales.reduce((s, i) => s + i.taxableAmount, 0);
    const totalOutputGst = filteredSales.reduce((s, i) => s + (i.cgst + i.sgst + i.igst), 0);

    const periodPurchases = purchaseInvoices.filter(pur => {
      if (pur.status !== 'POSTED') return false;
      const t = new Date(pur.date).getTime();
      return t >= new Date(startDate).getTime() && t <= new Date(endDate + 'T23:59:59').getTime();
    });

    const totalPurchases = periodPurchases.reduce((s, p) => s + p.grandTotal, 0);
    const totalItcClaimed = periodPurchases.reduce((s, p) => s + (p.cgst + p.sgst + p.igst), 0);

    const netTaxPayable = Math.max(0, totalOutputGst - totalItcClaimed);
    const avgInvoiceValue = filteredSales.length > 0 ? Math.round(totalGrossSales / filteredSales.length) : 0;

    return {
      totalGrossSales,
      totalTaxableSales,
      totalOutputGst,
      totalPurchases,
      totalItcClaimed,
      netTaxPayable,
      avgInvoiceValue,
      invoiceCount: filteredSales.length,
      purchaseCount: periodPurchases.length,
    };
  }, [filteredSales, purchaseInvoices, startDate, endDate]);

  // Export to Excel for each tab
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    if (activeTab === 'ITEM_WISE') {
      const rows = [
        ['ITEM-WISE SALES & REVENUE REPORT'],
        ['Company:', activeCompany?.name || '', 'Period:', `${startDate} to ${endDate}`],
        [''],
        ['Item Name', 'Category', 'HSN/SAC', 'Unit', 'Qty Sold', 'Taxable Rev (₹)', 'CGST (₹)', 'SGST (₹)', 'IGST (₹)', 'Total Revenue (₹)', 'Current Stock']
      ];
      itemWiseData.forEach(it => {
        rows.push([
          it.name,
          it.category,
          it.hsnSac,
          it.unit,
          it.qtySold,
          it.taxableRevenue,
          it.cgst,
          it.sgst,
          it.igst,
          it.totalRevenue,
          it.currentStock
        ]);
      });
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Item_Wise_Report');
      XLSX.writeFile(wb, `Item_Wise_Report_${startDate}_${endDate}.xlsx`);
    } else if (activeTab === 'CATEGORY_WISE') {
      const rows = [
        ['CATEGORY-WISE SALES & CONTRIBUTION REPORT'],
        ['Company:', activeCompany?.name || '', 'Period:', `${startDate} to ${endDate}`],
        [''],
        ['Category', 'Item Count', 'Qty Sold', 'Taxable Value (₹)', 'Tax Amount (₹)', 'Total Revenue (₹)', 'Share (%)']
      ];
      categoryWiseData.forEach(c => {
        rows.push([
          c.category,
          c.itemCount,
          c.qtySold,
          c.taxableValue,
          c.taxAmount,
          c.totalRevenue,
          c.sharePercent + '%'
        ]);
      });
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Category_Report');
      XLSX.writeFile(wb, `Category_Wise_Report_${startDate}_${endDate}.xlsx`);
    } else if (activeTab === 'HSN_WISE') {
      const rows = [
        ['TABLE 12: HSN/SAC-WISE GST RETURN SUMMARY'],
        ['Company:', activeCompany?.name || '', 'GSTIN:', activeCompany?.gstin || '', 'Period:', `${startDate} to ${endDate}`],
        [''],
        ['HSN/SAC Code', 'Description', 'UQC', 'Total Quantity', 'Total Taxable Value (₹)', 'Central Tax CGST (₹)', 'State Tax SGST (₹)', 'Integrated Tax IGST (₹)', 'Total Tax (₹)', 'Total Invoice Value (₹)']
      ];
      hsnWiseData.forEach(h => {
        rows.push([
          h.hsn,
          h.desc,
          h.uqc,
          h.totalQty,
          h.taxableValue,
          h.cgst,
          h.sgst,
          h.igst,
          h.totalTax,
          h.totalValue
        ]);
      });
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'HSN_Summary_Table12');
      XLSX.writeFile(wb, `HSN_Summary_Table12_${startDate}_${endDate}.xlsx`);
    } else {
      const rows = [
        ['PROFESSIONAL FINANCIAL EXECUTIVE REPORT'],
        ['Company:', activeCompany?.name || '', 'GSTIN:', activeCompany?.gstin || '', 'Period:', `${startDate} to ${endDate}`],
        [''],
        ['Financial KPI Metric', 'Value (₹ / Count)'],
        ['Total Gross Outward Sales', executiveMetrics.totalGrossSales],
        ['Taxable Turnover', executiveMetrics.totalTaxableSales],
        ['Total Output GST Liability', executiveMetrics.totalOutputGst],
        ['Total Inward Purchases', executiveMetrics.totalPurchases],
        ['Input Tax Credit (ITC) Claimed', executiveMetrics.totalItcClaimed],
        ['Net GST Cash Payable', executiveMetrics.netTaxPayable],
        ['Average Order Value', executiveMetrics.avgInvoiceValue],
        ['Sales Invoices Count', executiveMetrics.invoiceCount],
        ['Purchase Invoices Count', executiveMetrics.purchaseCount]
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Executive_Summary');
      XLSX.writeFile(wb, `Executive_Financial_Report_${startDate}_${endDate}.xlsx`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 pb-20 lg:pb-8">
      {/* Top Banner (Hidden on Print) */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-2xl p-5 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-300">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            <span>Professional Multi-Dimensional Analytics</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mt-1">Advanced GST &amp; Business Intelligence</h1>
          <p className="text-xs text-purple-100/80 mt-0.5">
            Item-wise, Category-wise, and HSN Table 12 breakdowns with executive financial summaries
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Current Tab (.xlsx)</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Date & Filter Toolbar (Hidden on Print) */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-wrap items-center justify-between gap-4 print:hidden text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
            <Calendar className="w-4 h-4 text-purple-600" />
            <span>Report Period:</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">From</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono text-xs"
            />
            <span className="text-slate-400">To</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono text-xs"
            />
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          <FinancialYearSelect
            value={selectedFinancialYear}
            onChange={setSelectedFinancialYear}
            compact
            label="FY Context"
          />
        </div>

        {/* Tab 1 category selector */}
        {activeTab === 'ITEM_WISE' && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Category:</span>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-semibold"
            >
              <option value="ALL">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2 sm:gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('ITEM_WISE')}
          className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'ITEM_WISE'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Item-Wise Analysis ({itemWiseData.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('CATEGORY_WISE')}
          className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'CATEGORY_WISE'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>Category Breakdown ({categoryWiseData.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('HSN_WISE')}
          className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'HSN_WISE'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <Hash className="w-4 h-4" />
          <span>HSN/SAC Table 12 ({hsnWiseData.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('PROFESSIONAL_SUMMARY')}
          className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'PROFESSIONAL_SUMMARY'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Executive Financial Brief</span>
        </button>
      </div>

      {/* Tab 1: Item-Wise */}
      {activeTab === 'ITEM_WISE' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs space-y-3 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search item name or HSN..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
              />
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Total Revenue: <span className="font-bold text-purple-600 dark:text-purple-400">{formatINR(itemWiseData.reduce((s, i) => s + i.totalRevenue, 0))}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 font-semibold">
                <tr>
                  <th className="px-3 py-2.5">Item Name</th>
                  <th className="px-3 py-2.5">Category</th>
                  <th className="px-3 py-2.5 text-center">HSN/SAC</th>
                  <th className="px-3 py-2.5 text-center">Qty Sold</th>
                  <th className="px-3 py-2.5 text-right">Taxable (₹)</th>
                  <th className="px-3 py-2.5 text-right">CGST (₹)</th>
                  <th className="px-3 py-2.5 text-right">SGST (₹)</th>
                  <th className="px-3 py-2.5 text-right">IGST (₹)</th>
                  <th className="px-3 py-2.5 text-right">Total Rev (₹)</th>
                  <th className="px-3 py-2.5 text-center">Stock Left</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {itemWiseData.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30">
                    <td className="px-3 py-2.5 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate">
                      {it.name}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        {it.category}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono text-slate-600 dark:text-slate-400">{it.hsnSac}</td>
                    <td className="px-3 py-2.5 text-center font-bold font-mono">{it.qtySold} {it.unit}</td>
                    <td className="px-3 py-2.5 text-right font-mono">{formatINR(it.taxableRevenue)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-500">{formatINR(it.cgst)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-500">{formatINR(it.sgst)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-indigo-600 dark:text-indigo-400">{formatINR(it.igst)}</td>
                    <td className="px-3 py-2.5 text-right font-bold font-mono text-slate-900 dark:text-white">{formatINR(it.totalRevenue)}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        it.currentStock <= 5 ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {it.currentStock}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Category Breakdown */}
      {activeTab === 'CATEGORY_WISE' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryWiseData.map((cat, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{cat.category}</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                    {cat.sharePercent}% Share
                  </span>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-purple-600 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(5, parseFloat(cat.sharePercent)))}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <div className="text-[10px] text-slate-400">Total Revenue</div>
                    <div className="font-bold font-mono text-slate-900 dark:text-white">{formatINR(cat.totalRevenue)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Taxable Value</div>
                    <div className="font-mono text-slate-700 dark:text-slate-300">{formatINR(cat.taxableValue)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">GST Collected</div>
                    <div className="font-mono text-indigo-600 dark:text-indigo-400">{formatINR(cat.taxAmount)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Units Sold</div>
                    <div className="font-mono font-semibold text-slate-800 dark:text-slate-200">{cat.qtySold}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: HSN/SAC Table 12 */}
      {activeTab === 'HSN_WISE' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                GSTR-1 Table 12: HSN-Wise Summary of Outward Supplies
              </h2>
              <p className="text-xs text-slate-500">
                Official statutory format required for filing outward supplies breakdown on GST Portal
              </p>
            </div>
            <div className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
              {hsnWiseData.length} Unique HSN Codes
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="px-3 py-2.5">HSN / SAC</th>
                  <th className="px-3 py-2.5">Description</th>
                  <th className="px-3 py-2.5 text-center">UQC</th>
                  <th className="px-3 py-2.5 text-center">Total Qty</th>
                  <th className="px-3 py-2.5 text-right">Taxable Val (₹)</th>
                  <th className="px-3 py-2.5 text-right">CGST (₹)</th>
                  <th className="px-3 py-2.5 text-right">SGST (₹)</th>
                  <th className="px-3 py-2.5 text-right">IGST (₹)</th>
                  <th className="px-3 py-2.5 text-right">Total Tax (₹)</th>
                  <th className="px-3 py-2.5 text-right">Total Value (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-mono">
                {hsnWiseData.map((h, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30">
                    <td className="px-3 py-2.5 font-bold text-purple-700 dark:text-purple-400">{h.hsn}</td>
                    <td className="px-3 py-2.5 font-sans font-medium text-slate-800 dark:text-slate-200">{h.desc}</td>
                    <td className="px-3 py-2.5 text-center text-slate-500">{h.uqc}</td>
                    <td className="px-3 py-2.5 text-center font-bold">{h.totalQty}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-slate-900 dark:text-white">{formatINR(h.taxableValue)}</td>
                    <td className="px-3 py-2.5 text-right text-slate-600">{formatINR(h.cgst)}</td>
                    <td className="px-3 py-2.5 text-right text-slate-600">{formatINR(h.sgst)}</td>
                    <td className="px-3 py-2.5 text-right text-indigo-600 dark:text-indigo-400">{formatINR(h.igst)}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-slate-800 dark:text-slate-200">{formatINR(h.totalTax)}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-slate-900 dark:text-white">{formatINR(h.totalValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Executive Financial Brief */}
      {activeTab === 'PROFESSIONAL_SUMMARY' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs space-y-6">
          <div className="flex justify-between items-start pb-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-purple-600">
                EXECUTIVE BRIEFING &amp; COMPLIANCE AUDIT
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                Financial Health &amp; GST Liability Dashboard
              </h2>
              <div className="text-xs text-slate-500 mt-1">
                Period: {startDate} to {endDate} • Entity: {activeCompany?.name} ({activeCompany?.gstin})
              </div>
            </div>

            {activeCompany?.logoUrl && (
              <img src={activeCompany.logoUrl} alt="Logo" className="h-10 w-auto max-w-[140px] object-contain" />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 block">Gross Outward Sales</span>
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 block">
                {formatINR(executiveMetrics.totalGrossSales)}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">{executiveMetrics.invoiceCount} Tax Invoices Posted</span>
            </div>

            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
              <span className="text-purple-700 dark:text-purple-400 block">Total Inward Purchases</span>
              <span className="text-xl font-bold font-mono text-purple-900 dark:text-purple-200 mt-1 block">
                {formatINR(executiveMetrics.totalPurchases)}
              </span>
              <span className="text-[10px] text-purple-600 mt-0.5 block">{executiveMetrics.purchaseCount} Vendor Bills Logged</span>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <span className="text-emerald-700 dark:text-emerald-400 block">Eligible ITC Verified</span>
              <span className="text-xl font-bold font-mono text-emerald-900 dark:text-emerald-200 mt-1 block">
                {formatINR(executiveMetrics.totalItcClaimed)}
              </span>
              <span className="text-[10px] text-emerald-600 mt-0.5 block">100% 2B Cross-Reconciled</span>
            </div>
          </div>

          {/* Tax Position Table */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-xs">
            <div className="bg-slate-100 dark:bg-slate-900/60 p-3 font-bold text-slate-800 dark:text-slate-200">
              GST Cash Settlement Position (Form GSTR-3B Table 6.1)
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Total Output Tax Liability (GSTR-1 Outward Supplies):</span>
                <span className="font-mono font-bold">{formatINR(executiveMetrics.totalOutputGst)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Less: Input Tax Credit (ITC) Setoff:</span>
                <span className="font-mono font-bold text-emerald-600">(-) {formatINR(executiveMetrics.totalItcClaimed)}</span>
              </div>
              <div className="flex justify-between py-2 border-t-2 border-slate-900 dark:border-slate-100 text-sm font-bold">
                <span>Net Cash Tax Payable through Challan (PMT-06):</span>
                <span className="font-mono text-purple-700 dark:text-purple-400">{formatINR(executiveMetrics.netTaxPayable)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
