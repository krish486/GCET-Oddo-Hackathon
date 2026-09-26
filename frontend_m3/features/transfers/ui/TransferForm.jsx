import { useState } from 'react';

// No separate TransferItems.jsx in this feature's folder — the item rows
// are simple enough (product + quantity) to keep inline here.
export default function TransferForm({ warehouses, products, onSubmit, submitLabel = 'Create transfer' }) {
  const [form, setForm] = useState({
    sourceWarehouse: '',
    sourceLocation: '',
    destinationWarehouse: '',
    destinationLocation: '',
    notes: '',
  });
  const [items, setItems] = useState([{ product: '', quantity: '' }]);
  const [formError, setFormError] = useState('');

  const updateItem = (index, field, value) => {
    setItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };
  const addRow = () => setItems([...items, { product: '', quantity: '' }]);
  const removeRow = (index) => setItems(items.filter((_, i) => i !== index));

  const locationsFor = (warehouseId) => warehouses.find((w) => w._id === warehouseId)?.locations || [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.sourceLocation && form.sourceLocation === form.destinationLocation) {
      setFormError('Source and destination location must be different.');
      return;
    }
    setFormError('');
    onSubmit({
      ...form,
      items: items.map((i) => ({ ...i, quantity: Number(i.quantity) })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      {formError && <p className="text-sm text-red-600">{formError}</p>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Source warehouse</label>
          <select
            className="w-full rounded border px-2 py-1"
            value={form.sourceWarehouse}
            onChange={(e) => setForm({ ...form, sourceWarehouse: e.target.value, sourceLocation: '' })}
            required
          >
            <option value="">Select warehouse</option>
            {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Source location</label>
          <select
            className="w-full rounded border px-2 py-1"
            value={form.sourceLocation}
            onChange={(e) => setForm({ ...form, sourceLocation: e.target.value })}
            required
          >
            <option value="">Select location</option>
            {locationsFor(form.sourceWarehouse).map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Destination warehouse</label>
          <select
            className="w-full rounded border px-2 py-1"
            value={form.destinationWarehouse}
            onChange={(e) => setForm({ ...form, destinationWarehouse: e.target.value, destinationLocation: '' })}
            required
          >
            <option value="">Select warehouse</option>
            {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Destination location</label>
          <select
            className="w-full rounded border px-2 py-1"
            value={form.destinationLocation}
            onChange={(e) => setForm({ ...form, destinationLocation: e.target.value })}
            required
          >
            <option value="">Select location</option>
            {locationsFor(form.destinationWarehouse).map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium mb-1">Items</label>
        <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500">
          <span className="col-span-6">Product</span>
          <span className="col-span-4">Quantity</span>
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
              min="0.0001"
              step="any"
              className="col-span-4 rounded border px-2 py-1"
              value={item.quantity}
              onChange={(e) => updateItem(index, 'quantity', e.target.value)}
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

      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea
          className="w-full rounded border px-2 py-1"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </div>

      <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
        {submitLabel}
      </button>
    </form>
  );
}
