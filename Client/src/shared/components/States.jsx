export function LoadingState({ label = 'Loading workspace…' }) { return <div className="state-card"><span className="spinner" />{label}</div>; }
export function EmptyState({ title = 'Nothing to show yet', description = 'Create a record to get started.' }) { return <div className="state-card empty"><strong>{title}</strong><span>{description}</span></div>; }
export function ErrorState({ message, retry }) { return <div className="state-card error"><strong>Something needs attention</strong><span>{message}</span>{retry && <button className="button secondary" onClick={retry}>Try again</button>}</div>; }
export function StatusBadge({ value }) { return <span className={`status status-${String(value || '').replaceAll('_', '-')}`}>{String(value || 'unknown').replaceAll('_', ' ')}</span>; }
