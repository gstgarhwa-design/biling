import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  Search, 
  Clock, 
  User, 
  FileText, 
  Lock, 
  Download,
  Building2,
  CheckCircle2,
  AlertCircle,
  Filter,
  ArrowRightLeft,
  UserCheck,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { AuditLogAction } from '../types';

export const AuditTrailModule: React.FC = () => {
  const { auditLogs, companies, currentUser, activeCompany } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('ALL');
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const q = (searchQuery || '').trim().toLowerCase();

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      // Company Filter
      if (selectedCompanyFilter !== 'ALL') {
        if (log.companyId !== selectedCompanyFilter) return false;
      }

      // Action Filter
      if (selectedActionFilter !== 'ALL') {
        if (log.action !== selectedActionFilter) return false;
      }

      // Status Filter
      if (selectedStatusFilter !== 'ALL') {
        if ((log.status || 'SUCCESS') !== selectedStatusFilter) return false;
      }

      // Free text search
      if (!q) return true;
      const userName = (log.userName || '').toLowerCase();
      const userMobile = (log.userMobile || '').toLowerCase();
      const action = (log.action || '').toLowerCase();
      const details = (log.details || '').toLowerCase();
      const moduleName = (log.module || '').toLowerCase();
      const recordId = (log.recordId || '').toLowerCase();
      const companyName = (log.companyName || '').toLowerCase();
      const ip = (log.ip || '').toLowerCase();

      return (
        userName.includes(q) ||
        userMobile.includes(q) ||
        action.includes(q) ||
        details.includes(q) ||
        moduleName.includes(q) ||
        recordId.includes(q) ||
        companyName.includes(q) ||
        ip.includes(q)
      );
    });
  }, [auditLogs, selectedCompanyFilter, selectedActionFilter, selectedStatusFilter, q]);

  // Statistics
  const totalEvents = auditLogs.length;
  const companySwitches = auditLogs.filter(l => l.action === 'COMPANY_SWITCH' || l.action === 'COMPANY_ASSIGN').length;
  const criticalTransactions = auditLogs.filter(l => ['CREATE', 'DELETE', 'GENERATE_IRN', 'CANCEL_IRN', 'GENERATE_EWAY'].includes(l.action)).length;

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `AuditTrail_${new Date().toISOString().substring(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Company Name', 'Company ID', 'User Name', 'Role', 'Mobile', 'Action', 'Module', 'Record ID', 'Details', 'Old Value', 'New Value', 'Status', 'IP Address'];
    const rows = filteredLogs.map(l => [
      `"${l.formattedTimestamp || l.timestamp}"`,
      `"${l.companyName || ''}"`,
      `"${l.companyId || ''}"`,
      `"${l.userName}"`,
      `"${l.userRole}"`,
      `"${l.userMobile || ''}"`,
      `"${l.action}"`,
      `"${l.module}"`,
      `"${l.recordId || ''}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      `"${(l.oldValue || '').replace(/"/g, '""')}"`,
      `"${(l.newValue || '').replace(/"/g, '""')}"`,
      `"${l.status || 'SUCCESS'}"`,
      `"${l.ip}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Audit_Logs_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const getActionBadgeColor = (action: AuditLogAction) => {
    switch (action) {
      case 'CREATE':
      case 'ADD':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
      case 'UPDATE':
      case 'EDIT':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
      case 'DELETE':
      case 'CANCEL_IRN':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800';
      case 'COMPANY_ASSIGN':
      case 'COMPANY_SWITCH':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800';
      case 'GENERATE_IRN':
      case 'GENERATE_EWAY':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800';
      case 'LOGIN':
      case 'OTP_VERIFY':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
      case 'LOGOUT':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600';
    }
  };

  return (
    <div className="space-y-5 pb-20 lg:pb-8">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Audit Trail &amp; Immutable Activity Logs
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 flex items-center gap-1 border border-purple-200 dark:border-purple-800">
              <Lock className="w-3 h-3" />
              <span>MCA Rule 3(1) &amp; GST Compliant</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-proof, sequential audit logs recording user, active company, action, record ID, and change diffs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Export filtered logs to CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
            title="Export complete JSON audit log"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Recorded Logs</span>
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {totalEvents}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Chronologically ordered events</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Multi-Company Switches &amp; Assignments</span>
            <Building2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            {companySwitches}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Tracked cross-workspace actions</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Critical Invoices / Tax Events</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {criticalTransactions}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Sales, purchases, IRN &amp; E-Way bills</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search user, mobile, action, record ID, or change description..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Company Filter (Super Admin sees all companies; others see authorized companies) */}
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedCompanyFilter}
              onChange={e => setSelectedCompanyFilter(e.target.value)}
              className="py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="ALL">All Companies ({companies.length})</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.stateCode})</option>
              ))}
            </select>
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedActionFilter}
              onChange={e => setSelectedActionFilter(e.target.value)}
              className="py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="COMPANY_ASSIGN">COMPANY_ASSIGN</option>
              <option value="COMPANY_SWITCH">COMPANY_SWITCH</option>
              <option value="LOGIN">LOGIN</option>
              <option value="LOGOUT">LOGOUT</option>
              <option value="GENERATE_IRN">GENERATE_IRN</option>
              <option value="CANCEL_IRN">CANCEL_IRN</option>
              <option value="GENERATE_EWAY">GENERATE_EWAY</option>
              <option value="PERMISSION_CHANGE">PERMISSION_CHANGE</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedStatusFilter}
              onChange={e => setSelectedStatusFilter(e.target.value)}
              className="py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>
        </div>

        {/* Active filter count & reset */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span>Showing <strong>{filteredLogs.length}</strong> of {auditLogs.length} audit entries</span>
          {(selectedCompanyFilter !== 'ALL' || selectedActionFilter !== 'ALL' || selectedStatusFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCompanyFilter('ALL');
                setSelectedActionFilter('ALL');
                setSelectedStatusFilter('ALL');
                setSearchQuery('');
              }}
              className="text-indigo-600 hover:underline font-semibold flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Timeline Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-3.5 py-3">Timestamp (IST)</th>
                <th className="px-3.5 py-3">Company Workspace</th>
                <th className="px-3.5 py-3">User / Actor</th>
                <th className="px-3.5 py-3">Action</th>
                <th className="px-3.5 py-3">Module</th>
                <th className="px-3.5 py-3">Record ID</th>
                <th className="px-3.5 py-3">Change Description</th>
                <th className="px-3.5 py-3">Status</th>
                <th className="px-3.5 py-3 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    No audit records match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const compName = log.companyName || companies.find(c => c.id === log.companyId)?.name || 'Global System';
                  const isExpanded = expandedLogId === log.id;
                  const hasDiff = Boolean(log.oldValue || log.newValue);

                  return (
                    <React.Fragment key={log.id}>
                      <tr className={`hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors ${isExpanded ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''}`}>
                        {/* Timestamp */}
                        <td className="px-3.5 py-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{log.formattedTimestamp || new Date(log.timestamp).toLocaleString('en-IN')}</span>
                          </div>
                        </td>

                        {/* Company */}
                        <td className="px-3.5 py-3">
                          <div className="flex items-center gap-1.5 max-w-[150px]">
                            <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={compName}>
                              {compName}
                            </span>
                          </div>
                        </td>

                        {/* User / Actor */}
                        <td className="px-3.5 py-3 whitespace-nowrap">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {log.userName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                              {log.userRole?.replace('_', ' ')}
                            </span>
                            {log.userMobile && (
                              <span>• +91 {log.userMobile}</span>
                            )}
                          </div>
                        </td>

                        {/* Action */}
                        <td className="px-3.5 py-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${getActionBadgeColor(log.action)}`}>
                            {log.action}
                          </span>
                        </td>

                        {/* Module */}
                        <td className="px-3.5 py-3 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {log.module}
                        </td>

                        {/* Record ID */}
                        <td className="px-3.5 py-3 font-mono text-slate-600 dark:text-slate-400 text-[11px] whitespace-nowrap">
                          {log.recordId ? (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium">
                              {log.recordId}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </td>

                        {/* Change Description */}
                        <td className="px-3.5 py-3 text-slate-700 dark:text-slate-200 max-w-xs">
                          <div className="truncate" title={log.details}>
                            {log.details}
                          </div>
                          {hasDiff && (
                            <button
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold mt-0.5 flex items-center gap-1"
                            >
                              <span>{isExpanded ? 'Hide Before/After' : 'View Before/After Changes'}</span>
                            </button>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-3.5 py-3 whitespace-nowrap">
                          {(log.status || 'SUCCESS') === 'SUCCESS' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>SUCCESS</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200/60 dark:border-rose-800/60">
                              <AlertCircle className="w-3 h-3" />
                              <span>FAILED</span>
                            </span>
                          )}
                        </td>

                        {/* IP Address */}
                        <td className="px-3.5 py-3 text-right font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {log.ip || '127.0.0.1'}
                        </td>
                      </tr>

                      {/* Expandable Before / After Diff */}
                      {isExpanded && hasDiff && (
                        <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-200/60 dark:border-slate-700/60">
                          <td colSpan={9} className="px-4 py-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                              <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Previous Value (Old)</span>
                                <div className="p-2 rounded bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 font-mono text-[11px] border border-rose-200 dark:border-rose-900/50">
                                  {log.oldValue || 'None (Initial Creation)'}
                                </div>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">New Value (Updated)</span>
                                <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-mono text-[11px] border border-emerald-200 dark:border-emerald-900/50">
                                  {log.newValue || log.details}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

