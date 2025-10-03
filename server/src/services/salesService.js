const { getDb } = require('../db');
const { toCents, fromCents } = require('../utils/currency');

function mapSale(row) {
  if (!row) return null;
  return {
    id: row.id,
    sessionId: row.session_id,
    itemId: row.item_id,
    quantity: row.quantity,
    unitPrice: fromCents(row.unit_price_cents),
    totalPrice: fromCents(row.total_price_cents),
    soldAt: row.sold_at,
    note: row.note,
    itemName: row.item_name,
    sessionTitle: row.session_title,
    paymentMethod: row.payment_method || 'card',
    cashReceived: row.cash_received_cents != null ? fromCents(row.cash_received_cents) : null,
    changeGiven: row.change_given_cents != null ? fromCents(row.change_given_cents) : null,
  };
}

function getSaleById(id) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT
      s.*, 
      i.name AS item_name,
      sess.title AS session_title
    FROM sales s
    LEFT JOIN items i ON i.id = s.item_id
    LEFT JOIN sales_sessions sess ON sess.id = s.session_id
    WHERE s.id = ?
  `);
  const row = stmt.get(id);
  return mapSale(row);
}

function getSessionById(sessionId) {
  const db = getDb();
  return db.prepare('SELECT * FROM sales_sessions WHERE id = ?').get(sessionId);
}

function getItemByIdRaw(itemId) {
  const db = getDb();
  return db.prepare('SELECT * FROM items WHERE id = ?').get(itemId);
}

function recordSale({
  sessionId,
  itemId,
  quantity,
  unitPrice,
  note = null,
  paymentMethod = 'card',
  cashReceived,
  soldAt,
}) {
  const db = getDb();

  const session = getSessionById(sessionId);
  if (!session) {
    throw Object.assign(new Error('Sales session not found'), { status: 404 });
  }

  if (session.status !== 'open') {
    throw Object.assign(new Error('Cannot log sales to a closed session'), { status: 400 });
  }

  const item = getItemByIdRaw(itemId);
  if (!item) {
    throw Object.assign(new Error('Item not found'), { status: 404 });
  }

  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty <= 0) {
    throw Object.assign(new Error('Quantity must be a positive integer'), { status: 400 });
  }

  if (item.quantity < qty) {
    throw Object.assign(new Error('Insufficient stock for this sale'), { status: 400 });
  }

  const unitPriceCents = unitPrice !== undefined && unitPrice !== null
    ? toCents(unitPrice)
    : item.price_cents;

  const totalPriceCents = unitPriceCents * qty;

  const normalizedMethod = (paymentMethod || 'card').toLowerCase() === 'cash' ? 'cash' : 'card';
  let cashReceivedCents = null;
  let changeGivenCents = null;

  if (normalizedMethod === 'cash') {
    if (cashReceived === undefined || cashReceived === null || cashReceived === '') {
      throw Object.assign(new Error('Cash amount received is required for cash payments'), { status: 400 });
    }
    cashReceivedCents = toCents(cashReceived);
    if (cashReceivedCents < totalPriceCents) {
      throw Object.assign(new Error('Cash received is less than the sale total'), { status: 400 });
    }
    changeGivenCents = cashReceivedCents - totalPriceCents;
  }

  let soldAtTimestamp = null;
  if (soldAt) {
    const parsed = new Date(soldAt);
    if (Number.isNaN(parsed.getTime())) {
      throw Object.assign(new Error('Invalid soldAt value provided'), { status: 400 });
    }
    soldAtTimestamp = parsed.toISOString();
  }

  const insertSaleStmt = db.prepare(`
    INSERT INTO sales (
      session_id,
      item_id,
      quantity,
      unit_price_cents,
      total_price_cents,
      note,
      payment_method,
      cash_received_cents,
      change_given_cents,
      sold_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now')))
  `);

  const updateItemStmt = db.prepare(`
    UPDATE items
    SET quantity = quantity - ?, updated_at = datetime('now')
    WHERE id = ?
  `);

  const insertAdjustmentStmt = db.prepare(`
    INSERT INTO inventory_adjustments (item_id, delta, reason, reference_type, reference_id)
    VALUES (?, ?, 'sale', 'sale', ?)
  `);

  const run = db.transaction(() => {
    const info = insertSaleStmt.run(
      sessionId,
      itemId,
      qty,
      unitPriceCents,
      totalPriceCents,
      note,
      normalizedMethod,
      cashReceivedCents,
      changeGivenCents,
      soldAtTimestamp,
    );
    updateItemStmt.run(qty, itemId);
    insertAdjustmentStmt.run(itemId, -qty, info.lastInsertRowid);
    return info.lastInsertRowid;
  });

  const saleId = run();
  return getSaleById(saleId);
}

function getSalesForSession(sessionId) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT
      s.*, i.name AS item_name, sess.title AS session_title
    FROM sales s
    LEFT JOIN items i ON i.id = s.item_id
    LEFT JOIN sales_sessions sess ON sess.id = s.session_id
    WHERE s.session_id = ?
    ORDER BY s.sold_at DESC
  `);
  const rows = stmt.all(sessionId);
  return rows.map(mapSale);
}

function getRecentSales({ days = 7, limit = 10 } = {}) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT
      s.*, i.name AS item_name, sess.title AS session_title
    FROM sales s
    LEFT JOIN items i ON i.id = s.item_id
    LEFT JOIN sales_sessions sess ON sess.id = s.session_id
    WHERE s.sold_at >= datetime('now', ?)
    ORDER BY s.sold_at DESC
    LIMIT ?
  `);
  const rows = stmt.all(`-${days} days`, limit);
  return rows.map(mapSale);
}

function getAggregatedSalesByDay(days = 7) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT
      DATE(sold_at) AS sale_date,
      SUM(total_price_cents) AS total_revenue_cents,
      SUM(quantity) AS total_items
    FROM sales
    WHERE sold_at >= datetime('now', ?)
    GROUP BY DATE(sold_at)
    ORDER BY sale_date ASC
  `);
  return stmt.all(`-${days} days`).map(row => ({
    date: row.sale_date,
    totalRevenue: fromCents(row.total_revenue_cents || 0),
    totalItems: Number(row.total_items || 0),
  }));
}

module.exports = {
  recordSale,
  getSaleById,
  getSalesForSession,
  getRecentSales,
  getAggregatedSalesByDay,
};
