import { useNavigate } from 'react-router-dom';
import { useReceipts } from '../hooks/useReceipts';
import ReceiptForm from '../ui/ReceiptForm';
// These would normally come from the products/warehouse features (Member 2).
// Swap these placeholder hooks for the real ones once that branch is merged.
// import { useWarehouses } from '../../warehouse/hooks/useWarehouse';
// import { useProducts } from '../../products/hooks/useProducts';

export default function CreateReceipt() {
  const navigate = useNavigate();
  const { addReceipt } = useReceipts();

  // Placeholder data — replace with real data from useWarehouses()/useProducts()
  const warehouses = [];
  const products = [];

  const handleSubmit = async (payload) => {
    const result = await addReceipt(payload);
    if (!result.error) navigate('/receipts');
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">New receipt</h1>
      <ReceiptForm warehouses={warehouses} products={products} onSubmit={handleSubmit} />
    </div>
  );
}
