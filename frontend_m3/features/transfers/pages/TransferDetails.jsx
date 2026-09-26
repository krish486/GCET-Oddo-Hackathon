import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTransfers } from '../hooks/useTransfers';
import TransferStatus from '../ui/TransferStatus';

export default function TransferDetails() {
  const { id } = useParams();
  const { transfer, loadTransfer, validate, cancel } = useTransfers();

  useEffect(() => {
    loadTransfer(id);
  }, [id, loadTransfer]);

  if (!transfer) return <p className="p-6">Loading...</p>;

  const canValidate = transfer.status === 'draft' || transfer.status === 'waiting';

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">{transfer.transferNumber}</h1>
        <TransferStatus status={transfer.status} />
      </div>

      <p className="mb-4">
        <span className="font-medium">{transfer.sourceLocation?.name}</span>
        {' → '}
        <span className="font-medium">{transfer.destinationLocation?.name}</span>
      </p>

      <table className="w-full text-sm border-collapse mb-4">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="py-2">Product</th>
            <th className="py-2">Quantity</th>
          </tr>
        </thead>
        <tbody>
          {transfer.items.map((item, i) => (
            <tr key={i} className="border-b">
              <td className="py-2">{item.product?.name}</td>
              <td className="py-2">{item.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {canValidate && (
        <div className="flex gap-2">
          <button
            onClick={() => validate(transfer._id)}
            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Validate (move stock)
          </button>
          <button onClick={() => cancel(transfer._id)} className="rounded border px-4 py-2 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
