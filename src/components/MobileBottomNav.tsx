import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Home, 
  FileSpreadsheet, 
  ShoppingCart, 
  Users, 
  Menu, 
  Plus, 
  X, 
  Receipt, 
  PackagePlus, 
  CreditCard,
  QrCode
} from 'lucide-react';

interface MobileBottomNavProps {
  activeModule: string;
  setActiveModule: (mod: string) => void;
  onOpenMobileMenu: () => void;
  onQuickAction: (action: 'NEW_SALE' | 'NEW_PURCHASE' | 'NEW_PARTY' | 'NEW_ITEM' | 'NEW_RECEIPT' | 'NEW_PAYMENT') => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeModule,
  setActiveModule,
  onOpenMobileMenu,
  onQuickAction,
}) => {
  const { hasPermission } = useApp();
  const [showSpeedDial, setShowSpeedDial] = useState(false);

  return (
    <>
      {/* Speed Dial Backdrop */}
      {showSpeedDial && (
        <div 
          onClick={() => setShowSpeedDial(false)}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 lg:hidden animate-in fade-in duration-150"
        />
      )}

      {/* Speed Dial Menu Items */}
      {showSpeedDial && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-72 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 dark:border-white/10 p-3.5 lg:hidden animate-in zoom-in-95 duration-150">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 mb-1">
            Quick Actions
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {hasPermission('sales') && (
              <button
                onClick={() => {
                  setShowSpeedDial(false);
                  onQuickAction('NEW_SALE');
                }}
                className="flex items-center gap-2 p-2.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold hover:bg-indigo-100 transition-colors border border-indigo-100/50 dark:border-indigo-900/40"
              >
                <Plus className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>+ Sale Bill</span>
              </button>
            )}

            {hasPermission('purchase') && (
              <button
                onClick={() => {
                  setShowSpeedDial(false);
                  onQuickAction('NEW_PURCHASE');
                }}
                className="flex items-center gap-2 p-2.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-semibold hover:bg-amber-100 transition-colors border border-amber-100/50 dark:border-amber-900/40"
              >
                <Plus className="w-4 h-4 text-amber-600 shrink-0" />
                <span>+ Purchase</span>
              </button>
            )}

            <button
              onClick={() => {
                setShowSpeedDial(false);
                onQuickAction('NEW_PARTY');
              }}
              className="flex items-center gap-2 p-2.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-semibold hover:bg-purple-100 transition-colors border border-purple-100/50 dark:border-purple-900/40"
            >
              <Users className="w-4 h-4 text-purple-600 shrink-0" />
              <span>+ Party</span>
            </button>

            <button
              onClick={() => {
                setShowSpeedDial(false);
                onQuickAction('NEW_ITEM');
              }}
              className="flex items-center gap-2 p-2.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold hover:bg-emerald-100 transition-colors border border-emerald-100/50 dark:border-emerald-900/40"
            >
              <PackagePlus className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>+ Item/HSN</span>
            </button>

            {hasPermission('payments') && (
              <button
                onClick={() => {
                  setShowSpeedDial(false);
                  onQuickAction('NEW_RECEIPT');
                }}
                className="flex items-center gap-2 p-2.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-semibold hover:bg-teal-100 transition-colors border border-teal-100/50 dark:border-teal-900/40"
              >
                <Receipt className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Receipt In</span>
              </button>
            )}

            {hasPermission('payments') && (
              <button
                onClick={() => {
                  setShowSpeedDial(false);
                  onQuickAction('NEW_PAYMENT');
                }}
                className="flex items-center gap-2 p-2.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-semibold hover:bg-rose-100 transition-colors border border-rose-100/50 dark:border-rose-900/40"
              >
                <CreditCard className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Payment Out</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Speed Dial Center Button */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 lg:hidden">
        <button
          onClick={() => setShowSpeedDial(!showSpeedDial)}
          className={`w-12 h-12 rounded-2xl shadow-xl flex items-center justify-center text-white transition-all transform active:scale-95 ${
            showSpeedDial ? 'bg-slate-800 rotate-45 ring-4 ring-white/80 dark:ring-slate-900/80' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30 ring-4 ring-white/80 dark:ring-slate-900/80'
          }`}
          aria-label="Quick Actions"
        >
          {showSpeedDial ? <X className="w-5 h-5" /> : <Plus className="w-6 h-6 stroke-[2.5]" />}
        </button>
      </div>

      {/* Fixed Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-t border-slate-200/60 dark:border-slate-800/60 px-2 py-1.5 lg:hidden shadow-lg">
        <div className="grid grid-cols-5 items-center justify-around text-center">
          {/* Home */}
          <button
            onClick={() => setActiveModule('DASHBOARD')}
            className={`flex flex-col items-center justify-center py-1 min-h-[44px] rounded-xl transition-colors cursor-pointer ${
              activeModule === 'DASHBOARD' || activeModule === 'dashboard' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Home</span>
          </button>

          {/* Sales */}
          <button
            onClick={() => setActiveModule('SALES')}
            className={`flex flex-col items-center justify-center py-1 min-h-[44px] rounded-xl transition-colors cursor-pointer ${
              activeModule === 'SALES' || activeModule.startsWith('sales') ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Sales</span>
          </button>

          {/* Spacer for middle floating button */}
          <div className="h-6" />

          {/* Purchase */}
          <button
            onClick={() => setActiveModule('PURCHASE')}
            className={`flex flex-col items-center justify-center py-1 min-h-[44px] rounded-xl transition-colors cursor-pointer ${
              activeModule === 'PURCHASE' || activeModule.startsWith('purchase') ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Purchase</span>
          </button>

          {/* More Menu */}
          <button
            onClick={onOpenMobileMenu}
            className="flex flex-col items-center justify-center py-1 min-h-[44px] rounded-xl text-slate-500 dark:text-slate-400 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">More</span>
          </button>
        </div>
      </nav>
    </>
  );
};
