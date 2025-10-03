import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchDashboard, resetDatabase } from '../api/api';
import {
  FaBolt,
  FaBoxOpen,
  FaChartLine,
  FaHistory,
  FaRedoAlt,
  FaExclamationTriangle,
  FaDollarSign,
} from 'react-icons/fa';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';

function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resetting, setResetting] = useState(false);

  const loadDashboard = useCallback(async (showSpinner = false) => {
    try {
      if (showSpinner) {
        setLoading(true);
      }
      const response = await fetchDashboard();
      setData(response);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadDashboard(true);
    const interval = setInterval(() => {
      loadDashboard(false);
    }, 60_000);

    return () => {
      clearInterval(interval);
    };
  }, [loadDashboard]);

  const todaysSession = data?.todaySummary ?? null;
  const lowStockItems = data?.lowStockItems ?? [];
  const recentTrend = data?.recentTrend ?? [];
  const recentSales = data?.recentSales ?? [];

  const sevenDayRevenue = useMemo(
    () => recentTrend.reduce((sum, day) => sum + day.totalRevenue, 0),
    [recentTrend],
  );

  const sevenDayItems = useMemo(
    () => recentTrend.reduce((sum, day) => sum + day.totalItems, 0),
    [recentTrend],
  );

  const lastSale = recentSales.length ? recentSales[0] : null;

  const handleReset = async () => {
    const confirmed = window.confirm(
      'Resetting will wipe all inventory, sessions, sales, and uploads. Continue?',
    );
    if (!confirmed) {
      return;
    }

    try {
      setResetting(true);
      await resetDatabase();
      setData(null);
      await loadDashboard(true);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Unable to reset database');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <span className="muted">Quick overview of today&apos;s stall performance</span>
        </div>
      </div>

      {loading && <div className="card">Loading...</div>}
      {error && (
        <div className="card">
          <strong>Error:</strong> {error.message}
        </div>
      )}

      {data && !loading && !error && (
        <>
          <section className="dashboard-hero">
            <div>
              <span className="hero-tag">
                <FaBolt /> Today&apos;s Session
              </span>
              <h2>{todaysSession ? todaysSession.title : 'No active session yet'}</h2>
              <p>
                {todaysSession
                  ? `${todaysSession.status === 'open' ? 'Actively trading — keep logging those sales!' : 'Closed — great work today.'}`
                  : 'Start a session from the Sales page to track sales and inventory in real time.'}
              </p>
              {todaysSession?.weather && (
                <p className="muted" style={{ margin: 0 }}>
                  Weather: {todaysSession.weather}
                </p>
              )}
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <span>
                  <FaDollarSign /> Revenue
                </span>
                <strong>{formatCurrency(todaysSession ? todaysSession.totalRevenue : 0)}</strong>
              </div>
              <div className="hero-stat">
                <span>
                  <FaBoxOpen /> Items Sold
                </span>
                <strong>{todaysSession ? todaysSession.totalItemsSold : 0}</strong>
              </div>
              <div className="hero-stat">
                <span>
                  <FaHistory /> Transactions
                </span>
                <strong>{todaysSession ? todaysSession.saleCount : 0}</strong>
              </div>
            </div>
          </section>

          <section className="metrics-grid">
            <div className="metric-card">
              <span className="metric-label"><FaExclamationTriangle /> Low stock SKUs</span>
              <strong>{lowStockItems.length}</strong>
              <p>{lowStockItems.length ? 'Time to print replenishments.' : 'Healthy safety stock across catalog.'}</p>
            </div>
            <div className="metric-card">
              <span className="metric-label"><FaChartLine /> 7-day revenue</span>
              <strong>{formatCurrency(sevenDayRevenue)}</strong>
              <p>{sevenDayItems} items sold in the past week.</p>
            </div>
            <div className="metric-card">
              <span className="metric-label"><FaHistory /> Latest sale</span>
              {lastSale ? (
                <>
                  <strong>{formatCurrency(lastSale.totalPrice)}</strong>
                  <p>
                    {lastSale.quantity}× {lastSale.itemName} • {formatDateTime(lastSale.soldAt)}
                  </p>
                  <p className="muted" style={{ margin: 0 }}>
                    {lastSale.paymentMethod === 'cash'
                      ? `Cash${lastSale.changeGiven != null ? ` • Change ${formatCurrency(lastSale.changeGiven)}` : ''}`
                      : 'Card'}
                  </p>
                </>
              ) : (
                <>
                  <strong>—</strong>
                  <p>No sales recorded yet.</p>
                </>
              )}
            </div>
          </section>

          <section className="dashboard-section-grid">
            <div className="card section-card">
              <div className="section-card-header">
                <h2><FaExclamationTriangle style={{ marginRight: '0.5rem' }} />Low Stock Alerts</h2>
                <span className="badge">{lowStockItems.length} flagged</span>
              </div>
              {lowStockItems.length ? (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockItems.map(item => (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td>
                            <span className={`badge ${item.quantity === 0 ? 'warning' : ''}`}>
                              {item.quantity}
                            </span>
                          </td>
                          <td>{formatCurrency(item.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state muted">All inventory items look healthy.</div>
              )}
            </div>

            <div className="card section-card">
              <div className="section-card-header">
                <h2><FaChartLine style={{ marginRight: '0.5rem' }} />Recent Sales Trend</h2>
                <span className="muted">Past 7 days</span>
              </div>
              {recentTrend.length ? (
                <ul className="list-unstyled trend-list">
                  {recentTrend.map(day => (
                    <li key={day.date}>
                      <span>{formatDate(day.date)}</span>
                      <div>
                        <strong>{formatCurrency(day.totalRevenue)}</strong>
                        <span className="muted">{day.totalItems} items</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-state muted">Not enough data to plot a trend yet.</div>
              )}
            </div>

            <div className="card section-card">
              <div className="section-card-header">
                <h2><FaHistory style={{ marginRight: '0.5rem' }} />Latest Activity</h2>
                <span className="muted">Most recent sales</span>
              </div>
              {recentSales.length ? (
                <ul className="list-unstyled activity-list">
                  {recentSales.map(sale => (
                    <li key={sale.id}>
                      <div>
                        <strong>{sale.quantity}× {sale.itemName}</strong>
                        <span className="muted">{sale.sessionTitle}</span>
                      </div>
                      <div>
                        <span>{formatCurrency(sale.totalPrice)}</span>
                        <span className="muted">{formatDateTime(sale.soldAt)}</span>
                        <span className="muted">
                          {sale.paymentMethod === 'cash'
                            ? `Cash${sale.changeGiven != null ? ` • Change ${formatCurrency(sale.changeGiven)}` : ''}`
                            : 'Card'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-state muted">No recent sales recorded.</div>
              )}
            </div>
          </section>

          <section className="card dashboard-reset">
            <div>
              <h2>Maintenance</h2>
              <p className="muted">
                Need to start fresh? This removes every item, sales session, transaction, and uploaded image.
                Perfect for demos or when resetting after a big event.
              </p>
            </div>
            <button
              type="button"
              className="button danger"
              onClick={handleReset}
              disabled={resetting}
            >
              <FaRedoAlt />
              {resetting ? 'Resetting…' : 'Reset Database'}
            </button>
          </section>
        </>
      )}
    </div>
  );
}

export default DashboardPage;
