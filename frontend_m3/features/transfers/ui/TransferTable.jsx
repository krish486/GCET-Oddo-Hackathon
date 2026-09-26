import { Link } from 'react-router-dom';
import TransferStatus from './TransferStatus';

export default function TransferTable({ transfers }) {
  if (!transfers.length) {
    return <p className="text-gray-500 text-sm">No transfers yet.</p>;
  }

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b text-left text-gray-500">
          <th className="py-2">Transfer #</th>
          <th className="py-2">Route</th>
          <th className="py-2">Items</th>
          <th className="py-2">Status</th>
          <th className="py-2">Created</th>
        </tr>
      </thead>
      <tbody>
        {transfers.map((t) => (
          <tr key={t._id} className="border-b hover:bg-gray-50">
            <td className="py-2">
              <Link to={`/transfers/${t._id}`} className="text-blue-600 hover:underline">
                {t.transferNumber}
              </Link>
            </td>
            <td className="py-2">{t.sourceLocation?.name} → {t.destinationLocation?.name}</td>
            <td className="py-2">{t.items?.length}</td>
            <td className="py-2"><TransferStatus status={t.status} /></td>
            <td className="py-2">{new Date(t.createdAt).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
