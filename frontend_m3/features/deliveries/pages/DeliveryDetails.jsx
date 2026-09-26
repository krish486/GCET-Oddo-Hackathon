import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDeliveries } from '../hooks/useDeliveries';
import DeliveryStatus from '../ui/DeliveryStatus';
import { deliveryApi } from '../api/deliveryApi';

export default function DeliveryDetails() {
  const { id } = useParams();
  const { delivery, loadDelivery, validate, cancel } = useDeliveries();
  const [availability, setAvailability] = useState(null);

  useEffect(() => {
    loadDelivery(id);
  }, [id, loadDelivery]);

  const checkAvailability = async () => {
    const result = await deliveryApi.checkAvailability(id);
    setAvailability(result);
  };

  if (!delivery) return <p className="p-6">Loading...</p>;

  const canValidate = delivery.status === 'draft' || delivery.status === 'waiting';

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">{delivery.deliveryNumber}</h1>
        <DeliveryStatus status={delivery.status} />
      </div>

      <p className="mb-2"><span className="font-medium">Customer:</span> {delivery.customer?.name}</p>

      <table className="w-full text-sm border-collapse mb-4">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="py-2">Product</th>
            <th className="py-2">Ordered</th>
            <th className="py-2">Delivered</th>
            {availability && <th className="py-2">Available now</th>}
          </tr>
        </thead>
        <tbody>
          {delivery.items.map((item, i) => (
            <tr key={i} className="border-b">
              <td className="py-2">{item.product?.name}</td>
              <td className="py-2">{item.orderedQty}</td>
              <td className="py-2">{item.deliveredQty}</td>
              {availability && (
                <td className={`py-2 ${availability[i]?.sufficient ? 'text-green-700' : 'text-red-600'}`}>
                  {availability[i]?.available}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {canValidate && (
        <div className="flex gap-2">
          <button onClick={checkAvailability} className="rounded border px-4 py-2 hover:bg-gray-50">
            Check availability
          </button>
          <button
            onClick={() => validate(delivery._id)}
            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Validate (stock -)
          </button>
          <button onClick={() => cancel(delivery._id)} className="rounded border px-4 py-2 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
