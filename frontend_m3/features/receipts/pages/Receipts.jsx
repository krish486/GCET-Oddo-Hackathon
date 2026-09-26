import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useReceipts } from '../hooks/useReceipts';
import ReceiptTable from '../ui/ReceiptTable';

export default function Receipts() {
  const { receipts, status, loadReceipts } = useReceipts();

  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Receipts</h1>
        <Link to="/receipts/new" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          New receipt
        </Link>
      </div>

      {status === 'loading' ? <p>Loading...</p> : <ReceiptTable receipts={receipts} />}
    </div>
  );
}
