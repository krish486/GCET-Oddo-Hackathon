import { useState } from 'react';

// No separate AdjustmentItems.jsx in this feature's folder — item rows
// (product + physical count) are simple enough to keep inline here.
// systemQty/difference are computed server-side (createAdjustment /
// validateAdjustment), so the form only ever collects the counted qty.
export default function AdjustmentForm({ warehouses, products, onSubmit, submitLabel = 'Create adjustment' }) {
  const [form, setForm] = useState({ warehouse: '', location: '', reason: '' });
  const [items, setItems] = useState([{ product: '', countedQty: '' }]);

  const updateItem = (index, field, value) => {
    setItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };
  const addRow = () => setItems([...items, { product: '', countedQty: '' }]);
  const removeRow = (index) => setItems(items.filter((_, i) => i !== index));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      items: items.map((i) => ({ ...i, countedQty: Number(i.countedQty) })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Warehouse</label>
          <select
            className="w-full rounded border px-2 py-1"
            value={form.warehouse}
            onChange={(e) => setForm({ ...form, warehouse: e.target.value, location: '' })}
            required
          >
            <option value="">Select warehouse</option>
            {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <select
            className="w-full rounded border px-2 py-1"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            required
          >
            <option value="">Select location</option>
            {(warehouses.find((w) => w._id === form.warehouse)?.locations || []).map((l) => (
              <option key={l._id} value={l._id}>{l.name}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Reason</label>
          <input
            className="w-full rounded border px-2 py-1"
            placeholder="e.g. Cycle count, Damaged goods"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium mb-1">Physical count</label>
        <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500">
          <span className="col-span-6">Product</span>
          <span className="col-span-4">Counted qty</span>
          <span className="col-span-2" />
        </div>
        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-12 gap-2">
            <select
              className="col-span-6 rounded border px-2 py-1"
              value={item.product}
              onChange={(e) => updateItem(index, 'product', e.target.value)}
              required
            >
              <option value="">Select product</option>
              {products.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
            </select>
            <input
              type="number"
              min="0"
              step="any"
              className="col-span-4 rounded border px-2 py-1"
              value={item.countedQty}
              onChange={(e) => updateItem(index, 'countedQty', e.target.value)}
              required
            />
            <button type="button" onClick={() => removeRow(index)} className="col-span-2 text-sm text-red-600 hover:underline">
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={addRow} className="text-sm text-blue-600 hover:underline">
          + Add product
        </button>
      </div>

      <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
        {submitLabel}
      </button>
    </form>
  );
}
