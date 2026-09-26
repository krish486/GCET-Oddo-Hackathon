import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDeliveries } from '../hooks/useDeliveries';
import DeliveryTable from '../ui/DeliveryTable';

export default function Deliveries() {
  const { deliveries, status, loadDeliveries } = useDeliveries();

  useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Delivery orders</h1>
        <Link to="/deliveries/new" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          New delivery
        </Link>
      </div>

      {status === 'loading' ? <p>Loading...</p> : <DeliveryTable deliveries={deliveries} />}
    </div>
  );
}
