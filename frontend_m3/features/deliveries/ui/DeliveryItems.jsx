export default function DeliveryItems({ items, products, onChange }) {
  const updateItem = (index, field, value) => {
    const next = items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
    onChange(next);
  };

  const addRow = () => onChange([...items, { product: '', orderedQty: '' }]);
  const removeRow = (index) => onChange(items.filter((_, i) => i !== index));

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500">
        <span className="col-span-6">Product</span>
        <span className="col-span-4">Ordered qty</span>
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
            {products.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.sku})
              </option>
            ))}
          </select>
          <input
            type="number"
            min="0.0001"
            step="any"
            className="col-span-4 rounded border px-2 py-1"
            value={item.orderedQty}
            onChange={(e) => updateItem(index, 'orderedQty', e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => removeRow(index)}
            className="col-span-2 text-sm text-red-600 hover:underline"
          >
            Remove
          </button>
        </div>
      ))}

      <button type="button" onClick={addRow} className="text-sm text-blue-600 hover:underline">
        + Add product
      </button>
    </div>
  );
}
