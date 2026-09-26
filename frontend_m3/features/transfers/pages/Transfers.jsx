import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTransfers } from '../hooks/useTransfers';
import TransferTable from '../ui/TransferTable';

export default function Transfers() {
  const { transfers, status, loadTransfers } = useTransfers();

  useEffect(() => {
    loadTransfers();
  }, [loadTransfers]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Internal transfers</h1>
        <Link to="/transfers/new" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          New transfer
        </Link>
      </div>

      {status === 'loading' ? <p>Loading...</p> : <TransferTable transfers={transfers} />}
    </div>
  );
}
