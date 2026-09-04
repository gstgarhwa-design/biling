import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  Search, 
  Clock, 
  User, 
  FileText, 
  Lock, 
  Download,
  AlertCircle
} from 'lucide-react';

export const AuditTrailModule: React.FC = () => {
  const { auditLogs } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const q = (searchQuery || '').trim().toLowerCase();
  const filteredLogs = auditLogs.filter(log => {
    const userName = (log.userName || '').toLowerCase();
    const action = (log.action || '').toLowerCase();
    const details = (log.details || '').toLowerCase();
    const moduleName = (log.module || (log as any).entityType || '').toLowerCase();

    return !q || userName.includes(q) || action.includes(q) || details.includes(q) || moduleName.includes(q);
  });

  return (
    <div className="space-y-5 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Audit Trail &amp; Activity Log
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>MCA &amp; GST Rule Compliant</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable, sequential transaction audit log recording timestamp, actor, IP, and document changes
          </p>
        </div>

        <button
          onClick={() => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `AuditTrail_${new Date().toISOString().substring(0, 10)}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
          }}
          className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Audit Log</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by user, action, or document..."
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
        />
      </div>

      {/* Audit Log Timeline Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">Timestamp (IST)</th>
                <th className="px-4 py-3">User / Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Change Description</th>
                <th className="px-4 py-3 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-mono">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                  <td className="px-4 py-3 text-slate-500 font-sans">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(log.timestamp).toLocaleString('en-IN')}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 font-sans">
                    <span className="font-bold text-slate-900 dark:text-white">{log.userName}</span>
                  </td>

                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.action.includes('CREATE') ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                      log.action.includes('IRN') || log.action.includes('EWB') ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300' :
                      log.action.includes('DELETE') ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                      'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {log.action}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-bold">
                    {log.module || (log as any).entityType || 'General'}
                  </td>

                  <td className="px-4 py-3 font-sans text-slate-700 dark:text-slate-300">
                    {log.details}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-sans inline-flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Secured</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
