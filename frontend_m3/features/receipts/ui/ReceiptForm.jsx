import { useState } from 'react';
import ReceiptItems from './ReceiptItems';

// `products` should come from the products feature (Member 2). Passed in
// as a prop so this form has no hard dependency on that feature's state.
export default function ReceiptForm({ warehouses, products, onSubmit, submitLabel = 'Create receipt' }) {
  const [form, setForm] = useState({
    supplier: { name: '', contact: '' },
    warehouse: '',
    location: '',
    notes: '',
  });
  const [items, setItems] = useState([{ product: '', expectedQty: '' }]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      items: items.map((i) => ({ ...i, expectedQty: Number(i.expectedQty) })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Supplier name</label>
          <input
            className="w-full rounded border px-2 py-1"
            value={form.supplier.name}
            onChange={(e) => setForm({ ...form, supplier: { ...form.supplier, name: e.target.value } })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Supplier contact</label>
          <input
            className="w-full rounded border px-2 py-1"
            value={form.supplier.contact}
            onChange={(e) => setForm({ ...form, supplier: { ...form.supplier, contact: e.target.value } })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Warehouse</label>
          <select
            className="w-full rounded border px-2 py-1"
            value={form.warehouse}
            onChange={(e) => setForm({ ...form, warehouse: e.target.value })}
            required
          >
            <option value="">Select warehouse</option>
            {warehouses.map((w) => (
              <option key={w._id} value={w._id}>{w.name}</option>
            ))}
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
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Items</label>
        <ReceiptItems items={items} products={products} onChange={setItems} />
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
