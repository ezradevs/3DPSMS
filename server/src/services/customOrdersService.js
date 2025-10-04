const { getDb } = require('../db');
const { toCents, fromCents } = require('../utils/currency');

const ORDER_STATUSES = ['new', 'in_progress', 'ready', 'delivered', 'cancelled'];

function mapOrder(row) {
  if (!row) return null;
  return {
    id: row.id,
    customerName: row.customer_name,
    contactInfo: row.contact_info,
    source: row.source,
    status: row.status,
    dueDate: row.due_date,
    requestDetails: row.request_details,
    notes: row.notes,
    quotedPrice: row.quoted_price_cents != null ? fromCents(row.quoted_price_cents) : null,
    depositPaid: row.deposit_paid_cents != null ? fromCents(row.deposit_paid_cents) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function listOrders({ status } = {}) {
  const db = getDb();
  let query = `
    SELECT * FROM custom_orders
  `;
  const params = [];
  if (status && ORDER_STATUSES.includes(status)) {
    query += ' WHERE status = ?';
    params.push(status);
  }
  query += ' ORDER BY created_at DESC';
  const rows = db.prepare(query).all(...params);
  return rows.map(mapOrder);
}

function getOrderById(id) {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM custom_orders WHERE id = ?');
  return mapOrder(stmt.get(id));
}

function createOrder(data) {
  if (!data.customerName) {
    throw Object.assign(new Error('Customer name is required'), { status: 400 });
  }
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO custom_orders (
      customer_name,
      contact_info,
      source,
      status,
      due_date,
      request_details,
      notes,
      quoted_price_cents,
      deposit_paid_cents
    )
    VALUES (@customer_name, @contact_info, @source, @status, @due_date, @request_details, @notes, @quoted_price_cents, @deposit_paid_cents)
  `);
  const info = stmt.run({
    customer_name: data.customerName,
    contact_info: data.contactInfo || null,
    source: data.source || null,
    status: ORDER_STATUSES.includes(data.status) ? data.status : 'new',
    due_date: data.dueDate || null,
    request_details: data.requestDetails || null,
    notes: data.notes || null,
    quoted_price_cents: data.quotedPrice != null ? toCents(data.quotedPrice) : null,
    deposit_paid_cents: data.depositPaid != null ? toCents(data.depositPaid) : null,
  });
  return getOrderById(info.lastInsertRowid);
}

function updateOrder(id, data) {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM custom_orders WHERE id = ?').get(id);
  if (!existing) {
    throw Object.assign(new Error('Order not found'), { status: 404 });
  }

  const updated = {
    customer_name: data.customerName ?? existing.customer_name,
    contact_info: data.contactInfo !== undefined ? data.contactInfo : existing.contact_info,
    source: data.source !== undefined ? data.source : existing.source,
    status: data.status && ORDER_STATUSES.includes(data.status) ? data.status : existing.status,
    due_date: data.dueDate !== undefined ? data.dueDate : existing.due_date,
    request_details: data.requestDetails !== undefined ? data.requestDetails : existing.request_details,
    notes: data.notes !== undefined ? data.notes : existing.notes,
    quoted_price_cents: data.quotedPrice !== undefined
      ? (data.quotedPrice != null ? toCents(data.quotedPrice) : null)
      : existing.quoted_price_cents,
    deposit_paid_cents: data.depositPaid !== undefined
      ? (data.depositPaid != null ? toCents(data.depositPaid) : null)
      : existing.deposit_paid_cents,
    id,
  };

  db.prepare(`
    UPDATE custom_orders
    SET
      customer_name = @customer_name,
      contact_info = @contact_info,
      source = @source,
      status = @status,
      due_date = @due_date,
      request_details = @request_details,
      notes = @notes,
      quoted_price_cents = @quoted_price_cents,
      deposit_paid_cents = @deposit_paid_cents,
      updated_at = datetime('now')
    WHERE id = @id
  `).run(updated);

  return getOrderById(id);
}

function deleteOrder(id) {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM custom_orders WHERE id = ?').get(id);
  if (!existing) {
    throw Object.assign(new Error('Order not found'), { status: 404 });
  }
  db.prepare('DELETE FROM custom_orders WHERE id = ?').run(id);
}

module.exports = {
  ORDER_STATUSES,
  listOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
};
