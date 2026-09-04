import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Item, ItemType } from '../types';
import { formatINR } from '../data/indianStates';
import { 
  Plus, 
  Search, 
  Package, 
  AlertCircle, 
  Layers, 
  Barcode, 
  Edit3, 
  ArrowUpDown,
  X
} from 'lucide-react';

interface ItemMasterModuleProps {
  isCreateOpen?: boolean;
  onCloseCreate?: () => void;
}

export const ItemMasterModule: React.FC<ItemMasterModuleProps> = ({
  isCreateOpen = false,
  onCloseCreate,
}) => {
  const { items, createItem, updateItem, adjustStock } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'GOODS' | 'SERVICE' | 'LOW_STOCK'>('ALL');
  const [showAddModal, setShowAddModal] = useState(isCreateOpen);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Stock Adjustment Modal
  const [adjustingItem, setAdjustingItem] = useState<Item | null>(null);
  const [adjustmentQty, setAdjustmentQty] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState('Physical stock audit reconciliation');

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    type: ItemType;
    sku: string;
    hsnSac: string;
    unit: string;
    gstRate: number;
    purchaseRate: number;
    salesRate: number;
    mrp: number;
    openingStock: number;
    currentStock: number;
    minStockAlert: number;
    warehouse: string;
  }>({
    name: '',
    type: 'GOODS',
    sku: '',
    hsnSac: '8471',
    unit: 'PCS',
    gstRate: 18,
    purchaseRate: 0,
    salesRate: 0,
    mrp: 0,
    openingStock: 0,
    currentStock: 0,
    minStockAlert: 5,
    warehouse: 'Main Warehouse (Bhiwandi)',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.hsnSac) {
      alert('Item Name and HSN/SAC code are mandatory');
      return;
    }

    if (editingItem) {
      updateItem(editingItem.id, formData);
      setEditingItem(null);
    } else {
      createItem({
        ...formData,
        currentStock: formData.openingStock,
      });
    }

    setShowAddModal(false);
    if (onCloseCreate) onCloseCreate();

    setFormData({
      name: '',
      type: 'GOODS',
      sku: '',
      hsnSac: '8471',
      unit: 'PCS',
      gstRate: 18,
      purchaseRate: 0,
      salesRate: 0,
      mrp: 0,
      openingStock: 0,
      currentStock: 0,
      minStockAlert: 5,
      warehouse: 'Main Warehouse (Bhiwandi)',
    });
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem) return;
    adjustStock(adjustingItem.id, adjustmentQty, adjustmentReason);
    alert(`Stock for ${adjustingItem.name} updated successfully.`);
    setAdjustingItem(null);
    setAdjustmentQty(0);
  };

  const filteredItems = items.filter(item => {
    const q = (searchQuery || '').trim().toLowerCase();
    const matches = !q ||
      (item.name || '').toLowerCase().includes(q) ||
      (item.hsnSac || '').toLowerCase().includes(q) ||
      (Boolean(item.sku) && (item.sku || '').toLowerCase().includes(q));

    if (!matches) return false;
    if (filterType === 'GOODS') return item.type === 'GOODS';
    if (filterType === 'SERVICE') return item.type === 'SERVICE';
    if (filterType === 'LOW_STOCK') return item.type === 'GOODS' && item.currentStock <= item.minStockAlert;
    return true;
  });

  return (
    <div className="space-y-5 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Items &amp; Inventory Master</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold">
              {items.length} Products/Services
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage goods and SAC services with GST slabs, HSN codes, and live stock tracking
          </p>
        </div>

        <button
          onClick={() => {
            setEditingItem(null);
            setShowAddModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Add New Product / Service</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, SKU, or HSN..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterType === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => setFilterType('GOODS')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterType === 'GOODS' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Goods (Stocked)
          </button>
          <button
            onClick={() => setFilterType('SERVICE')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterType === 'SERVICE' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Services (SAC)
          </button>
          <button
            onClick={() => setFilterType('LOW_STOCK')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 ${
              filterType === 'LOW_STOCK' ? 'bg-rose-600 text-white' : 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-300'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Low Stock</span>
          </button>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">Product / Service Name</th>
                <th className="px-4 py-3">HSN / SAC</th>
                <th className="px-4 py-3">Tax Slab</th>
                <th className="px-4 py-3 text-right">Sales Price (₹)</th>
                <th className="px-4 py-3 text-right">Purchase Price (₹)</th>
                <th className="px-4 py-3 text-center">Stock Level</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredItems.map(item => {
                const isLowStock = item.type === 'GOODS' && item.currentStock <= item.minStockAlert;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{item.name}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          item.type === 'GOODS' ? 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                        }`}>
                          {item.type}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        SKU: {item.sku || 'N/A'} • Unit: {item.unit} • {item.warehouse}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {item.hsnSac}
                    </td>

                    <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {item.gstRate}% GST
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatINR(item.salesRate)}
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-400">
                      {formatINR(item.purchaseRate)}
                    </td>

                    <td className="px-4 py-3 text-center font-mono">
                      {item.type === 'GOODS' ? (
                        <div>
                          <span className={`font-bold ${isLowStock ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
                            {item.currentStock} {item.unit}
                          </span>
                          {isLowStock && (
                            <span className="block text-[9px] text-rose-500 font-sans font-bold">
                              Reorder &lt;= {item.minStockAlert}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Service (N/A)</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.type === 'GOODS' && (
                          <button
                            onClick={() => {
                              setAdjustingItem(item);
                              setAdjustmentQty(0);
                            }}
                            className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1 font-medium"
                            title="Adjust Stock"
                          >
                            <ArrowUpDown className="w-3 h-3" />
                            <span>Adjust</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setFormData({
                              name: item.name || '',
                              type: item.type || 'GOODS',
                              sku: item.sku || '',
                              hsnSac: item.hsnSac || '',
                              unit: item.unit || 'PCS',
                              gstRate: item.gstRate ?? 18,
                              purchaseRate: item.purchaseRate ?? 0,
                              salesRate: item.salesRate ?? 0,
                              mrp: item.mrp ?? 0,
                              openingStock: item.openingStock ?? 0,
                              currentStock: item.currentStock ?? 0,
                              minStockAlert: item.minStockAlert ?? 5,
                              warehouse: item.warehouse || '',
                            });
                            setShowAddModal(true);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add/Edit Item */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingItem ? 'Edit Item' : 'New Product / Service Master'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  if (onCloseCreate) onCloseCreate();
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Item / Service Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dell UltraSharp 27 Monitor"
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Type</label>
                  <select
                    value={formData.type || 'GOODS'}
                    onChange={e => setFormData({ ...formData, type: e.target.value as ItemType })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  >
                    <option value="GOODS">Goods (Inventory Tracked)</option>
                    <option value="SERVICE">Service (Consulting/Labour)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">HSN / SAC Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.hsnSac || ''}
                    onChange={e => setFormData({ ...formData, hsnSac: e.target.value })}
                    placeholder="e.g. 84713010"
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">GST Tax Rate</label>
                  <select
                    value={formData.gstRate ?? 18}
                    onChange={e => setFormData({ ...formData, gstRate: parseFloat(e.target.value) })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono font-bold"
                  >
                    <option value="0">0% (Nil / Exempt)</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18% (Standard)</option>
                    <option value="28">28% (Luxury/Sin)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Unit of Measure</label>
                  <select
                    value={formData.unit || 'PCS'}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                  >
                    <option value="PCS">PCS - Pieces</option>
                    <option value="NOS">NOS - Numbers</option>
                    <option value="KG">KG - Kilograms</option>
                    <option value="MTR">MTR - Metres</option>
                    <option value="BOX">BOX - Boxes</option>
                    <option value="HRS">HRS - Hours</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">SKU / Item Code</label>
                  <input
                    type="text"
                    value={formData.sku || ''}
                    onChange={e => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                    placeholder="e.g. MON-27-01"
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Sales Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.salesRate ?? 0}
                    onChange={e => setFormData({ ...formData, salesRate: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Purchase Cost Price (₹)</label>
                  <input
                    type="number"
                    value={formData.purchaseRate ?? 0}
                    onChange={e => setFormData({ ...formData, purchaseRate: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Maximum Retail Price (MRP)</label>
                  <input
                    type="number"
                    value={formData.mrp ?? 0}
                    onChange={e => setFormData({ ...formData, mrp: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
              </div>

              {formData.type === 'GOODS' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Opening Stock Qty</label>
                    <input
                      type="number"
                      value={formData.openingStock ?? 0}
                      onChange={e => setFormData({ ...formData, openingStock: parseInt(e.target.value) || 0 })}
                      className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Low Stock Alert Level</label>
                    <input
                      type="number"
                      value={formData.minStockAlert ?? 0}
                      onChange={e => setFormData({ ...formData, minStockAlert: parseInt(e.target.value) || 0 })}
                      className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Warehouse Location</label>
                    <input
                      type="text"
                      value={formData.warehouse || ''}
                      onChange={e => setFormData({ ...formData, warehouse: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    if (onCloseCreate) onCloseCreate();
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adjust Stock */}
      {adjustingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">Adjust Stock Qty</h2>
            <p className="text-xs text-slate-500 mb-4">{adjustingItem.name} (Current: {adjustingItem.currentStock} {adjustingItem.unit})</p>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Qty Change (e.g., +10 for addition, -5 for damage/loss)
                </label>
                <input
                  type="number"
                  required
                  value={adjustmentQty ?? 0}
                  onChange={e => setAdjustmentQty(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono text-base font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Adjustment Reason</label>
                <input
                  type="text"
                  required
                  value={adjustmentReason || ''}
                  onChange={e => setAdjustmentReason(e.target.value)}
                  placeholder="e.g. Audit reconciliation / Damaged stock"
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdjustingItem(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
