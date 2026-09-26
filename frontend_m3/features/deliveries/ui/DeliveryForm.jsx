import { useState } from 'react';
import DeliveryItems from './DeliveryItems';

export default function DeliveryForm({ warehouses, products, onSubmit, submitLabel = 'Create delivery' }) {
  const [form, setForm] = useState({
    customer: { name: '', contact: '' },
    warehouse: '',
    location: '',
    notes: '',
  });
  const [items, setItems] = useState([{ product: '', orderedQty: '' }]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      items: items.map((i) => ({ ...i, orderedQty: Number(i.orderedQty) })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Customer name</label>
          <input
            className="w-full rounded border px-2 py-1"
            value={form.customer.name}
            onChange={(e) => setForm({ ...form, customer: { ...form.customer, name: e.target.value } })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Customer contact</label>
          <input
            className="w-full rounded border px-2 py-1"
            value={form.customer.contact}
            onChange={(e) => setForm({ ...form, customer: { ...form.customer, contact: e.target.value } })}
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
        <DeliveryItems items={items} products={products} onChange={setItems} />
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
