const dayjs = require('dayjs');
const { getDb } = require('../db');
const { fromCents } = require('../utils/currency');
const { getSalesForSession } = require('./salesService');

function mapSession(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    location: row.location,
    sessionDate: row.session_date,
    status: row.status,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    weather: row.weather,
    totalRevenue: fromCents(row.total_revenue_cents || 0),
    totalItemsSold: Number(row.total_items || 0),
    saleCount: Number(row.sale_count || 0),
  };
}

function listSessions() {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT
      sess.*, 
      COALESCE(SUM(s.total_price_cents), 0) AS total_revenue_cents,
      COALESCE(SUM(s.quantity), 0) AS total_items,
      COUNT(s.id) AS sale_count
    FROM sales_sessions sess
    LEFT JOIN sales s ON s.session_id = sess.id
    GROUP BY sess.id
    ORDER BY sess.started_at DESC
  `);
  return stmt.all().map(mapSession);
}

function getSessionById(sessionId) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT
      sess.*, 
      COALESCE(SUM(s.total_price_cents), 0) AS total_revenue_cents,
      COALESCE(SUM(s.quantity), 0) AS total_items,
      COUNT(s.id) AS sale_count
    FROM sales_sessions sess
    LEFT JOIN sales s ON s.session_id = sess.id
    WHERE sess.id = ?
    GROUP BY sess.id
  `);
  const row = stmt.get(sessionId);
  if (!row) {
    return null;
  }
  const session = mapSession(row);
  session.sales = getSalesForSession(sessionId);
  return session;
}

function createSession({ title, location, sessionDate, weather }) {
  const db = getDb();
  const normalizedSessionDate = sessionDate || dayjs().format('YYYY-MM-DD');
  const stmt = db.prepare(`
    INSERT INTO sales_sessions (title, location, session_date, status, started_at, weather)
    VALUES (?, ?, ?, 'open', datetime('now'), ?)
  `);
  const info = stmt.run(title, location || null, normalizedSessionDate, weather || null);
  return getSessionById(info.lastInsertRowid);
}

function updateSessionWeather(sessionId, weather) {
  const db = getDb();
  db.prepare(`
    UPDATE sales_sessions
    SET weather = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(weather || null, sessionId);
  return getSessionById(sessionId);
}

function closeSession(sessionId) {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM sales_sessions WHERE id = ?').get(sessionId);
  if (!existing) {
    throw Object.assign(new Error('Session not found'), { status: 404 });
  }

  if (existing.status === 'closed') {
    return getSessionById(sessionId);
  }

  db.prepare(`
    UPDATE sales_sessions
    SET status = 'closed', ended_at = datetime('now')
    WHERE id = ?
  `).run(sessionId);

  return getSessionById(sessionId);
}

function getActiveSessions() {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT
      sess.*, 
      COALESCE(SUM(s.total_price_cents), 0) AS total_revenue_cents,
      COALESCE(SUM(s.quantity), 0) AS total_items,
      COUNT(s.id) AS sale_count
    FROM sales_sessions sess
    LEFT JOIN sales s ON s.session_id = sess.id
    WHERE sess.status = 'open'
    GROUP BY sess.id
    ORDER BY sess.started_at DESC
  `);
  return stmt.all().map(mapSession);
}

module.exports = {
  listSessions,
  getSessionById,
  createSession,
  closeSession,
  getActiveSessions,
  updateSessionWeather,
};
