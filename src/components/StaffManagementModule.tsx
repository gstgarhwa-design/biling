import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, StaffPermissions } from '../types';
import { 
  UserCheck, 
  Shield, 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  Lock, 
  Building2, 
  Phone, 
  UserPlus, 
  X,
  AlertCircle
} from 'lucide-react';

export const StaffManagementModule: React.FC = () => {
  const { users, currentUser, activeCompany, createUser, updateUserPermissions } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // New staff form
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'STAFF'>('STAFF');

  const [permissions, setPermissions] = useState<StaffPermissions>({
    canSalesCreate: true,
    canSalesView: true,
    canSalesDelete: false,
    canPurchaseCreate: true,
    canPurchaseView: true,
    canPaymentEntry: true,
    canInventoryView: true,
    canInventoryEdit: false,
    canGSTReportView: true,
    canEInvoiceGenerate: true,
    canAuditLogView: false,
  });

  const getStaffPermissions = (rawPerms: any): StaffPermissions => ({
    canSalesCreate: Boolean(rawPerms?.canSalesCreate ?? rawPerms?.sales ?? true),
    canSalesView: Boolean(rawPerms?.canSalesView ?? rawPerms?.sales ?? true),
    canSalesDelete: Boolean(rawPerms?.canSalesDelete ?? false),
    canPurchaseCreate: Boolean(rawPerms?.canPurchaseCreate ?? rawPerms?.purchase ?? true),
    canPurchaseView: Boolean(rawPerms?.canPurchaseView ?? rawPerms?.purchase ?? true),
    canPaymentEntry: Boolean(rawPerms?.canPaymentEntry ?? rawPerms?.payments ?? true),
    canInventoryView: Boolean(rawPerms?.canInventoryView ?? rawPerms?.inventory ?? true),
    canInventoryEdit: Boolean(rawPerms?.canInventoryEdit ?? false),
    canGSTReportView: Boolean(rawPerms?.canGSTReportView ?? rawPerms?.gstReports ?? true),
    canEInvoiceGenerate: Boolean(rawPerms?.canEInvoiceGenerate ?? rawPerms?.einvoice ?? true),
    canAuditLogView: Boolean(rawPerms?.canAuditLogView ?? false),
  });

  // Filter users belonging to this company (or all if super admin)
  const companyUsers = users.filter(u => {
    if (currentUser?.role === 'SUPER_ADMIN') return true;
    return u.companyId === activeCompany?.id;
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !mobile || mobile.length !== 10) {
      alert('Valid name and 10-digit mobile number are required');
      return;
    }

    createUser({
      name,
      mobile,
      role,
      companyId: role === 'SUPER_ADMIN' ? undefined : activeCompany?.id,
      companyName: role === 'SUPER_ADMIN' ? undefined : activeCompany?.name,
      permissions: role === 'ADMIN' ? undefined : permissions,
      isActive: true,
    });

    setShowAddModal(false);
    setName('');
    setMobile('');
  };

  const togglePermission = (key: keyof StaffPermissions) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSaveEditedPermissions = (userId: string) => {
    updateUserPermissions(userId, permissions);
    setEditingUserId(null);
  };

  return (
    <div className="space-y-5 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Staff &amp; Role-Based Access Control (RBAC)</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold">
              {companyUsers.length} Team Members
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict multi-tenant company binding. Manage granular permissions for billing operators and accountants.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add Team Member</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">Member Details</th>
                <th className="px-4 py-3">Role &amp; Company Binding</th>
                <th className="px-4 py-3">Granular Capabilities</th>
                <th className="px-4 py-3 text-center">Login Access</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {companyUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{user.name}</span>
                      {user.id === currentUser?.id && (
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold px-1.5 py-0.2 rounded">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>+91 {user.mobile} (OTP Auth)</span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' :
                        user.role === 'ADMIN' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                        'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      <span>{user.companyName || 'Multi-Company Global Access'}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    {user.role === 'ADMIN' ? (
                      <span className="text-slate-600 dark:text-slate-300 font-semibold flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-blue-600" /> Full Company Administrator (All Rights)
                      </span>
                    ) : user.role === 'SUPER_ADMIN' ? (
                      <span className="text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5" /> Super Admin (Global Master Rights)
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1 max-w-sm">
                        {user.permissions?.canSalesCreate && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            Sales Create
                          </span>
                        )}
                        {user.permissions?.canPurchaseCreate && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            Purchase
                          </span>
                        )}
                        {user.permissions?.canEInvoiceGenerate && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-medium">
                            e-Invoice
                          </span>
                        )}
                        {user.permissions?.canGSTReportView && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-medium">
                            GST Reports
                          </span>
                        )}
                        {user.permissions?.canSalesDelete ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold">
                            Delete Rights
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-50 dark:bg-slate-800 text-slate-400">
                            No Delete
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Active
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right">
                    {user.role === 'STAFF' && (
                      <button
                        onClick={() => {
                          setEditingUserId(user.id);
                          if (user.permissions) setPermissions(getStaffPermissions(user.permissions));
                        }}
                        className="text-xs text-blue-600 hover:underline font-semibold"
                      >
                        Edit Permissions
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add User */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Add Team Member</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Number (For OTP Verification) *
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={mobile}
                    onChange={e => setMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="8228069899"
                    className="w-full p-2.5 rounded-r-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Role</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-medium"
                >
                  <option value="STAFF">Staff (Restricted Permissions)</option>
                  <option value="ADMIN">Company Admin (Full Company Rights)</option>
                </select>
              </div>

              {role === 'STAFF' && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Assign Staff Permissions:
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(permissions?.canSalesCreate)}
                        onChange={() => togglePermission('canSalesCreate')}
                        className="rounded text-blue-600"
                      />
                      <span>Create Sales Invoices</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(permissions?.canSalesDelete)}
                        onChange={() => togglePermission('canSalesDelete')}
                        className="rounded text-blue-600"
                      />
                      <span className="text-rose-600 font-semibold">Delete Invoices</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(permissions?.canPurchaseCreate)}
                        onChange={() => togglePermission('canPurchaseCreate')}
                        className="rounded text-blue-600"
                      />
                      <span>Record Purchases</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(permissions?.canPaymentEntry)}
                        onChange={() => togglePermission('canPaymentEntry')}
                        className="rounded text-blue-600"
                      />
                      <span>Payment Entry</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(permissions?.canEInvoiceGenerate)}
                        onChange={() => togglePermission('canEInvoiceGenerate')}
                        className="rounded text-blue-600"
                      />
                      <span>Generate e-Invoice/EWB</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(permissions?.canGSTReportView)}
                        onChange={() => togglePermission('canGSTReportView')}
                        className="rounded text-blue-600"
                      />
                      <span>View GST Reports</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Create Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Staff Permissions */}
      {editingUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3">
              Modify Staff Permissions
            </h2>

            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={Boolean(permissions?.canSalesCreate)}
                  onChange={() => togglePermission('canSalesCreate')}
                  className="rounded text-blue-600"
                />
                <span>Create &amp; Edit Sales Invoices</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={Boolean(permissions?.canSalesDelete)}
                  onChange={() => togglePermission('canSalesDelete')}
                  className="rounded text-blue-600"
                />
                <span className="text-rose-600 font-bold">Delete Sales Records</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={Boolean(permissions?.canPurchaseCreate)}
                  onChange={() => togglePermission('canPurchaseCreate')}
                  className="rounded text-blue-600"
                />
                <span>Record Purchase Invoices &amp; Debit Notes</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={Boolean(permissions?.canPaymentEntry)}
                  onChange={() => togglePermission('canPaymentEntry')}
                  className="rounded text-blue-600"
                />
                <span>Record Payments &amp; Receipts</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={Boolean(permissions?.canEInvoiceGenerate)}
                  onChange={() => togglePermission('canEInvoiceGenerate')}
                  className="rounded text-blue-600"
                />
                <span>Generate IRN &amp; E-Way Bills</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={Boolean(permissions?.canGSTReportView)}
                  onChange={() => togglePermission('canGSTReportView')}
                  className="rounded text-blue-600"
                />
                <span>View GSTR-1, GSTR-3B &amp; ITC Reports</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
              <button
                type="button"
                onClick={() => setEditingUserId(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveEditedPermissions(editingUserId)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
