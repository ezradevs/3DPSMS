import { useEffect, useMemo, useState } from 'react';
import {
  FaShoppingCart,
  FaPlayCircle,
  FaStopCircle,
  FaEye,
  FaMoneyBillWave,
  FaCreditCard,
} from 'react-icons/fa';
import {
  closeSession,
  createSale,
  createSession,
  fetchItems,
  fetchSession,
  fetchSessions,
} from '../api/api';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';

function getCurrentTimeString() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

const emptySaleForm = {
  itemId: '',
  quantity: 1,
  unitPrice: '',
  note: '',
  paymentMethod: 'card',
  cashGiven: '',
  soldAtTime: '',
  autoFillTime: true,
};

const emptySessionForm = {
  title: '',
  location: '',
  sessionDate: '',
  weather: '',
};

function SalesPage() {
  const [sessions, setSessions] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [saleForm, setSaleForm] = useState(() => ({
    ...emptySaleForm,
    soldAtTime: getCurrentTimeString(),
  }));
  const [sessionForm, setSessionForm] = useState(emptySessionForm);
  const [loading, setLoading] = useState(true);
  const [savingSale, setSavingSale] = useState(false);
  const [savingSession, setSavingSession] = useState(false);

  const openSessions = useMemo(
    () => sessions.filter(session => session.status === 'open'),
    [sessions],
  );

  const selectedItem = useMemo(
    () => items.find(item => item.id === Number(saleForm.itemId)),
    [items, saleForm.itemId],
  );

  const parsedQuantity = Number(saleForm.quantity) > 0 ? Number(saleForm.quantity) : 0;
  const effectiveUnitPrice = saleForm.unitPrice !== ''
    ? Number(saleForm.unitPrice)
    : selectedItem
      ? selectedItem.price
      : 0;
  const estimatedTotal = parsedQuantity * (Number.isFinite(effectiveUnitPrice) ? effectiveUnitPrice : 0);
  const cashGivenRaw = saleForm.cashGiven !== '' ? Number(saleForm.cashGiven) : null;
  const cashGivenValue = Number.isFinite(cashGivenRaw) ? cashGivenRaw : null;
  const estimatedChange =
    saleForm.paymentMethod === 'cash' && cashGivenValue !== null
      ? cashGivenValue - estimatedTotal
      : null;

  async function loadItems() {
    const data = await fetchItems();
    setItems(data);
  }

  async function loadSessions() {
    const data = await fetchSessions();
    setSessions(data);
    return data;
  }

  async function loadSessionDetail(id) {
    if (!id) {
      setSessionDetail(null);
      return;
    }
    try {
      const detail = await fetchSession(id);
      setSessionDetail(detail);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        await loadItems();
        const sessionList = await loadSessions();
        const defaultSession = sessionList.find(session => session.status === 'open') || sessionList[0];
        if (defaultSession) {
          setSelectedSessionId(defaultSession.id);
          await loadSessionDetail(defaultSession.id);
        }
      } catch (err) {
        console.error(err);
        alert(err.message);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  useEffect(() => {
    if (!selectedItem) return;
    setSaleForm(prev => ({
      ...prev,
      unitPrice: prev.unitPrice || selectedItem.price,
    }));
  }, [selectedItem]);

  useEffect(() => {
    if (saleForm.paymentMethod !== 'cash' && saleForm.cashGiven !== '') {
      setSaleForm(prev => ({ ...prev, cashGiven: '' }));
    }
  }, [saleForm.paymentMethod]);

  const handleSaleInputChange = event => {
    const { name, value } = event.target;
    if (name === 'soldAtTime' && saleForm.autoFillTime) {
      return;
    }
    setSaleForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAutoTimeToggle = () => {
    setSaleForm(prev => {
      const nextAutoFill = !prev.autoFillTime;
      return {
        ...prev,
        autoFillTime: nextAutoFill,
        soldAtTime: nextAutoFill ? getCurrentTimeString() : '',
      };
    });
  };

  const handleSessionInputChange = event => {
    const { name, value } = event.target;
    setSessionForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaleSubmit = async event => {
    event.preventDefault();
    if (!selectedSessionId) {
      alert('Select or create a session before logging sales.');
      return;
    }
    if (!saleForm.itemId) {
      alert('Choose an item to log.');
      return;
    }

    try {
      setSavingSale(true);
      let soldAtIso;
      const effectiveTime = saleForm.autoFillTime ? getCurrentTimeString() : saleForm.soldAtTime;
      if (effectiveTime) {
        const [hours, minutes] = effectiveTime.split(':');
        if (!Number.isNaN(Number(hours)) && !Number.isNaN(Number(minutes))) {
          const baseDate = sessionDetail?.sessionDate
            ? new Date(`${sessionDetail.sessionDate}T00:00:00`)
            : new Date();
          baseDate.setHours(Number(hours), Number(minutes), 0, 0);
          soldAtIso = baseDate.toISOString();
        }
      }
      await createSale(selectedSessionId, {
        itemId: Number(saleForm.itemId),
        quantity: Number(saleForm.quantity),
        unitPrice: saleForm.unitPrice ? Number(saleForm.unitPrice) : undefined,
        note: saleForm.note || undefined,
        paymentMethod: saleForm.paymentMethod,
        cashReceived: saleForm.paymentMethod === 'cash' && cashGivenValue !== null
          ? cashGivenValue
          : undefined,
        soldAt: soldAtIso,
      });
      setSaleForm(prev => ({
        ...prev,
        quantity: 1,
        note: '',
        cashGiven: '',
        soldAtTime: prev.autoFillTime ? getCurrentTimeString() : '',
      }));
      await Promise.all([loadItems(), loadSessionDetail(selectedSessionId)]);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSavingSale(false);
    }
  };

  const handleSessionSubmit = async event => {
    event.preventDefault();
    if (!sessionForm.title) {
      alert('Session title is required.');
      return;
    }

    try {
      setSavingSession(true);
      const newSession = await createSession({
        title: sessionForm.title,
        location: sessionForm.location,
        sessionDate: sessionForm.sessionDate || undefined,
        weather: sessionForm.weather || undefined,
      });
      setSessionForm({ ...emptySessionForm });
      await loadSessions();
      setSelectedSessionId(newSession.id);
      await loadSessionDetail(newSession.id);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSavingSession(false);
    }
  };

  const handleCloseSession = async () => {
    if (!selectedSessionId) return;
    const confirmed = window.confirm('Close this sales session? You can still view it later.');
    if (!confirmed) return;
    try {
      await closeSession(selectedSessionId);
      const updatedSessions = await loadSessions();
      const nextSession = updatedSessions.find(session => session.status === 'open') || updatedSessions[0];
      const nextId = nextSession ? nextSession.id : null;
      setSelectedSessionId(nextId);
      await loadSessionDetail(nextId);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleSessionSelect = async id => {
    setSelectedSessionId(id);
    await loadSessionDetail(id);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Sales Sessions</h1>
        <div className="inline-actions">
          <div className="badge">{sessions.length} total</div>
          <div className="badge success">{openSessions.length} open</div>
        </div>
      </div>

      {loading && <div className="card">Loading sessions...</div>}

      {!loading && (
        <div className="card-grid columns-2">
          <div className="card">
            <h2><FaShoppingCart style={{ marginRight: '0.5rem' }} />Log Sale</h2>
            {selectedSessionId ? (
              <form className="form-grid" onSubmit={handleSaleSubmit}>
                <div className="form-row">
                  <label htmlFor="itemId">Item</label>
                  <select
                    id="itemId"
                    name="itemId"
                    required
                    value={saleForm.itemId}
                    onChange={handleSaleInputChange}
                  >
                    <option value="">Select item</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} · {formatCurrency(item.price)} · {item.quantity} on hand
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                  <div className="form-row">
                    <label htmlFor="quantity">Quantity</label>
                    <input
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="1"
                      step="1"
                      value={saleForm.quantity}
                      onChange={handleSaleInputChange}
                    />
                  </div>
                  <div className="form-row">
                    <label htmlFor="unitPrice">Unit Price</label>
                    <input
                      id="unitPrice"
                      name="unitPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={saleForm.unitPrice}
                      onChange={handleSaleInputChange}
                      placeholder={selectedItem ? formatCurrency(selectedItem.price) : 'Auto'}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <label htmlFor="note">Note (optional)</label>
                  <input
                    id="note"
                    name="note"
                    value={saleForm.note}
                    onChange={handleSaleInputChange}
                  />
                </div>
                <div className="form-row">
                  <label htmlFor="soldAtTime">Time</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      id="soldAtTime"
                      name="soldAtTime"
                      type="time"
                      value={saleForm.soldAtTime}
                      onChange={handleSaleInputChange}
                      disabled={saleForm.autoFillTime}
                    />
                    <button
                      type="button"
                      className={`button ${saleForm.autoFillTime ? 'secondary' : 'ghost'}`}
                      onClick={handleAutoTimeToggle}
                    >
                      {saleForm.autoFillTime ? 'Auto time on' : 'Use current time'}
                    </button>
                  </div>
                </div>
                <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                  <div className="form-row">
                    <label htmlFor="paymentMethod">Payment Method</label>
                    <select
                      id="paymentMethod"
                      name="paymentMethod"
                      value={saleForm.paymentMethod}
                      onChange={handleSaleInputChange}
                    >
                      <option value="card">Card</option>
                      <option value="cash">Cash</option>
                    </select>
                  </div>
                  {saleForm.paymentMethod === 'cash' && (
                    <div className="form-row">
                      <label htmlFor="cashGiven">Cash Received</label>
                      <input
                        id="cashGiven"
                        name="cashGiven"
                        type="number"
                        min="0"
                        step="0.01"
                        value={saleForm.cashGiven}
                        onChange={handleSaleInputChange}
                        placeholder="Amount tendered"
                      />
                    </div>
                  )}
                </div>
                <div className="muted" style={{ fontSize: '0.85rem' }}>
                  Estimated total: {formatCurrency(estimatedTotal)}
                  {saleForm.paymentMethod === 'cash' && cashGivenValue !== null && (
                    <>
                      {' '}• Change due:{' '}
                      <strong>{formatCurrency(Math.max(0, estimatedChange ?? 0))}</strong>
                      {estimatedChange != null && estimatedChange < 0 && (
                        <span style={{ color: '#dc2626', marginLeft: '0.5rem' }}>
                          Customer still owes {formatCurrency(Math.abs(estimatedChange))}
                        </span>
                      )}
                    </>
                  )}
                </div>
                <button type="submit" className="button" disabled={savingSale}>
                  <FaShoppingCart />
                  {savingSale ? 'Logging...' : 'Add Sale'}
                </button>
              </form>
            ) : (
              <div className="muted">
                No session selected. Create a new session to begin logging sales.
              </div>
            )}
          </div>

          <div className="card">
            <h2><FaPlayCircle style={{ marginRight: '0.5rem' }} />Create Session</h2>
            <form className="form-grid" onSubmit={handleSessionSubmit}>
              <div className="form-row">
                <label htmlFor="title">Session Title</label>
                <input
                  id="title"
                  name="title"
                  required
                  value={sessionForm.title}
                  onChange={handleSessionInputChange}
                  placeholder="Lyne Park — Friday night"
                />
              </div>
              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                <div className="form-row">
                  <label htmlFor="location">Location</label>
                  <input
                    id="location"
                    name="location"
                    value={sessionForm.location}
                    onChange={handleSessionInputChange}
                    placeholder="Lyne Park"
                  />
                </div>
                <div className="form-row">
                  <label htmlFor="sessionDate">Date</label>
                  <input
                    id="sessionDate"
                    name="sessionDate"
                    type="date"
                    value={sessionForm.sessionDate}
                    onChange={handleSessionInputChange}
                  />
                </div>
                <div className="form-row">
                  <label htmlFor="weather">Weather</label>
                  <input
                    id="weather"
                    name="weather"
                    value={sessionForm.weather}
                    onChange={handleSessionInputChange}
                    placeholder="Sunny, 24°C"
                  />
                </div>
              </div>
              <button type="submit" className="button" disabled={savingSession}>
                <FaPlayCircle />
                {savingSession ? 'Creating...' : 'Start Session'}
              </button>
            </form>
          </div>
        </div>
      )}

      {sessionDetail && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="flex-between">
            <div>
              <h2>{sessionDetail.title}</h2>
              <div className="muted">
                {formatDate(sessionDetail.sessionDate)} • {sessionDetail.location || 'Location TBD'}
                {sessionDetail.weather ? ` • Weather: ${sessionDetail.weather}` : ''}
              </div>
            </div>
              <div className="inline-actions">
                <div className={`badge ${sessionDetail.status === 'open' ? 'success' : ''}`}>
                  {sessionDetail.status.toUpperCase()}
                </div>
                {sessionDetail.status === 'open' && (
                  <button type="button" className="button ghost" onClick={handleCloseSession}>
                    <FaStopCircle />
                    Close Session
                  </button>
                )}
              </div>
          </div>

          <div className="stats-grid" style={{ marginTop: '1.5rem' }}>
            <div>
              <div className="muted">Total Revenue</div>
              <strong>{formatCurrency(sessionDetail.totalRevenue)}</strong>
            </div>
            <div>
              <div className="muted">Items Sold</div>
              <strong>{sessionDetail.totalItemsSold}</strong>
            </div>
            <div>
              <div className="muted">Transactions</div>
              <strong>{sessionDetail.saleCount}</strong>
            </div>
          </div>

          <div className="table-wrapper" style={{ marginTop: '1.5rem' }}>
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {sessionDetail.sales.length ? (
                  sessionDetail.sales.map(sale => (
                    <tr key={sale.id}>
                      <td>{formatDateTime(sale.soldAt)}</td>
                      <td>{sale.itemName}</td>
                      <td>{sale.quantity}</td>
                      <td>{formatCurrency(sale.totalPrice)}</td>
                      <td>
                        <div className="muted" style={{ display: 'grid', gap: '0.25rem' }}>
                          <span>
                            {sale.paymentMethod === 'cash' ? (
                              <>
                                <FaMoneyBillWave style={{ marginRight: '0.35rem' }} /> Cash
                              </>
                            ) : (
                              <>
                                <FaCreditCard style={{ marginRight: '0.35rem' }} /> Card
                              </>
                            )}
                          </span>
                          {sale.paymentMethod === 'cash' && sale.cashReceived != null && (
                            <span>
                              Tendered {formatCurrency(sale.cashReceived)}
                              {sale.changeGiven != null && (
                                <span> • Change {formatCurrency(sale.changeGiven)}</span>
                              )}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{sale.note || '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="muted" style={{ textAlign: 'center', padding: '1.5rem' }}>
                      No sales logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && sessions.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h2>Session History</h2>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Revenue</th>
                  <th>Items</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(session => (
                  <tr key={session.id}>
                  <td>
                    <strong>{session.title}</strong>
                    <div className="muted">{session.location || '—'}</div>
                    {session.weather && (
                      <div className="muted" style={{ fontSize: '0.75rem' }}>Weather: {session.weather}</div>
                    )}
                  </td>
                    <td>
                      <span className={`badge ${session.status === 'open' ? 'success' : ''}`}>
                        {session.status.toUpperCase()}
                      </span>
                    </td>
                    <td>{formatDate(session.sessionDate || session.startedAt)}</td>
                    <td>{formatCurrency(session.totalRevenue)}</td>
                    <td>{session.totalItemsSold}</td>
                    <td>
                      <button
                        type="button"
                        className="button secondary"
                        onClick={() => handleSessionSelect(session.id)}
                      >
                        <FaEye />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesPage;
