import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAdjustments } from '../hooks/useAdjustments';
import AdjustmentTable from '../ui/AdjustmentTable';

export default function Adjustments() {
  const { adjustments, status, loadAdjustments, validate, cancel } = useAdjustments();

  useEffect(() => {
    loadAdjustments();
  }, [loadAdjustments]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Stock adjustments</h1>
        <Link to="/adjustments/new" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          New adjustment
        </Link>
      </div>

      {status === 'loading' ? (
        <p>Loading...</p>
      ) : (
        <AdjustmentTable adjustments={adjustments} onValidate={validate} onCancel={cancel} />
      )}
    </div>
  );
}
