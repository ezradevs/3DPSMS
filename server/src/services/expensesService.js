const { getDb } = require('../db');
const { toCents, fromCents } = require('../utils/currency');

function mapExpense(row) {
  if (!row) return null;
  return {
    id: row.id,
    description: row.description,
    amount: fromCents(row.amount_cents),
    category: row.category,
    payer: row.payer,
    assignee: row.assignee,
    expenseDate: row.expense_date,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function listExpenses({ payer, assignee, category } = {}) {
  const db = getDb();
  const conditions = [];
  const params = [];

  if (payer) {
    conditions.push('payer = ?');
    params.push(payer);
  }
  if (assignee) {
    conditions.push('assignee = ?');
    params.push(assignee);
  }
  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }

  let query = 'SELECT * FROM expenses';
  if (conditions.length) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }
  query += ' ORDER BY expense_date DESC, created_at DESC';

  return db.prepare(query).all(...params).map(mapExpense);
}

function createExpense(data) {
  if (!data.description) {
    throw Object.assign(new Error('Description is required'), { status: 400 });
  }
  if (data.amount == null) {
    throw Object.assign(new Error('Amount is required'), { status: 400 });
  }
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO expenses (
      description,
      amount_cents,
      category,
      payer,
      assignee,
      expense_date,
      notes
    )
    VALUES (@description, @amount_cents, @category, @payer, @assignee, @expense_date, @notes)
  `);

  const info = stmt.run({
    description: data.description,
    amount_cents: toCents(data.amount),
    category: data.category || null,
    payer: data.payer || null,
    assignee: data.assignee || null,
    expense_date: data.expenseDate || null,
    notes: data.notes || null,
  });

  return getExpenseById(info.lastInsertRowid);
}

function getExpenseById(id) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
  return mapExpense(row);
}

function updateExpense(id, data) {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
  if (!existing) {
    throw Object.assign(new Error('Expense not found'), { status: 404 });
  }

  const updated = {
    description: data.description ?? existing.description,
    amount_cents: data.amount !== undefined ? toCents(data.amount) : existing.amount_cents,
    category: data.category !== undefined ? data.category : existing.category,
    payer: data.payer !== undefined ? data.payer : existing.payer,
    assignee: data.assignee !== undefined ? data.assignee : existing.assignee,
    expense_date: data.expenseDate !== undefined ? data.expenseDate : existing.expense_date,
    notes: data.notes !== undefined ? data.notes : existing.notes,
    id,
  };

  db.prepare(`
    UPDATE expenses
    SET
      description = @description,
      amount_cents = @amount_cents,
      category = @category,
      payer = @payer,
      assignee = @assignee,
      expense_date = @expense_date,
      notes = @notes,
      updated_at = datetime('now')
    WHERE id = @id
  `).run(updated);

  return getExpenseById(id);
}

function deleteExpense(id) {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM expenses WHERE id = ?').get(id);
  if (!existing) {
    throw Object.assign(new Error('Expense not found'), { status: 404 });
  }
  db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
}

module.exports = {
  listExpenses,
  createExpense,
  getExpenseById,
  updateExpense,
  deleteExpense,
};
