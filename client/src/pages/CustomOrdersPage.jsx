import { useEffect, useMemo, useState } from 'react';
import { FaPlus, FaPen, FaSave, FaTimes } from 'react-icons/fa';
import {
  fetchCustomOrders,
  createCustomOrder,
  updateCustomOrder,
} from '../api/api';
import { formatCurrency, formatDate } from '../utils/formatters';

const ORDER_STATUSES = [
  { value: 'new', label: 'New', badgeClass: 'status-new' },
  { value: 'in_progress', label: 'In Progress', badgeClass: 'status-progress' },
  { value: 'ready', label: 'Ready for Pickup', badgeClass: 'status-ready' },
  { value: 'delivered', label: 'Delivered', badgeClass: 'status-delivered' },
  { value: 'cancelled', label: 'Cancelled', badgeClass: 'status-cancelled' },
];

const ORDER_SOURCES = [
  { value: 'email', label: 'Email' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'in_person', label: 'In Person' },
  { value: 'other', label: 'Other' },
];

const sourceLabel = value => ORDER_SOURCES.find(source => source.value === value)?.label || 'Other';

const emptyForm = {
  id: null,
  customerName: '',
  contactInfo: '',
  source: 'email',
  status: 'new',
  dueDate: '',
  requestDetails: '',
  notes: '',
  quotedPrice: '',
  depositPaid: '',
};

function CustomOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [formState, setFormState] = useState(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const filteredOrders = useMemo(() => {
    if (!filterStatus) return orders;
    return orders.filter(order => order.status === filterStatus);
  }, [orders, filterStatus]);

  const loadOrders = async (status) => {
    try {
      setLoading(true);
      const data = await fetchCustomOrders(status ? { status } : undefined);
      setOrders(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleFormChange = event => {
    const { name, value } = event.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateClick = () => {
    setFormState({ ...emptyForm, source: 'email', status: 'new' });
    setFormOpen(true);
  };

  const handleEdit = order => {
    setFormState({
      id: order.id,
      customerName: order.customerName,
      contactInfo: order.contactInfo || '',
      source: order.source || 'other',
      status: order.status,
      dueDate: order.dueDate ? order.dueDate.substring(0, 10) : '',
      requestDetails: order.requestDetails || '',
      notes: order.notes || '',
      quotedPrice: order.quotedPrice != null ? order.quotedPrice : '',
      depositPaid: order.depositPaid != null ? order.depositPaid : '',
    });
    setFormOpen(true);
  };

  const resetForm = () => {
    setFormState(emptyForm);
    setFormOpen(false);
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (!formState.customerName) {
      alert('Customer name is required.');
      return;
    }

    const payload = {
      customerName: formState.customerName,
      contactInfo: formState.contactInfo || undefined,
      source: formState.source || undefined,
      status: formState.status,
      dueDate: formState.dueDate || undefined,
      requestDetails: formState.requestDetails || undefined,
      notes: formState.notes || undefined,
      quotedPrice: formState.quotedPrice !== '' ? Number(formState.quotedPrice) : null,
      depositPaid: formState.depositPaid !== '' ? Number(formState.depositPaid) : null,
    };

    try {
      setSaving(true);
      if (formState.id) {
        await updateCustomOrder(formState.id, payload);
      } else {
        await createCustomOrder(payload);
      }
      resetForm();
      await loadOrders(filterStatus || undefined);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusFilterChange = async event => {
    const value = event.target.value;
    setFilterStatus(value);
    await loadOrders(value || undefined);
  };

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await updateCustomOrder(orderId, { status });
      await loadOrders(filterStatus || undefined);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Custom Orders</h1>
        <div className="inline-actions">
          <select value={filterStatus} onChange={handleStatusFilterChange} className="status-filter">
            <option value="">All statuses</option>
            {ORDER_STATUSES.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <button type="button" className="button" onClick={handleCreateClick}>
            <FaPlus />
            New Request
          </button>
        </div>
      </div>

      {loading && <div className="card">Loading custom orders...</div>}
      {error && (
        <div className="card">
          <strong>Error:</strong> {error.message}
        </div>
      )}

      {!loading && !error && (
        <div className="card">
          {filteredOrders.length ? (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Request</th>
                    <th>Due</th>
                    <th>Pricing</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => {
                    const statusMeta = ORDER_STATUSES.find(s => s.value === order.status) || ORDER_STATUSES[0];
                    return (
                      <tr key={order.id}>
                        <td>
                          <strong>{order.customerName}</strong>
                          {order.contactInfo && (
                            <div className="muted" style={{ fontSize: '0.85rem' }}>{order.contactInfo}</div>
                          )}
                          {order.source && (
                            <div className="muted" style={{ fontSize: '0.75rem' }}>
                              Source: {sourceLabel(order.source)}
                            </div>
                          )}
                        </td>
                        <td style={{ maxWidth: '320px' }}>
                          <div>{order.requestDetails || '—'}</div>
                          {order.notes && (
                            <div className="muted" style={{ fontSize: '0.8rem', marginTop: '0.35rem' }}>
                              Notes: {order.notes}
                            </div>
                          )}
                        </td>
                        <td>
                          {order.dueDate ? formatDate(order.dueDate) : '—'}
                          <div className="muted" style={{ fontSize: '0.75rem' }}>
                            Created {formatDate(order.createdAt)}
                          </div>
                        </td>
                        <td>
                          <div>
                            {order.quotedPrice != null ? formatCurrency(order.quotedPrice) : '—'}
                          </div>
                          {order.depositPaid != null && (
                            <div className="muted" style={{ fontSize: '0.8rem' }}>
                              Deposit: {formatCurrency(order.depositPaid)}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${statusMeta.badgeClass}`}>{statusMeta.label}</span>
                          <div className="muted" style={{ marginTop: '0.35rem' }}>
                            <select
                              value={order.status}
                              onChange={event => handleStatusUpdate(order.id, event.target.value)}
                              className="status-select"
                            >
                              {ORDER_STATUSES.map(status => (
                                <option key={status.value} value={status.value}>
                                  {status.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td>
                          <button type="button" className="button secondary" onClick={() => handleEdit(order)}>
                            <FaPen />
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">No custom orders yet. Capture the next request here.</div>
          )}
        </div>
      )}

      {formOpen && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h2>{formState.id ? 'Update Order' : 'New Custom Order'}</h2>
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="form-row">
              <label htmlFor="customerName">Customer Name</label>
              <input
                id="customerName"
                name="customerName"
                required
                value={formState.customerName}
                onChange={handleFormChange}
              />
            </div>
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <div className="form-row">
                <label htmlFor="contactInfo">Contact Info</label>
                <input
                  id="contactInfo"
                  name="contactInfo"
                  value={formState.contactInfo}
                  onChange={handleFormChange}
                  placeholder="Email, phone, Instagram handle..."
                />
              </div>
              <div className="form-row">
                <label htmlFor="source">Source</label>
                <select id="source" name="source" value={formState.source} onChange={handleFormChange}>
                  {ORDER_SOURCES.map(source => (
                    <option key={source.value} value={source.value}>
                      {source.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label htmlFor="status">Status</label>
                <select id="status" name="status" value={formState.status} onChange={handleFormChange}>
                  {ORDER_STATUSES.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label htmlFor="dueDate">Due Date</label>
                <input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={formState.dueDate}
                  onChange={handleFormChange}
                />
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="requestDetails">Request Details</label>
              <textarea
                id="requestDetails"
                name="requestDetails"
                rows="4"
                value={formState.requestDetails}
                onChange={handleFormChange}
                placeholder="Describe the model, sizing, filament, finish, etc."
              />
            </div>
            <div className="form-row">
              <label htmlFor="notes">Internal Notes</label>
              <textarea
                id="notes"
                name="notes"
                rows="3"
                value={formState.notes}
                onChange={handleFormChange}
                placeholder="Production notes, links, reminders..."
              />
            </div>
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
              <div className="form-row">
                <label htmlFor="quotedPrice">Quoted Price</label>
                <input
                  id="quotedPrice"
                  name="quotedPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formState.quotedPrice}
                  onChange={handleFormChange}
                  placeholder="0.00"
                />
              </div>
              <div className="form-row">
                <label htmlFor="depositPaid">Deposit Paid</label>
                <input
                  id="depositPaid"
                  name="depositPaid"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formState.depositPaid}
                  onChange={handleFormChange}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="inline-actions">
              <button type="submit" className="button" disabled={saving}>
                <FaSave />
                {saving ? 'Saving...' : 'Save Order'}
              </button>
              <button type="button" className="button secondary" onClick={resetForm}>
                <FaTimes />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default CustomOrdersPage;
