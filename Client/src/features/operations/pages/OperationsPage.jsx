import { useEffect, useMemo, useState } from 'react';
import { api } from '../../../shared/api/client';
import { EmptyState, ErrorState, LoadingState, StatusBadge } from '../../../shared/components/States';

const configs = {
  receipt: {
    plural: 'receipts', title: 'Receipts', eyebrow: 'Incoming goods',
    partner: 'Supplier / vendor', partnerKey: 'supplier',
    source: false, destination: true,
  },
  delivery: {
    plural: 'deliveries', title: 'Delivery orders', eyebrow: 'Outbound goods',
    partner: 'Customer', partnerKey: 'customer',
    source: true, destination: false,
  },
  transfer: {
    plural: 'transfers', title: 'Internal transfers', eyebrow: 'Location to location',
    source: true, destination: true,
  },
  adjustment: {
    plural: 'adjustments', title: 'Stock adjustments', eyebrow: 'Physical reconciliation',
    source: false, destination: false, adjustment: true,
  },
};

const blankLine = () => ({ productId: '', quantity: '', physicalQuantity: '' });

/**
 * Returns the set of actions available for a delivery document in a given status.
 * Enforces the state machine: draft → pick → waiting → pack → ready → validate → done
 */
function deliveryActions(status) {
  switch (status) {
    case 'draft':    return ['pick', 'cancel'];
    case 'waiting':  return ['pack', 'cancel'];
    case 'ready':    return ['validate', 'cancel'];
    default:         return [];
  }
}

function nonDeliveryActions(status) {
  if (status === 'done' || status === 'canceled') return [];
  return ['validate', 'cancel'];
}

