import { useEffect, useMemo, useState } from 'react';
import { FaPlus, FaEdit, FaExchangeAlt, FaCheck, FaTimes } from 'react-icons/fa';
import {
  adjustItemQuantity,
  createItem,
  fetchItems,
  updateItem,
  fetchFilamentSpools,
} from '../api/api';
import { formatCurrency } from '../utils/formatters';
import { API_BASE } from '../api/api';

const emptyFormState = {
  id: undefined,
  name: '',
  description: '',
  price: '',
  quantity: 0,
  imagePath: null,
  imageFile: null,
  removeImage: false,
  defaultFilamentId: '',
  tag: '',
};

const drynessLabels = {
  vacuum: 'Vacuum Sealed',
  sealed: 'Brand New Sealed',
  open: 'Open',
};

const TAG_OPTIONS = ['Decorr', 'Fidget Toy', 'Functional/Practical Item', 'Gimmick'];

function InventoryPage() {
  const [items, setItems] = useState([]);
  const [spools, setSpools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [spoolsLoading, setSpoolsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formState, setFormState] = useState({ ...emptyFormState });
  const [isEditing, setIsEditing] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState(1);
  const [saving, setSaving] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  const lowStockCount = useMemo(
    () => items.filter(item => item.quantity < 5).length,
    [items],
  );

  const sortedItems = useMemo(() => {
    const sorted = [...items];
    const { key, direction } = sortConfig;
    sorted.sort((a, b) => {
      let aValue = a[key];
      let bValue = b[key];
      if (key === 'name') {
        aValue = aValue?.toLowerCase?.() || '';
        bValue = bValue?.toLowerCase?.() || '';
        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
      }
      if (key === 'price') {
        const diff = (a.price ?? 0) - (b.price ?? 0);
        return direction === 'asc' ? diff : -diff;
      }
      if (key === 'quantity') {
        const diff = (a.quantity ?? 0) - (b.quantity ?? 0);
        return direction === 'asc' ? diff : -diff;
      }
      return 0;
    });
    return sorted;
  }, [items, sortConfig]);

  const renderSortIndicator = key => {
    if (sortConfig.key !== key) return <span className="sort-indicator">↕</span>;
    return <span className="sort-indicator">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  const handleSort = key => {
    setSortConfig(prev => {
      if (prev.key === key) {
        const nextDirection = prev.direction === 'asc' ? 'desc' : 'asc';
        return { key, direction: nextDirection };
      }
      return { key, direction: 'asc' };
    });
  };

  async function loadItems() {
    try {
      setLoading(true);
      const data = await fetchItems();
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadSpools() {
    try {
      setSpoolsLoading(true);
      const data = await fetchFilamentSpools();
      setSpools(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSpoolsLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
    loadSpools();
  }, []);

  const handleInputChange = event => {
    const { name, value } = event.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = event => {
    const file = event.target.files?.[0] || null;
    setFormState(prev => ({
      ...prev,
      imageFile: file,
      removeImage: false,
    }));
  };

  const handleRemoveImage = () => {
    setFormState(prev => ({
      ...prev,
      imageFile: null,
      imagePath: null,
      removeImage: true,
    }));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    const priceValue = Number(formState.price);
    const quantityValue = Number(formState.quantity);

    if (Number.isNaN(priceValue) || priceValue < 0) {
      alert('Price must be zero or higher.');
      return;
    }
    if (!Number.isInteger(quantityValue) || quantityValue < 0) {
      alert('Quantity must be zero or a positive whole number.');
      return;
    }

    const defaultFilamentIdValue = formState.defaultFilamentId !== ''
      ? Number(formState.defaultFilamentId)
      : null;
    const tagValue = formState.tag || null;

    setSaving(true);
    try {
      const useFormData = Boolean(formState.imageFile);
      if (isEditing && formState.id) {
        if (useFormData || formState.removeImage) {
          const data = new FormData();
          data.append('name', formState.name);
          data.append('description', formState.description || '');
          data.append('price', String(priceValue));
          data.append('quantity', String(quantityValue));
          data.append('defaultFilamentId', defaultFilamentIdValue != null ? String(defaultFilamentIdValue) : '');
          data.append('tag', tagValue || '');
          if (formState.imageFile) {
            data.append('image', formState.imageFile);
          }
          if (formState.removeImage) {
            data.append('removeImage', 'true');
          }
          await updateItem(formState.id, data);
        } else {
          await updateItem(formState.id, {
            name: formState.name,
            description: formState.description,
            price: priceValue,
            quantity: quantityValue,
            defaultFilamentId: defaultFilamentIdValue,
            tag: tagValue,
          });
        }
      } else {
        if (useFormData) {
          const data = new FormData();
          data.append('name', formState.name);
          data.append('description', formState.description || '');
          data.append('price', String(priceValue));
          data.append('quantity', String(quantityValue));
          data.append('defaultFilamentId', defaultFilamentIdValue != null ? String(defaultFilamentIdValue) : '');
          data.append('tag', tagValue || '');
          data.append('image', formState.imageFile);
          await createItem(data);
        } else {
          await createItem({
            name: formState.name,
            description: formState.description,
            price: priceValue,
            quantity: quantityValue,
            defaultFilamentId: defaultFilamentIdValue,
            tag: tagValue,
          });
        }
      }
      setFormOpen(false);
      setFormState({ ...emptyFormState });
      setIsEditing(false);
      await loadItems();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = item => {
    setFormState({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: item.price,
      quantity: item.quantity,
      imagePath: item.imagePath || null,
      imageFile: null,
      removeImage: false,
      defaultFilamentId: item.defaultFilamentId ? String(item.defaultFilamentId) : '',
      tag: item.tag || '',
    });
    setIsEditing(true);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setFormState({ ...emptyFormState });
    setIsEditing(false);
    setFormOpen(true);
  };

  const handleAdjustSubmit = async event => {
    event.preventDefault();
    if (!adjustTarget) return;
    const delta = Number(adjustAmount);
    if (!Number.isInteger(delta) || delta === 0) {
      alert('Adjustment amount must be a non-zero integer');
      return;
    }
    try {
      setSaving(true);
      await adjustItemQuantity(adjustTarget.id, { delta, reason: delta > 0 ? 'restock' : 'shrinkage' });
      setAdjustTarget(null);
      setAdjustAmount(1);
      await loadItems();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const uploadsBase = API_BASE.replace(/\/api\/?$/, '');

  const renderImageControls = () => {
    const hasExistingImage = Boolean(formState.imagePath && !formState.removeImage);
    return (
      <div className="form-row">
        <label htmlFor="image">Product Image</label>
        {hasExistingImage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img
              src={`${uploadsBase}/${formState.imagePath}`}
              alt={formState.name}
              style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '0.5rem' }}
            />
            <button type="button" className="button ghost" onClick={handleRemoveImage}>
              Remove Image
            </button>
          </div>
        )}
        <input id="image" type="file" accept="image/*" onChange={handleImageChange} />
        {formState.imageFile && (
          <div className="muted">Selected: {formState.imageFile.name}</div>
        )}
      </div>
    );
  };

  const filamentLabel = item => {
    if (item.defaultFilament) {
      const parts = [item.defaultFilament.material, item.defaultFilament.color, item.defaultFilament.brand].filter(Boolean);
      const meta = [];
      if (item.defaultFilament.owner) meta.push(`Owner: ${item.defaultFilament.owner}`);
      if (item.defaultFilament.dryness) meta.push(drynessLabels[item.defaultFilament.dryness] || item.defaultFilament.dryness);
      return (
        <div className="muted" style={{ display: 'grid', gap: '0.25rem' }}>
          <span>{parts.join(' • ') || '—'}</span>
          {meta.length > 0 && <span>{meta.join(' • ')}</span>}
        </div>
      );
    }
    const fallback = spools.find(spool => spool.id === item.defaultFilamentId);
    if (fallback) {
      const parts = [fallback.material, fallback.color, fallback.brand].filter(Boolean);
      const meta = [];
      if (fallback.owner) meta.push(`Owner: ${fallback.owner}`);
      if (fallback.dryness) meta.push(drynessLabels[fallback.dryness] || fallback.dryness);
      return (
        <div className="muted" style={{ display: 'grid', gap: '0.25rem' }}>
          <span>{parts.join(' • ')}</span>
          {meta.length > 0 && <span>{meta.join(' • ')}</span>}
        </div>
      );
    }
    return <span className="muted">—</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h1>Inventory</h1>
        <div className="inline-actions">
          <div className="badge">{items.length} items</div>
          <div className={`badge ${lowStockCount ? 'warning' : ''}`}>
            {lowStockCount} low stock
          </div>
          <button type="button" className="button" onClick={handleCreate}>
            <FaPlus />
            Add New Item
          </button>
        </div>
      </div>

      {loading && <div className="card">Loading inventory...</div>}
      {error && (
        <div className="card">
          <strong>Error:</strong> {error.message}
        </div>
      )}

      {!loading && !error && (
        <div className="card">
          {sortedItems.length ? (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th className="sortable" onClick={() => handleSort('name')}>
                      Item {renderSortIndicator('name')}
                    </th>
                    <th className="sortable" onClick={() => handleSort('price')}>
                      Price {renderSortIndicator('price')}
                    </th>
                    <th>Filament</th>
                    <th>Tag</th>
                    <th className="sortable" onClick={() => handleSort('quantity')}>
                      On Hand {renderSortIndicator('quantity')}
                    </th>
                    <th>Sold</th>
                    <th>Revenue</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          {item.imagePath && (
                            <img
                              src={`${uploadsBase}/${item.imagePath}`}
                              alt={item.name}
                              style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '0.5rem' }}
                            />
                          )}
                          <div>
                            <div><strong>{item.name}</strong></div>
                            <div className="muted" style={{ fontSize: '0.85rem' }}>
                              {item.description || 'No description'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{formatCurrency(item.price)}</td>
                      <td>{filamentLabel(item)}</td>
                      <td>
                        {item.tag ? <span className="badge">{item.tag}</span> : <span className="muted">—</span>}
                      </td>
                      <td>
                        <span className={`badge ${item.quantity < 5 ? 'warning' : ''}`}>
                          {item.quantity}
                        </span>
                      </td>
                      <td>{item.totalSold}</td>
                      <td>{formatCurrency(item.totalRevenue)}</td>
                      <td>
                        <div className="inline-actions">
                          <button
                            type="button"
                            className="button secondary"
                            onClick={() => handleEdit(item)}
                          >
                            <FaEdit />
                            Edit
                          </button>
                          <button
                            type="button"
                            className="button ghost"
                            onClick={() => {
                              setAdjustTarget(item);
                              setAdjustAmount(1);
                            }}
                          >
                            <FaExchangeAlt />
                            Adjust
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              No inventory yet. Add your first product to get started.
            </div>
          )}
        </div>
      )}

      {formOpen && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h2>{isEditing ? 'Edit Item' : 'Add New Item'}</h2>
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="form-row">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                name="name"
                required
                value={formState.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-row">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                rows="3"
                value={formState.description}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <div className="form-row">
                <label htmlFor="price">Price</label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formState.price}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-row">
                <label htmlFor="quantity">Quantity</label>
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={formState.quantity}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-row">
                <label htmlFor="defaultFilamentId">Default Filament</label>
                <select
                  id="defaultFilamentId"
                  name="defaultFilamentId"
                  value={formState.defaultFilamentId}
                  onChange={handleInputChange}
                  disabled={spoolsLoading && spools.length === 0}
                >
                  <option value="">None</option>
                  {spools.map(spool => (
                    <option key={spool.id} value={spool.id}>
                      {[spool.material, spool.color, spool.brand].filter(Boolean).join(' • ') || `Spool #${spool.id}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label htmlFor="tag">Tag</label>
                <select id="tag" name="tag" value={formState.tag} onChange={handleInputChange}>
                  <option value="">None</option>
                  {TAG_OPTIONS.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
            </div>
            {renderImageControls()}
            <div className="inline-actions">
              <button type="submit" className="button" disabled={saving}>
                <FaCheck />
                {saving ? 'Saving...' : 'Save Item'}
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  setFormOpen(false);
                  setIsEditing(false);
                  setFormState({ ...emptyFormState });
                }}
              >
                <FaTimes />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {adjustTarget && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h2>Adjust Stock — {adjustTarget.name}</h2>
          <form className="inline-actions" onSubmit={handleAdjustSubmit}>
            <div className="form-row" style={{ minWidth: '160px' }}>
              <label htmlFor="adjust">Amount</label>
              <input
                id="adjust"
                type="number"
                step="1"
                value={adjustAmount}
                onChange={event => setAdjustAmount(event.target.value)}
              />
            </div>
            <button type="submit" className="button" disabled={saving}>
              <FaCheck />
              {saving ? 'Updating...' : 'Apply Adjustment'}
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => setAdjustTarget(null)}
            >
              <FaTimes />
              Cancel
            </button>
          </form>
          <p className="muted" style={{ marginTop: '1rem' }}>
            Positive numbers add freshly printed stock. Negative numbers account for damaged or missing items.
          </p>
        </div>
      )}
    </div>
  );
}

export default InventoryPage;
