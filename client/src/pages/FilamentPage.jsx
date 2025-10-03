import { useEffect, useMemo, useState } from 'react';
import { FaPlus, FaPen, FaSave, FaTimes, FaTint, FaRecycle } from 'react-icons/fa';
import {
  fetchFilamentSpools,
  createFilamentSpool,
  updateFilamentSpool,
  fetchFilamentUsage,
  logFilamentUsage,
} from '../api/api';
import { formatCurrency, formatDate } from '../utils/formatters';

const emptySpoolForm = {
  id: null,
  material: '',
  color: '',
  brand: '',
  owner: '',
  dryness: '',
  weightGrams: '',
  remainingGrams: '',
  cost: '',
  purchaseDate: '',
  notes: '',
};

const emptyUsageForm = {
  usedGrams: '',
  reason: '',
  reference: '',
};

function FilamentPage() {
  const [spools, setSpools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [spoolForm, setSpoolForm] = useState(emptySpoolForm);
  const [usageForm, setUsageForm] = useState(emptyUsageForm);
  const [formOpen, setFormOpen] = useState(false);
  const [savingSpool, setSavingSpool] = useState(false);
  const [savingUsage, setSavingUsage] = useState(false);
  const [selectedSpoolId, setSelectedSpoolId] = useState(null);
  const [usageEntries, setUsageEntries] = useState([]);
  const [usageLoading, setUsageLoading] = useState(false);
  const [search, setSearch] = useState('');

const filteredSpools = useMemo(() => {
  if (!search.trim()) return spools;
  const term = search.trim().toLowerCase();
  return spools.filter(spool =>
      [spool.material, spool.color, spool.brand, spool.owner]
        .filter(Boolean)
        .some(value => value.toLowerCase().includes(term)),
    );
}, [spools, search]);

  const loadSpools = async () => {
    try {
      setLoading(true);
      const data = await fetchFilamentSpools();
      setSpools(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsage = async spoolId => {
    try {
      setUsageLoading(true);
      const data = await fetchFilamentUsage(spoolId);
      setUsageEntries(data);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setUsageLoading(false);
    }
  };

  useEffect(() => {
    loadSpools();
  }, []);

  const handleSpoolFormChange = event => {
    const { name, value } = event.target;
    setSpoolForm(prev => ({ ...prev, [name]: value }));
  };

  const handleUsageFormChange = event => {
    const { name, value } = event.target;
    setUsageForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateSpool = () => {
    setSpoolForm(emptySpoolForm);
    setFormOpen(true);
  };

const handleEditSpool = spool => {
  setSpoolForm({
    id: spool.id,
    material: spool.material,
    color: spool.color || '',
    brand: spool.brand || '',
    owner: spool.owner || '',
    dryness: spool.dryness || '',
    weightGrams: spool.weightGrams ?? '',
      remainingGrams: spool.remainingGrams ?? '',
      cost: spool.cost != null ? spool.cost : '',
      purchaseDate: spool.purchaseDate ? spool.purchaseDate.substring(0, 10) : '',
      notes: spool.notes || '',
    });
    setFormOpen(true);
  };

  const resetSpoolForm = () => {
    setSpoolForm(emptySpoolForm);
    setFormOpen(false);
  };

  const handleSpoolSubmit = async event => {
    event.preventDefault();
    if (!spoolForm.material) {
      alert('Material is required.');
      return;
    }

    const payload = {
      material: spoolForm.material,
      color: spoolForm.color || undefined,
      brand: spoolForm.brand || undefined,
      owner: spoolForm.owner || undefined,
      dryness: spoolForm.dryness || undefined,
      weightGrams: spoolForm.weightGrams !== '' ? Number(spoolForm.weightGrams) : null,
      remainingGrams: spoolForm.remainingGrams !== '' ? Number(spoolForm.remainingGrams) : null,
      cost: spoolForm.cost !== '' ? Number(spoolForm.cost) : null,
      purchaseDate: spoolForm.purchaseDate || undefined,
      notes: spoolForm.notes || undefined,
    };

    try {
      setSavingSpool(true);
      if (spoolForm.id) {
        await updateFilamentSpool(spoolForm.id, payload);
      } else {
        await createFilamentSpool(payload);
      }
      await loadSpools();
      resetSpoolForm();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSavingSpool(false);
    }
  };

  const handleSelectSpool = async spool => {
    setSelectedSpoolId(spool.id);
    setUsageForm(emptyUsageForm);
    await loadUsage(spool.id);
  };

  const handleUsageSubmit = async event => {
    event.preventDefault();
    if (!selectedSpoolId) return;
    if (!usageForm.usedGrams) {
      alert('Enter grams used.');
      return;
    }

    try {
      setSavingUsage(true);
      await logFilamentUsage(selectedSpoolId, {
        usedGrams: Number(usageForm.usedGrams),
        reason: usageForm.reason || undefined,
        reference: usageForm.reference || undefined,
      });
      setUsageForm(emptyUsageForm);
      await Promise.all([loadSpools(), loadUsage(selectedSpoolId)]);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSavingUsage(false);
    }
  };

  const selectedSpool = useMemo(
    () => spools.find(spool => spool.id === selectedSpoolId) || null,
    [selectedSpoolId, spools],
  );

  return (
    <div>
      <div className="page-header">
        <h1>Filament Management</h1>
        <div className="inline-actions">
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search material, colour, brand"
            className="status-filter"
          />
          <button type="button" className="button" onClick={handleCreateSpool}>
            <FaPlus />
            Add Spool
          </button>
        </div>
      </div>

      {loading && <div className="card">Loading filament spools...</div>}
      {error && (
        <div className="card">
          <strong>Error:</strong> {error.message}
        </div>
      )}

      {!loading && !error && (
        <div className="card">
          {filteredSpools.length ? (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Spool</th>
                    <th className="spool-progress-header">Progress</th>
                    <th className="spool-cost-header">Cost</th>
                    <th className="spool-owner-header">Owner</th>
                    <th>Usage</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSpools.map(spool => {
                    const usedPercent = spool.weightGrams > 0
                      ? Math.min(100, Math.max(0, ((spool.weightGrams - spool.remainingGrams) / spool.weightGrams) * 100))
                      : 0;
                    const remainingPercent = spool.weightGrams > 0
                      ? Math.min(100, Math.max(0, (spool.remainingGrams / spool.weightGrams) * 100))
                      : 0;
                    return (
                      <tr key={spool.id} className={selectedSpoolId === spool.id ? 'spool-row selected' : 'spool-row'}>
                        <td>
                          <strong>{spool.material}</strong>
                          {spool.color && (
                            <div className="muted" style={{ fontSize: '0.85rem' }}>{spool.color}</div>
                          )}
                          {spool.brand && (
                            <div className="muted" style={{ fontSize: '0.75rem' }}>Brand: {spool.brand}</div>
                          )}
                          {spool.owner && (
                            <div className="muted" style={{ fontSize: '0.75rem' }}>Owner: {spool.owner}</div>
                          )}
                          {spool.purchaseDate && (
                            <div className="muted" style={{ fontSize: '0.75rem' }}>
                              Purchased {formatDate(spool.purchaseDate)}
                            </div>
                          )}
                        </td>
                        <td className="spool-progress-cell">
                          {spool.weightGrams > 0 ? (
                            <div>
                              <div className="spool-progress">
                                <div
                                  className="spool-progress-bar"
                                  style={{ width: `${remainingPercent}%` }}
                                />
                              </div>
                              <div className="muted" style={{ fontSize: '0.8rem' }}>
                                {spool.remainingGrams}g / {spool.weightGrams}g ({Math.round(remainingPercent)}% remaining)
                              </div>
                            </div>
                          ) : (
                            <div className="muted">No weight recorded</div>
                          )}
                        </td>
                        <td className="spool-cost-cell">
                          <div>{spool.cost != null ? formatCurrency(spool.cost) : '—'}</div>
                          <div className="muted" style={{ fontSize: '0.8rem' }}>
                            Usage logs: {spool.usageCount}
                          </div>
                        </td>
                        <td className="spool-owner-cell">{spool.owner || '—'}</td>
                        <td>
                          <div>{spool.usedGramsTotal}g used</div>
                        </td>
                        <td>
                          <div className="inline-actions">
                            <button type="button" className="button secondary" onClick={() => handleEditSpool(spool)}>
                              <FaPen />
                              Edit
                            </button>
                            <button type="button" className="button ghost" onClick={() => handleSelectSpool(spool)}>
                              <FaTint />
                              Log usage
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">No filament spools yet. Add your inventory to stay on top of usage.</div>
          )}
        </div>
      )}

      {formOpen && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h2>{spoolForm.id ? 'Update Spool' : 'Add Spool'}</h2>
          <form className="form-grid" onSubmit={handleSpoolSubmit}>
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem 1.5rem' }}>
              <div className="form-row">
                <label htmlFor="material">Material</label>
                <select
                  id="material"
                  name="material"
                  required
                  value={spoolForm.material}
                  onChange={handleSpoolFormChange}
                >
                  <option value="">Select material</option>
                  {['PLA', 'PLA Silk', 'PLA-CF', 'PETG', 'TPU', 'ABS', 'ASA', 'Resin', 'Nylon'].map(material => (
                    <option key={material} value={material}>
                      {material}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label htmlFor="color">Colour</label>
                <input
                  id="color"
                  name="color"
                  value={spoolForm.color}
                  onChange={handleSpoolFormChange}
                  placeholder="Matte black, silk gold..."
                />
              </div>
              <div className="form-row">
                <label htmlFor="brand">Brand</label>
                <select
                  id="brand"
                  name="brand"
                  value={spoolForm.brand}
                  onChange={handleSpoolFormChange}
                >
                  <option value="">Select brand</option>
                  {['eSUN', 'Overture', 'Bambu', 'Polymaker', 'Prusament', 'Elegoo', 'Anycubic', 'Sunlu', 'Creality'].map(brand => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label htmlFor="owner">Owner</label>
                <select id="owner" name="owner" value={spoolForm.owner} onChange={handleSpoolFormChange}>
                  <option value="">Shared</option>
                  {['Ezra', 'Dylan'].map(owner => (
                    <option key={owner} value={owner}>
                      {owner}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label htmlFor="dryness">Dryness</label>
                <select id="dryness" name="dryness" value={spoolForm.dryness} onChange={handleSpoolFormChange}>
                  <option value="">Select dryness</option>
                  <option value="vacuum">Vacuum Sealed</option>
                  <option value="sealed">Brand New Sealed</option>
                  <option value="open">Open</option>
                </select>
              </div>
              <div className="form-row">
                <label htmlFor="weightGrams">Spool Weight (g)</label>
                <input
                  id="weightGrams"
                  name="weightGrams"
                  type="number"
                  min="0"
                  step="1"
                  value={spoolForm.weightGrams}
                  onChange={handleSpoolFormChange}
                />
              </div>
              <div className="form-row">
                <label htmlFor="remainingGrams">Remaining (g)</label>
                <input
                  id="remainingGrams"
                  name="remainingGrams"
                  type="number"
                  min="0"
                  step="1"
                  value={spoolForm.remainingGrams}
                  onChange={handleSpoolFormChange}
                />
              </div>
            </div>
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <div className="form-row">
                <label htmlFor="cost">Cost</label>
                <input
                  id="cost"
                  name="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={spoolForm.cost}
                  onChange={handleSpoolFormChange}
                  placeholder="0.00"
                />
              </div>
              <div className="form-row">
                <label htmlFor="purchaseDate">Purchase Date</label>
                <input
                  id="purchaseDate"
                  name="purchaseDate"
                  type="date"
                  value={spoolForm.purchaseDate}
                  onChange={handleSpoolFormChange}
                />
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                rows="3"
                value={spoolForm.notes}
                onChange={handleSpoolFormChange}
                placeholder="Printer preferences, ideal temps, reminders..."
              />
            </div>
            <div className="inline-actions">
              <button type="submit" className="button" disabled={savingSpool}>
                <FaSave />
                {savingSpool ? 'Saving...' : 'Save Spool'}
              </button>
              <button type="button" className="button secondary" onClick={resetSpoolForm}>
                <FaTimes />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedSpool && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="flex-between">
            <div>
              <h2>Usage Log — {selectedSpool.material}{selectedSpool.color ? ` (${selectedSpool.color})` : ''}</h2>
              <div className="muted">
                Remaining {selectedSpool.remainingGrams}g of {selectedSpool.weightGrams}g
              </div>
            </div>
          </div>

          <form className="form-grid" onSubmit={handleUsageSubmit} style={{ marginTop: '1rem' }}>
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              <div className="form-row">
                <label htmlFor="usedGrams">Used (g)</label>
                <input
                  id="usedGrams"
                  name="usedGrams"
                  type="number"
                  step="1"
                  min="1"
                  value={usageForm.usedGrams}
                  onChange={handleUsageFormChange}
                  required
                />
              </div>
              <div className="form-row">
                <label htmlFor="reason">Reason</label>
                <input
                  id="reason"
                  name="reason"
                  value={usageForm.reason}
                  onChange={handleUsageFormChange}
                  placeholder="Print job, purge, failed print..."
                />
              </div>
              <div className="form-row">
                <label htmlFor="reference">Reference</label>
                <input
                  id="reference"
                  name="reference"
                  value={usageForm.reference}
                  onChange={handleUsageFormChange}
                  placeholder="Order number, project, etc."
                />
              </div>
            </div>
            <div className="inline-actions">
              <button type="submit" className="button" disabled={savingUsage}>
                <FaRecycle />
                {savingUsage ? 'Logging...' : 'Log Usage'}
              </button>
            </div>
          </form>

          <div className="table-wrapper" style={{ marginTop: '1.5rem' }}>
            {usageLoading ? (
              <div className="muted">Loading usage history...</div>
            ) : usageEntries.length ? (
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Used (g)</th>
                    <th>Reason</th>
                    <th>Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {usageEntries.map(entry => (
                    <tr key={entry.id}>
                      <td>{formatDate(entry.createdAt)}</td>
                      <td>{entry.usedGrams}</td>
                      <td>{entry.reason || '—'}</td>
                      <td>{entry.reference || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">No usage logged yet.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FilamentPage;
