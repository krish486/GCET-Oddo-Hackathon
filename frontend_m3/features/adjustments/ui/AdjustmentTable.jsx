import AdjustmentStatus from './AdjustmentStatus';

// This feature has no AdjustmentDetails page (per the folder spec), so
// validate/cancel are done inline, row by row, right from the table.
export default function AdjustmentTable({ adjustments, onValidate, onCancel }) {
  if (!adjustments.length) {
    return <p className="text-gray-500 text-sm">No adjustments yet.</p>;
  }

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b text-left text-gray-500">
          <th className="py-2">Adjustment #</th>
          <th className="py-2">Reason</th>
          <th className="py-2">Items</th>
          <th className="py-2">Status</th>
          <th className="py-2">Created</th>
          <th className="py-2" />
        </tr>
      </thead>
      <tbody>
        {adjustments.map((a) => {
          const canValidate = a.status === 'draft' || a.status === 'waiting';
          return (
            <tr key={a._id} className="border-b hover:bg-gray-50">
              <td className="py-2">{a.adjustmentNumber}</td>
              <td className="py-2">{a.reason}</td>
              <td className="py-2">{a.items?.length}</td>
              <td className="py-2"><AdjustmentStatus status={a.status} /></td>
              <td className="py-2">{new Date(a.createdAt).toLocaleDateString()}</td>
              <td className="py-2">
                {canValidate && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onValidate(a._id)}
                      className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
                    >
                      Validate
                    </button>
                    <button
                      onClick={() => onCancel(a._id)}
                      className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
