const STYLES = {
  draft: 'bg-gray-100 text-gray-700',
  waiting: 'bg-amber-100 text-amber-700',
  ready: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
  canceled: 'bg-red-100 text-red-700',
};

export default function AdjustmentStatus({ status }) {
  const style = STYLES[status] || STYLES.draft;
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {status}
    </span>
  );
}