export default function OperationsPage({ type }) {
  const config = configs[type];
  const [documents, setDocuments] = useState(null);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({
    sourceLocationId: '', destinationLocationId: '', locationId: '',
    supplier: '', customer: '', note: '',
    lines: [blankLine()],
  });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const shortTitle = useMemo(() => config.title.replace(' orders', '').replace('Internal ', ''), [config.title]);

  const load = async () => {
    try {
      const [nextDocuments, nextProducts, nextLocations] = await Promise.all([
        api(`/${config.plural}${status ? `?status=${status}` : ''}`),
        api('/products'),
        api('/locations'),
      ]);
      setDocuments(nextDocuments);
      setProducts(nextProducts);
      setLocations(nextLocations);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [type, status]);

  const changeLine = (index, field, value) =>
    setForm({ ...form, lines: form.lines.map((line, i) => i === index ? { ...line, [field]: value } : line) });

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const lines = form.lines.map((line) =>
        config.adjustment
          ? { productId: line.productId, physicalQuantity: Number(line.physicalQuantity) }
          : { productId: line.productId, quantity: Number(line.quantity) },
      );
      await api(`/${config.plural}`, { method: 'POST', body: { ...form, lines } });
      setForm({ sourceLocationId: '', destinationLocationId: '', locationId: '', supplier: '', customer: '', note: '', lines: [blankLine()] });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const action = async (id, actionName) => {
    setBusy(true);
    setError('');
    try {
      await api(`/${config.plural}/${id}/${actionName}`, { method: 'PATCH' });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!documents && !error) return <LoadingState label={`Loading ${config.title.toLowerCase()}…`} />;
  if (error && !documents) return <ErrorState message={error} retry={load} />;

  const renderLocation = (value, onChange, label) => (
    <label className="field">
      <span>{label}</span>
      <select required value={value} onChange={onChange}>
        <option value="">Choose location</option>
        {locations.map((item) => <option key={item.id} value={item.id}>{item.warehouse?.name} · {item.name}</option>)}
      </select>
    </label>
  );

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{config.eyebrow}</p>
          <h1>{config.title}</h1>
          <p>Create documents first, then validate them to update stock and the ledger.</p>
        </div>
        <button className="button primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Close form' : `New ${shortTitle}`}
        </button>
      </div>

      <div className="filter-row">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['draft', 'waiting', 'ready', 'done', 'canceled'].map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>

      {error && <div className="notice error">{error}</div>}

      {showForm && (
        <form className="panel operation-form" onSubmit={submit}>
          <div className="panel-heading">
            <div>
              <h2>New {shortTitle.toLowerCase()}</h2>
              <p>
                {type === 'delivery'
                  ? 'Delivery flow: Draft → Pick → Pack → Validate (stock decreases on validate).'
                  : 'Validation is the only step that changes stock.'}
              </p>
            </div>
          </div>
          <div className="form-grid">
            {config.partner && (
              <label className="field">
                <span>{config.partner}</span>
                <input
                  value={form[config.partnerKey]}
                  onChange={(e) => setForm({ ...form, [config.partnerKey]: e.target.value })}
                />
              </label>
            )}
            {config.source && renderLocation(form.sourceLocationId, (e) => setForm({ ...form, sourceLocationId: e.target.value }), 'Source location')}
            {config.destination && renderLocation(form.destinationLocationId, (e) => setForm({ ...form, destinationLocationId: e.target.value }), 'Destination location')}
            {config.adjustment && renderLocation(form.locationId, (e) => setForm({ ...form, locationId: e.target.value }), 'Adjustment location')}
            <label className="field wide">
              <span>Reference / note</span>
              <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optional context for this movement" />
            </label>
          </div>
          <div className="line-editor">
            <div className="line-header">
              <h3>Product lines</h3>
              <button type="button" className="text-button" onClick={() => setForm({ ...form, lines: [...form.lines, blankLine()] })}>+ Add line</button>
            </div>
            {form.lines.map((line, index) => (
              <div className="line-row" key={index}>
                <select required value={line.productId} onChange={(e) => changeLine(index, 'productId', e.target.value)}>
                  <option value="">Choose product</option>
                  {products.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.totalOnHand} {product.unit})</option>)}
                </select>
                <input
                  required type="number" min="0" step="any"
                  placeholder={config.adjustment ? 'Physical quantity' : 'Quantity'}
                  value={config.adjustment ? line.physicalQuantity : line.quantity}
                  onChange={(e) => changeLine(index, config.adjustment ? 'physicalQuantity' : 'quantity', e.target.value)}
                />
                {form.lines.length > 1 && (
                  <button type="button" className="icon-button" onClick={() => setForm({ ...form, lines: form.lines.filter((_, i) => i !== index) })}>×</button>
                )}
              </div>
            ))}
          </div>
          <button className="button primary" disabled={busy}>{busy ? 'Saving…' : 'Create document'}</button>
        </form>
      )}

      <div className="panel table-panel">
        <div className="panel-heading">
          <div>
            <h2>{config.title}</h2>
            <p>{documents?.length || 0} documents in this view</p>
          </div>
        </div>
        {documents?.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Locations</th>
                  <th>Lines</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  const actions = type === 'delivery' ? deliveryActions(doc.status) : nonDeliveryActions(doc.status);
                  return (
                    <tr key={doc.id}>
                      <td>
                        <strong>{doc.number}</strong>
                        <span>{doc.supplier || doc.customer || doc.note || 'No reference'}</span>
                      </td>
                      <td>
                        {doc.sourceLocation?.name || doc.location?.name || '—'}
                        {doc.destinationLocation ? ` → ${doc.destinationLocation.name}` : ''}
                      </td>
                      <td>
                        {doc.lines.map((line) => (
                          <span className="mini-tag" key={line.productId}>
                            {line.product?.name}: {line.quantity ?? line.physicalQuantity}
                          </span>
                        ))}
                      </td>
                      <td><StatusBadge value={doc.status} /></td>
                      <td>{new Date(doc.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="table-actions">
                          {actions.includes('pick') && (
                            <button className="button tiny secondary" disabled={busy} onClick={() => action(doc.id, 'pick')}>Pick</button>
                          )}
                          {actions.includes('pack') && (
                            <button className="button tiny secondary" disabled={busy} onClick={() => action(doc.id, 'pack')}>Pack</button>
                          )}
                          {actions.includes('validate') && (
                            <button className="button tiny primary" disabled={busy} onClick={() => action(doc.id, 'validate')}>Validate</button>
                          )}
                          {actions.includes('cancel') && (
                            <button className="button tiny secondary" disabled={busy} onClick={() => action(doc.id, 'cancel')}>Cancel</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title={`No ${config.title.toLowerCase()} yet`} description="Create a draft document to begin the workflow." />
        )}
      </div>
    </section>
  );
}
