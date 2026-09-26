import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useReceipts } from '../hooks/useReceipts';
import ReceiptStatus from '../ui/ReceiptStatus';

export default function ReceiptDetails() {
  const { id } = useParams();
  const { receipt, loadReceipt, validate, cancel } = useReceipts();

  useEffect(() => {
    loadReceipt(id);
  }, [id, loadReceipt]);

  if (!receipt) return <p className="p-6">Loading...</p>;

  const canValidate = receipt.status === 'draft' || receipt.status === 'waiting';

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">{receipt.receiptNumber}</h1>
        <ReceiptStatus status={receipt.status} />
      </div>

      <p className="mb-2"><span className="font-medium">Supplier:</span> {receipt.supplier?.name}</p>

      <table className="w-full text-sm border-collapse mb-4">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="py-2">Product</th>
            <th className="py-2">Expected</th>
            <th className="py-2">Received</th>
          </tr>
        </thead>
        <tbody>
          {receipt.items.map((item, i) => (
            <tr key={i} className="border-b">
              <td className="py-2">{item.product?.name}</td>
              <td className="py-2">{item.expectedQty}</td>
              <td className="py-2">{item.receivedQty}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {canValidate && (
        <div className="flex gap-2">
          <button
            onClick={() => validate(receipt._id)}
            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Validate (stock +)
          </button>
          <button
            onClick={() => cancel(receipt._id)}
            className="rounded border px-4 py-2 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
