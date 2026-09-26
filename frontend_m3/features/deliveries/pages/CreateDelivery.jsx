import { useNavigate } from 'react-router-dom';
import { useDeliveries } from '../hooks/useDeliveries';
import DeliveryForm from '../ui/DeliveryForm';
// Replace with real data from the products/warehouse features once merged.

export default function CreateDelivery() {
  const navigate = useNavigate();
  const { addDelivery } = useDeliveries();

  const warehouses = [];
  const products = [];

  const handleSubmit = async (payload) => {
    const result = await addDelivery(payload);
    if (!result.error) navigate('/deliveries');
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">New delivery order</h1>
      <DeliveryForm warehouses={warehouses} products={products} onSubmit={handleSubmit} />
    </div>
  );
}
