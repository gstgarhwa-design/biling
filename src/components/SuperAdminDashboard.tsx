import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Company, User, UserRole } from '../types';
import { formatINR } from '../data/indianStates';
import { 
  Building2, 
  Users, 
  ShieldCheck, 
  Plus, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Eye, 
  Settings2, 
  FileText, 
  History,
  Key,
  CreditCard,
  Building,
  Database
} from 'lucide-react';
import { FIFTY_FINANCIAL_YEARS } from '../utils/financialYears';

export const SuperAdminDashboard: React.FC = () => {
  const { 
    companies, 
    users, 
    createCompany, 
    updateCompany, 
    createUser, 
    toggleUserActive, 
    switchCompany, 
    activeCompany,
    auditLogs,
    gstConfig,
    updateGSTConfig,
    assignCompanyToUser,
    removeCompanyFromUser,
    getAuthorizedCompaniesForUser,
    adminCompanyPermissions
  } = useApp();

  const [activeTab, setActiveTab] = useState<'COMPANIES' | 'USERS' | 'PLANS' | 'API_CONFIG' | 'AUDIT'>('COMPANIES');
  
  // Selected user for company assignments modal
  const [selectedUserForAssignment, setSelectedUserForAssignment] = useState<User | null>(null);

  // New Company Modal state
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [companyForm, setCompanyForm] = useState({
    name: '',
    legalName: '',
    address: '',
    city: '',
    state: 'Maharashtra',
    stateCode: '27',
    pin: '',
    mobile: '',
    email: '',
    pan: '',
    gstin: '',
    gstType: 'REGULAR' as const,
    financialYear: '2025-26',
    invoicePrefix: 'INV/25/',
    invoiceNumberSeries: 1,
    bankName: '',
    accountNo: '',
    ifsc: '',
    branch: '',
    upiId: '',
    terms: '1. Goods once sold will not be taken back.\n2. Subject to local jurisdiction.',
    active: true,
    subscriptionPlan: 'GROWTH' as const,
    planValidTill: '2026-12-31',
  });

  // New User Modal state with Multi-Company selection
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '',
    mobile: '',
    role: 'ADMIN' as UserRole,
    companyId: companies?.[0]?.id || '',
    assignedCompanyIds: [companies?.[0]?.id || 'comp-1'],
    assignedAdminId: '',
    permissions: {
      sales: true,
      purchase: true,
      payments: true,
      inventory: true,
      gstReports: true,
      einvoice: true,
      accounting: true,
      settings: true,
    },
    active: true,
  });

  // Audit filters for Tab 5
  const [auditCompanyFilter, setAuditCompanyFilter] = useState('ALL');
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyForm.name || !companyForm.gstin) {
      alert('Company Name and GSTIN are mandatory');
      return;
    }
    createCompany(companyForm);
    setShowAddCompanyModal(false);
    // Reset
    setCompanyForm({
      name: '',
      legalName: '',
      address: '',
      city: '',
      state: 'Maharashtra',
      stateCode: '27',
      pin: '',
      mobile: '',
      email: '',
      pan: '',
      gstin: '',
      gstType: 'REGULAR',
      financialYear: '2025-26',
      invoicePrefix: 'INV/25/',
      invoiceNumberSeries: 1,
      bankName: '',
      accountNo: '',
      ifsc: '',
      branch: '',
      upiId: '',
      terms: 'Standard terms',
      active: true,
      subscriptionPlan: 'GROWTH',
      planValidTill: '2026-12-31',
    });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name || !userForm.mobile) {
      alert('Name and Mobile number are required');
      return;
    }

    const assignedIds = userForm.assignedCompanyIds && userForm.assignedCompanyIds.length > 0
      ? userForm.assignedCompanyIds
      : [userForm.companyId || companies?.[0]?.id || 'comp-1'];

    createUser({
      ...userForm,
      companyId: assignedIds[0],
      assignedCompanyIds: assignedIds
    });

    setShowAddUserModal(false);
    setUserForm({
      name: '',
      mobile: '',
      role: 'STAFF',
      companyId: companies?.[0]?.id || '',
      assignedCompanyIds: [companies?.[0]?.id || 'comp-1'],
      assignedAdminId: '',
      permissions: {
        sales: true,
        purchase: false,
        payments: true,
        inventory: false,
        gstReports: false,
        einvoice: false,
        accounting: false,
        settings: false,
      },
      active: true,
    });
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Top Banner */}
      <div className="frosted-glass-card rounded-3xl p-6 border border-white/60 dark:border-white/10 shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-300">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Multi-Tenant Architecture Controller</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">Super Admin Central Control</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage multi-companies, assign Admins &amp; Staff, configure GST APIs, and view cross-company audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 relative z-10">
          <button
            onClick={() => setShowAddCompanyModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all shadow-md shadow-purple-500/20 flex items-center gap-1.5 active:scale-98"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>+ Create Company</span>
          </button>
          <button
            onClick={() => setShowAddUserModal(true)}
            className="px-3.5 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 hover:bg-white text-slate-800 dark:text-slate-200 font-semibold text-xs transition-all border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-purple-600" />
            <span>+ Create User</span>
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/10 shadow-2xs">
          <div className="text-xs text-slate-500">Total Companies</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {companies.length}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
            {companies.filter(c => c.active).length} Active Tenants
          </div>
        </div>

        <div className="p-4 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/10 shadow-2xs">
          <div className="text-xs text-slate-500">Total Users</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {users.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {users.filter(u => u.role === 'ADMIN').length} Admins • {users.filter(u => u.role === 'STAFF').length} Staff
          </div>
        </div>

        <div className="p-4 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/10 shadow-2xs">
          <div className="text-xs text-slate-500">Active Company Inspected</div>
          <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 truncate mt-1">
            {activeCompany?.name}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            {activeCompany?.gstin}
          </div>
        </div>

        <div className="p-4 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/10 shadow-2xs">
          <div className="text-xs text-slate-500">GST Gateway Status</div>
          <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>NIC Sandbox Connected</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Auto IRN &amp; QR Active</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('COMPANIES')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'COMPANIES'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          Companies Directory ({companies.length})
        </button>
        <button
          onClick={() => setActiveTab('USERS')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'USERS'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          User Hierarchy &amp; Bindings ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('PLANS')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'PLANS'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          Subscription &amp; Plans
        </button>
        <button
          onClick={() => setActiveTab('API_CONFIG')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'API_CONFIG'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          GST &amp; e-Invoice API Gateway
        </button>
        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'AUDIT'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          Cross-Company Audit Trail ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: Companies Directory */}
      {activeTab === 'COMPANIES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {companies.map(comp => {
            const adminUser = users.find(u => u.companyId === comp.id && u.role === 'ADMIN');
            const staffUsers = users.filter(u => u.companyId === comp.id && u.role === 'STAFF');
            const isCurrentlySelected = comp.id === activeCompany?.id;

            return (
              <div 
                key={comp.id}
                className={`bg-white dark:bg-slate-800 rounded-2xl border ${
                  isCurrentlySelected ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-slate-200 dark:border-slate-700'
                } p-5 shadow-xs flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{comp.name}</span>
                        {comp.active ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
                            Deactivated
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                          {comp.subscriptionPlan}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{comp.legalName}</div>
                    </div>

                    <button
                      onClick={() => updateCompany(comp.id, { active: !comp.active })}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                        comp.active 
                          ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-950/40' 
                          : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {comp.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60">
                      <span className="text-[10px] text-slate-400 block font-mono">GSTIN / State</span>
                      <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{comp.gstin}</span>
                      <span className="text-[10px] text-slate-500 block">{comp.state} ({comp.stateCode})</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60">
                      <span className="text-[10px] text-slate-400 block font-mono">Series &amp; Prefix</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{comp.invoicePrefix}</span>
                      <span className="text-[10px] text-slate-500 block">Next No: {comp.invoiceNumberSeries}</span>
                    </div>
                  </div>

                  {/* Bound Users */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Assigned Hierarchy
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-600 dark:text-slate-300">Bound Admin:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {adminUser ? `${adminUser.name} (${adminUser.mobile})` : 'None Assigned'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-600 dark:text-slate-300">Staff Count:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {staffUsers.length} Members ({staffUsers.map(s => s.name).join(', ') || 'None'})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Inspect Company Button */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Plan valid till: {comp.planValidTill}
                  </span>
                  <button
                    onClick={() => switchCompany(comp.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      isCurrentlySelected 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-purple-50 hover:text-purple-600'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isCurrentlySelected ? 'Currently Viewing' : 'Switch & Inspect Books'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: User Hierarchy & Bindings */}
      {activeTab === 'USERS' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">User Accounts &amp; Company Bindings</h2>
              <p className="text-xs text-slate-500">Admins and Staff are strictly isolated to their assigned company</p>
            </div>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add User</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">User Name</th>
                  <th className="px-4 py-3">Mobile (OTP Login)</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Assigned Companies</th>
                  <th className="px-4 py-3">Assigned Admin</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {users.map(u => {
                  const assignedAdmin = users.find(a => a.id === u.assignedAdminId);
                  const authorizedComps = getAuthorizedCompaniesForUser(u);

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {u.name}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                        +91 {u.mobile}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' :
                          u.role === 'ADMIN' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.role === 'SUPER_ADMIN' ? (
                          <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-semibold text-[11px]">
                            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                            <span>All Companies (Global Super Admin)</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {authorizedComps.length > 0 ? (
                              <div className="flex flex-wrap gap-1 items-center max-w-xs">
                                {authorizedComps.map(c => (
                                  <span 
                                    key={c.id} 
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60"
                                    title={`GSTIN: ${c.gstin} • State: ${c.stateCode}`}
                                  >
                                    <Building2 className="w-2.5 h-2.5 shrink-0" />
                                    <span className="truncate max-w-[120px]">{c.name}</span>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-rose-500 italic text-[11px]">No company assigned</span>
                            )}
                            <div className="text-[10px] text-slate-400">
                              {authorizedComps.length} {authorizedComps.length === 1 ? 'company assigned' : 'companies assigned'}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {assignedAdmin ? assignedAdmin.name : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {u.active ? (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="text-red-600 font-semibold flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {u.role !== 'SUPER_ADMIN' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedUserForAssignment(u)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px] flex items-center gap-1 transition-colors border border-indigo-200/60 dark:border-indigo-800/60"
                              title="Assign or remove multiple companies"
                            >
                              <Building2 className="w-3.5 h-3.5" />
                              <span>Assign Companies</span>
                            </button>
                            <button
                              onClick={() => toggleUserActive(u.id)}
                              className={`text-[11px] font-semibold px-2 py-1 rounded-lg transition-colors ${
                                u.active 
                                  ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30' 
                                  : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                              }`}
                            >
                              {u.active ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">Protected</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Plans & Subscriptions */}
      {activeTab === 'PLANS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
            <div className="text-xs font-bold text-slate-500 uppercase">Starter Plan</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">₹499 <span className="text-xs font-normal text-slate-500">/ month</span></div>
            <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2">✓ 1 Company, 1 Admin</li>
              <li className="flex items-center gap-2">✓ Up to 100 Invoices / mo</li>
              <li className="flex items-center gap-2">✓ Standard GST Reports</li>
              <li className="flex items-center gap-2">✗ e-Invoice / E-Way Gateway</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-purple-500 p-5 shadow-sm relative">
            <span className="absolute -top-3 right-4 px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold uppercase tracking-wide">
              Most Popular
            </span>
            <div className="text-xs font-bold text-purple-600 uppercase">Growth Plan</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">₹1,499 <span className="text-xs font-normal text-slate-500">/ month</span></div>
            <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2">✓ 3 Companies, 5 Staff members</li>
              <li className="flex items-center gap-2">✓ Unlimited Sales &amp; Purchase</li>
              <li className="flex items-center gap-2">✓ GSTR-1, 3B, JSON Export</li>
              <li className="flex items-center gap-2">✓ Integrated e-Invoice &amp; E-Way Bill</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
            <div className="text-xs font-bold text-blue-600 uppercase">Enterprise Plan</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">₹3,999 <span className="text-xs font-normal text-slate-500">/ month</span></div>
            <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2">✓ Unlimited Companies &amp; Staff</li>
              <li className="flex items-center gap-2">✓ Direct GSP / NIC API integration</li>
              <li className="flex items-center gap-2">✓ Full Audit Trail &amp; RBAC Control</li>
              <li className="flex items-center gap-2">✓ Custom Invoice Themes &amp; Thermal</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 4: GST & e-Invoice API Gateway */}
      {activeTab === 'API_CONFIG' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs max-w-2xl">
          <h2 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
            Official GST &amp; IRP e-Invoice API Settings
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Configure authorized GSP (GST Suvidha Provider) or direct NIC e-Invoice &amp; E-Way Bill API credentials
          </p>

          <form onSubmit={(e) => { e.preventDefault(); alert('GST API Settings saved successfully!'); }} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                API Provider Gateway
              </label>
              <select
                value={gstConfig.provider || 'NIC_SANDBOX'}
                onChange={e => updateGSTConfig({ provider: e.target.value as any })}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="NIC_SANDBOX">NIC Government Sandbox (Standard e-Invoice v1.03)</option>
                <option value="CLEAR_TAX">ClearTax API GSP Connector</option>
                <option value="MASTERS_INDIA">Masters India Auto GST &amp; IRN</option>
                <option value="TAX_PRO">TaxPro Enterprise E-Way Engine</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  GSP Client ID
                </label>
                <input
                  type="text"
                  value={gstConfig.clientId || ''}
                  onChange={e => updateGSTConfig({ clientId: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  API Client Secret
                </label>
                <input
                  type="password"
                  value={gstConfig.clientSecret || ''}
                  onChange={e => updateGSTConfig({ clientSecret: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(gstConfig.autoEInvoiceAbove5Cr)}
                  onChange={e => updateGSTConfig({ autoEInvoiceAbove5Cr: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Auto-flag e-Invoice for B2B transactions (Government Rule: Turnover &gt; ₹5 Cr)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(gstConfig.autoEWayBillAbove50K)}
                  onChange={e => updateGSTConfig({ autoEWayBillAbove50K: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Auto-prompt E-Way Bill for consignments exceeding ₹50,000
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold shadow-xs"
            >
              Save API Configurations
            </button>
          </form>
        </div>
      )}

      {/* Tab 5: Cross-Company Audit Trail */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">Global Cross-Company Activity &amp; Audit Logs</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  Immutable Log
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Every create, update, delete, company assignment, IRN, E-Way Bill and login action across all tenant companies is recorded.
              </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <select
                value={auditCompanyFilter}
                onChange={e => setAuditCompanyFilter(e.target.value)}
                className="py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium"
              >
                <option value="ALL">All Companies ({companies.length})</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select
                value={auditActionFilter}
                onChange={e => setAuditActionFilter(e.target.value)}
                className="py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium"
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
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-3.5 py-3">Timestamp (IST)</th>
                  <th className="px-3.5 py-3">Company Workspace</th>
                  <th className="px-3.5 py-3">User &amp; Mobile</th>
                  <th className="px-3.5 py-3">Action</th>
                  <th className="px-3.5 py-3">Module</th>
                  <th className="px-3.5 py-3">Record ID</th>
                  <th className="px-3.5 py-3">Details</th>
                  <th className="px-3.5 py-3">Status</th>
                  <th className="px-3.5 py-3 text-right">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-mono">
                {auditLogs
                  .filter(log => {
                    if (auditCompanyFilter !== 'ALL' && log.companyId !== auditCompanyFilter) return false;
                    if (auditActionFilter !== 'ALL' && log.action !== auditActionFilter) return false;
                    return true;
                  })
                  .map(log => {
                    const comp = companies.find(c => c.id === log.companyId);
                    const compName = log.companyName || comp?.name || 'Global / All';

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                        <td className="px-3.5 py-2.5 text-slate-500 whitespace-nowrap text-[11px]">
                          {log.formattedTimestamp || log.timestamp}
                        </td>
                        <td className="px-3.5 py-2.5 font-sans whitespace-nowrap">
                          <span className="font-semibold text-slate-900 dark:text-white" title={compName}>
                            {compName}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 font-sans whitespace-nowrap">
                          <div className="font-semibold text-slate-900 dark:text-white">{log.userName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {log.userRole?.replace('_', ' ')} {log.userMobile ? `• +91 ${log.userMobile}` : ''}
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5 font-sans whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                            log.action === 'COMPANY_ASSIGN' || log.action === 'COMPANY_SWITCH' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                            log.action === 'DELETE' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                            log.action === 'LOGIN' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 font-sans text-slate-600 dark:text-slate-300 whitespace-nowrap font-medium">
                          {log.module}
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {log.recordId || '—'}
                        </td>
                        <td className="px-3.5 py-2.5 font-sans text-slate-700 dark:text-slate-200 max-w-xs truncate" title={log.details}>
                          {log.details}
                        </td>
                        <td className="px-3.5 py-2.5 font-sans whitespace-nowrap">
                          {(log.status || 'SUCCESS') === 'SUCCESS' ? (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                              SUCCESS
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-1.5 py-0.5 rounded">
                              FAILED
                            </span>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-400 text-right text-[11px] whitespace-nowrap">
                          {log.ip || '127.0.0.1'}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create Company */}
      {showAddCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Create New Company (Tenant)</h2>
            <p className="text-xs text-slate-500 mb-5">Set up legal identity, GSTIN, and financial settings</p>

            <form onSubmit={handleCreateCompany} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Company Display Name *</label>
                  <input
                    type="text"
                    required
                    value={companyForm.name || ''}
                    onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })}
                    placeholder="e.g. Acme Tech Solutions Pvt Ltd"
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Legal Trade Name *</label>
                  <input
                    type="text"
                    required
                    value={companyForm.legalName || ''}
                    onChange={e => setCompanyForm({ ...companyForm, legalName: e.target.value })}
                    placeholder="e.g. Acme Tech Solutions Private Limited"
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">GSTIN (15 Digits) *</label>
                  <input
                    type="text"
                    required
                    maxLength={15}
                    value={companyForm.gstin || ''}
                    onChange={e => {
                      const g = e.target.value.toUpperCase();
                      const pan = g.length >= 12 ? g.substring(2, 12) : '';
                      const code = g.length >= 2 ? g.substring(0, 2) : '27';
                      setCompanyForm({ ...companyForm, gstin: g, pan, stateCode: code });
                    }}
                    placeholder="27AABCA1234A1Z5"
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">State Code</label>
                  <input
                    type="text"
                    value={companyForm.stateCode || ''}
                    onChange={e => setCompanyForm({ ...companyForm, stateCode: e.target.value })}
                    placeholder="27"
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">State</label>
                  <input
                    type="text"
                    value={companyForm.state || ''}
                    onChange={e => setCompanyForm({ ...companyForm, state: e.target.value })}
                    placeholder="Maharashtra"
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Invoice Prefix</label>
                  <input
                    type="text"
                    value={companyForm.invoicePrefix || ''}
                    onChange={e => setCompanyForm({ ...companyForm, invoicePrefix: e.target.value })}
                    placeholder="ACM/25/"
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Starting Number</label>
                  <input
                    type="number"
                    value={companyForm.invoiceNumberSeries ?? 1}
                    onChange={e => setCompanyForm({ ...companyForm, invoiceNumberSeries: parseInt(e.target.value) || 1 })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Plan</label>
                  <select
                    value={companyForm.subscriptionPlan || 'STARTER'}
                    onChange={e => setCompanyForm({ ...companyForm, subscriptionPlan: e.target.value as any })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  >
                    <option value="STARTER">Starter</option>
                    <option value="GROWTH">Growth</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Accounting Financial Year (50 FYs Selection)
                </label>
                <select
                  value={companyForm.financialYear || '2025-26'}
                  onChange={e => setCompanyForm({ ...companyForm, financialYear: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-semibold text-slate-800 dark:text-slate-100"
                >
                  <optgroup label="Current & Recent FY">
                    {FIFTY_FINANCIAL_YEARS.filter(f => f.category === 'CURRENT' || f.value === '2024-25' || f.value === '2026-27').map(f => (
                      <option key={f.value} value={f.value}>
                        FY {f.value} {f.isCurrent ? '(Current Fiscal Year)' : ''}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="All 50 Financial Years (2005-06 to 2054-55)">
                    {FIFTY_FINANCIAL_YEARS.map(f => (
                      <option key={f.value} value={f.value}>
                        FY {f.value} ({f.startYear} - {f.endYear})
                      </option>
                    ))}
                  </optgroup>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Supports up to 50 financial years for retrospective books and future projection series.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCompanyModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                >
                  Create Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create User & Bind */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Add User Account</h2>
            <p className="text-xs text-slate-500 mb-5">Assign Role and strictly bind to a Company tenant</p>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={userForm.name || ''}
                  onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="e.g. Ramesh Kulkarni"
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mobile Number (For OTP Login) *</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={userForm.mobile || ''}
                  onChange={e => setUserForm({ ...userForm, mobile: e.target.value.replace(/\D/g, '') })}
                  placeholder="10-digit mobile"
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Role</label>
                  <select
                    value={userForm.role || 'STAFF'}
                    onChange={e => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  >
                    <option value="ADMIN">Admin (1 Company Full Access)</option>
                    <option value="STAFF">Staff (Granular Permissions)</option>
                    <option value="SUPER_ADMIN">Super Admin (All Companies)</option>
                  </select>
                </div>

                {userForm.role !== 'SUPER_ADMIN' && (
                  <div className="col-span-2 space-y-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300">
                      Assigned Company Workspaces (Select 1 or more) *
                    </label>
                    <div className="max-h-36 overflow-y-auto space-y-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                      {companies.map(c => {
                        const isChecked = (userForm.assignedCompanyIds || []).includes(c.id);
                        return (
                          <label key={c.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 cursor-pointer text-xs">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={e => {
                                const current = userForm.assignedCompanyIds || [];
                                let next: string[];
                                if (e.target.checked) {
                                  next = Array.from(new Set([...current, c.id]));
                                } else {
                                  next = current.filter(id => id !== c.id);
                                }
                                setUserForm({
                                  ...userForm,
                                  assignedCompanyIds: next,
                                  companyId: next[0] || c.id
                                });
                              }}
                              className="rounded text-purple-600 focus:ring-purple-500"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="font-semibold text-slate-900 dark:text-white">{c.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono ml-1.5">({c.gstin} • {c.city})</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Manage Multi-Company Assignments */}
      {selectedUserForAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Manage Company Assignments
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  User: <strong className="text-slate-800 dark:text-slate-200">{selectedUserForAssignment.name}</strong> • +91 {selectedUserForAssignment.mobile} • Role: {selectedUserForAssignment.role}
                </p>
              </div>
              <button
                onClick={() => setSelectedUserForAssignment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl text-xs text-indigo-900 dark:text-indigo-200 border border-indigo-100 dark:border-indigo-900/60">
              Super Admin can assign or revoke companies for this Admin. When logging in via OTP with <strong>+91 {selectedUserForAssignment.mobile}</strong>, the user will be presented with their authorized companies and can switch seamlessly in the workspace.
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {companies.map(comp => {
                const assignedComps = getAuthorizedCompaniesForUser(selectedUserForAssignment);
                const isAssigned = assignedComps.some(c => c.id === comp.id);

                return (
                  <div
                    key={comp.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                      isAssigned 
                        ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/30 dark:bg-indigo-950/30' 
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {comp.name}
                        </span>
                        {comp.active ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                            Active
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-bold">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        GSTIN: {comp.gstin} • State: {comp.stateCode} ({comp.state})
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (isAssigned) {
                          removeCompanyFromUser(selectedUserForAssignment.id, comp.id);
                        } else {
                          assignCompanyToUser(selectedUserForAssignment.id, comp.id);
                        }
                        // Update local selection reference
                        const updatedUser = users.find(u => u.id === selectedUserForAssignment.id);
                        if (updatedUser) {
                          setSelectedUserForAssignment({ ...updatedUser });
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 ${
                        isAssigned
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs'
                      }`}
                    >
                      {isAssigned ? (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Revoke Access</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Assign Access</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500">
                Currently assigned: <strong className="text-indigo-600 dark:text-indigo-400">{getAuthorizedCompaniesForUser(selectedUserForAssignment).length}</strong> workspaces
              </span>
              <button
                onClick={() => setSelectedUserForAssignment(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
