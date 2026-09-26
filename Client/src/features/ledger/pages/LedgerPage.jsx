import { useEffect, useState } from 'react'
import { api, queryString } from '../../../shared/api/client'
import { EmptyState, ErrorState, LoadingState, StatusBadge } from '../../../shared/components/States'
import { useAuth } from '../../auth/state/authContext'

const operationTypes = ['initial', 'receipt', 'delivery', 'transfer', 'adjustment']

export default function LedgerPage() {
  const { token } = useAuth()
  const [entries, setEntries] = useState(null)
  const [products, setProducts] = useState([])
  const [locations, setLocations] = useState([])
  const [filters, setFilters] = useState({ operationType: '', productId: '', locationId: '', from: '', to: '' })
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const [nextEntries, nextProducts, nextLocations] = await Promise.all([
        api(`/ledger${queryString(filters)}`, { token }),
        api('/products', { token }),
        api('/locations', { token }),
      ])
      setEntries(nextEntries)
      setProducts(nextProducts)
      setLocations(nextLocations)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  // The ledger refreshes when one of its query filters changes.
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { load() }, [token, filters.operationType, filters.productId, filters.locationId, filters.from, filters.to])

  if (!entries && !error) return <LoadingState label="Loading the stock ledger…" />
  if (error && !entries) return <ErrorState message={error} retry={load} />

  return <section className="page">
    <div className="page-heading">
      <div>
        <p className="eyebrow">Inventory history</p>
        <h1>Stock ledger</h1>
        <p>Every validated stock change is recorded here with its resulting location balance.</p>
      </div>
    </div>
    <div className="filter-row ledger-filters">
      <select value={filters.operationType} onChange={(e) => setFilters({ ...filters, operationType: e.target.value })}>
        <option value="">All movement types</option>
        {operationTypes.map((type) => <option key={type} value={type}>{type}</option>)}
      </select>
      <select value={filters.productId} onChange={(e) => setFilters({ ...filters, productId: e.target.value })}>
        <option value="">All products</option>
        {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
      </select>
      <select value={filters.locationId} onChange={(e) => setFilters({ ...filters, locationId: e.target.value })}>
        <option value="">All locations</option>
        {locations.map((location) => <option key={location.id} value={location.id}>{location.warehouse?.name} · {location.name}</option>)}
      </select>
      <label className="date-filter"><span>From</span><input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} /></label>
      <label className="date-filter"><span>To</span><input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} /></label>
    </div>
    {error && <div className="notice error">{error}</div>}
    <div className="panel table-panel">
      <div className="panel-heading"><div><h2>Movement history</h2><p>{entries?.length || 0} entries in this view</p></div></div>
      {entries?.length ? <div className="table-scroll"><table><thead><tr><th>When</th><th>Product</th><th>Location</th><th>Movement</th><th>Balance after</th><th>Source</th><th>Note</th></tr></thead><tbody>
        {entries.map((entry) => <tr key={entry.id}>
          <td><time>{new Date(entry.createdAt).toLocaleString()}</time></td>
          <td><strong>{entry.product?.name || 'Deleted product'}</strong><span>{entry.product?.sku}</span></td>
          <td>{entry.location?.name || 'Deleted location'}</td>
          <td><span className={`movement ${entry.quantityChange > 0 ? 'in' : 'out'}`}>{entry.quantityChange > 0 ? '+' : ''}{entry.quantityChange}</span></td>
          <td><b>{entry.balanceAfter}</b> {entry.product?.unit}</td>
          <td><StatusBadge value={entry.operationType} /><span className="cell-subtle">{entry.documentNumber}</span></td>
          <td>{entry.note || '—'}</td>
        </tr>)}
      </tbody></table></div> : <EmptyState title="No ledger entries match these filters" description="Validated receipts, deliveries, transfers and adjustments will appear here." />}
    </div>
  </section>
}
