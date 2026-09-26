import { useEffect, useState } from 'react';
import { api } from '../../../shared/api/client';
import { EmptyState, ErrorState, LoadingState } from '../../../shared/components/States';
import { useAuth } from '../../auth/state/authContext';

export default function WarehousesPage() {
  const { user } = useAuth();
  const [warehouses, setWarehouses] = useState(null);
  const [locations, setLocations] = useState([]);
  const [mode, setMode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [warehouseForm, setWarehouseForm] = useState({ name: '', code: '', address: '' });
  const [locationForm, setLocationForm] = useState({ warehouseId: '', name: '', code: '', parentId: '' });

  const load = async () => {
    try {
      const [nextWarehouses, nextLocations] = await Promise.all([
        api('/warehouses'),
        api('/locations'),
      ]);
      setWarehouses(nextWarehouses);
      setLocations(nextLocations);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => { load(); }, []);

  const submitWarehouse = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await api('/warehouses', { method: 'POST', body: warehouseForm });
      setWarehouseForm({ name: '', code: '', address: '' });
      setMode('');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitLocation = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await api('/locations', { method: 'POST', body: { ...locationForm, parentId: locationForm.parentId || null } });
      setLocationForm({ warehouseId: '', name: '', code: '', parentId: '' });
      setMode('');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!warehouses && !error) return <LoadingState label="Loading warehouses…" />;
  if (error && !warehouses) return <ErrorState message={error} retry={load} />;

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Storage network</p>
          <h1>Warehouses &amp; locations</h1>
          <p>Organize stock across warehouses, stores, racks and nested locations.</p>
        </div>
        {user?.role === 'manager' && (
          <div className="button-row">
            <button className="button secondary" onClick={() => setMode(mode === 'warehouse' ? '' : 'warehouse')}>
              New warehouse
            </button>
            <button className="button primary" onClick={() => setMode(mode === 'location' ? '' : 'location')}>
              New location
            </button>
          </div>
        )}
      </div>

      {error && <div className="notice error">{error}</div>}

      {mode === 'warehouse' && (
        <form className="panel form-grid" onSubmit={submitWarehouse}>
          <h2>Create warehouse</h2>
          <label className="field">
            <span>Name</span>
            <input required value={warehouseForm.name} onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })} />
          </label>
          <label className="field">
            <span>Code</span>
            <input required value={warehouseForm.code} onChange={(e) => setWarehouseForm({ ...warehouseForm, code: e.target.value })} placeholder="e.g. WH-01" />
          </label>
          <label className="field wide">
            <span>Address / note</span>
            <input value={warehouseForm.address} onChange={(e) => setWarehouseForm({ ...warehouseForm, address: e.target.value })} />
          </label>
          <button className="button primary" disabled={busy}>{busy ? 'Saving…' : 'Save warehouse'}</button>
        </form>
      )}

      {mode === 'location' && (
        <form className="panel form-grid" onSubmit={submitLocation}>
          <h2>Create location</h2>
          <label className="field">
            <span>Warehouse</span>
            <select required value={locationForm.warehouseId} onChange={(e) => setLocationForm({ ...locationForm, warehouseId: e.target.value, parentId: '' })}>
              <option value="">Choose warehouse</option>
              {warehouses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Name</span>
            <input required value={locationForm.name} onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })} />
          </label>
          <label className="field">
            <span>Code</span>
            <input required value={locationForm.code} onChange={(e) => setLocationForm({ ...locationForm, code: e.target.value })} placeholder="e.g. RACK-A1" />
          </label>
          <label className="field">
            <span>Parent location (optional)</span>
            <select value={locationForm.parentId} onChange={(e) => setLocationForm({ ...locationForm, parentId: e.target.value })}>
              <option value="">Top-level location</option>
              {locations.filter((item) => item.warehouseId === locationForm.warehouseId).map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <button className="button primary" disabled={busy}>{busy ? 'Saving…' : 'Save location'}</button>
        </form>
      )}

      <div className="warehouse-grid">
        {warehouses?.length ? warehouses.map((warehouse) => (
          <article className="panel warehouse-card" key={warehouse.id}>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{warehouse.code}</p>
                <h2>{warehouse.name}</h2>
                <p>{warehouse.address || 'No address provided'}</p>
              </div>
              <b>{warehouse.locations?.length || 0} locations</b>
            </div>
            <div className="location-tree">
              {warehouse.locations?.length ? warehouse.locations.map((location) => (
                <div className="location-row" key={location.id}>
                  <div>
                    <strong>{location.name}</strong>
                    <span>{location.code}{location.parentId ? ' · nested location' : ''}</span>
                  </div>
                  <div className="stock-pills">
                    {location.stock?.length ? location.stock.map((stock) => (
                      <span key={stock.id}>{stock.product?.name || 'Unknown item'}: {stock.quantity}</span>
                    )) : <small>Empty</small>}
                  </div>
                </div>
              )) : (
                <EmptyState title="No locations yet" description="Add a store, rack or bin to receive stock." />
              )}
            </div>
          </article>
        )) : (
          <EmptyState title="No warehouses yet" description="Create your first warehouse to begin tracking stock by location." />
        )}
      </div>
    </section>
  );
}
