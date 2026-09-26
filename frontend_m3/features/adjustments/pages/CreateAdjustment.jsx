import { useNavigate } from 'react-router-dom';
import { useAdjustments } from '../hooks/useAdjustments';
import AdjustmentForm from '../ui/AdjustmentForm';
// Replace with real data from the products/warehouse features once merged.

export default function CreateAdjustment() {
  const navigate = useNavigate();
  const { addAdjustment } = useAdjustments();

  const warehouses = [];
  const products = [];

  const handleSubmit = async (payload) => {
    const result = await addAdjustment(payload);
    if (!result.error) navigate('/adjustments');
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">New stock adjustment</h1>
      <AdjustmentForm warehouses={warehouses} products={products} onSubmit={handleSubmit} />
    </div>
  );
}
