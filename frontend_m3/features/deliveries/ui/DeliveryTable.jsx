import { Link } from 'react-router-dom';
import DeliveryStatus from './DeliveryStatus';

export default function DeliveryTable({ deliveries }) {
  if (!deliveries.length) {
    return <p className="text-gray-500 text-sm">No deliveries yet.</p>;
  }

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b text-left text-gray-500">
          <th className="py-2">Delivery #</th>
          <th className="py-2">Customer</th>
          <th className="py-2">Items</th>
          <th className="py-2">Status</th>
          <th className="py-2">Created</th>
        </tr>
      </thead>
      <tbody>
        {deliveries.map((d) => (
          <tr key={d._id} className="border-b hover:bg-gray-50">
            <td className="py-2">
              <Link to={`/deliveries/${d._id}`} className="text-blue-600 hover:underline">
                {d.deliveryNumber}
              </Link>
            </td>
            <td className="py-2">{d.customer?.name}</td>
            <td className="py-2">{d.items?.length}</td>
            <td className="py-2"><DeliveryStatus status={d.status} /></td>
            <td className="py-2">{new Date(d.createdAt).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
