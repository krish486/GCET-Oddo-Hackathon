import { Link } from 'react-router-dom';
import ReceiptStatus from './ReceiptStatus';

export default function ReceiptTable({ receipts }) {
  if (!receipts.length) {
    return <p className="text-gray-500 text-sm">No receipts yet.</p>;
  }

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b text-left text-gray-500">
          <th className="py-2">Receipt #</th>
          <th className="py-2">Supplier</th>
          <th className="py-2">Items</th>
          <th className="py-2">Status</th>
          <th className="py-2">Created</th>
        </tr>
      </thead>
      <tbody>
        {receipts.map((r) => (
          <tr key={r._id} className="border-b hover:bg-gray-50">
            <td className="py-2">
              <Link to={`/receipts/${r._id}`} className="text-blue-600 hover:underline">
                {r.receiptNumber}
              </Link>
            </td>
            <td className="py-2">{r.supplier?.name}</td>
            <td className="py-2">{r.items?.length}</td>
            <td className="py-2"><ReceiptStatus status={r.status} /></td>
            <td className="py-2">{new Date(r.createdAt).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
