import { useNavigate } from 'react-router-dom';
import { useTransfers } from '../hooks/useTransfers';
import TransferForm from '../ui/TransferForm';
// Replace with real data from the products/warehouse features once merged.

export default function CreateTransfer() {
  const navigate = useNavigate();
  const { addTransfer } = useTransfers();

  const warehouses = [];
  const products = [];

  const handleSubmit = async (payload) => {
    const result = await addTransfer(payload);
    if (!result.error) navigate('/transfers');
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">New internal transfer</h1>
      <TransferForm warehouses={warehouses} products={products} onSubmit={handleSubmit} />
    </div>
  );
}
