import { useEffect, useMemo, useState } from 'react';
import { FaPlus, FaSave, FaTimes, FaTrashAlt, FaEdit } from 'react-icons/fa';
import {
  fetchExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../api/api';
import { formatCurrency, formatDate } from '../utils/formatters';

const PAYERS = ['Business', 'Ezra', 'Dylan'];
const ASSIGNEES = ['Ezra', 'Dylan'];
const CATEGORIES = ['Market Stall', 'Filament', 'Plants', 'Display/Decor', 'Equipment', 'Other'];

const emptyForm = {
  id: null,
  description: '',
  amount: '',
  category: '',
  payer: 'Business',
  assignee: '',
  expenseDate: '',
  notes: '',
};

function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formState, setFormState] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ payer: '', assignee: '', category: '' });
  const [search, setSearch] = useState('');

  const filteredExpenses = useMemo(() => {
    let result = [...expenses];
    if (filters.payer) result = result.filter(expense => expense.payer === filters.payer);
    if (filters.assignee) result = result.filter(expense => expense.assignee === filters.assignee);
    if (filters.category) result = result.filter(expense => expense.category === filters.category);
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      result = result.filter(expense =>
        [expense.description, expense.notes]
          .filter(Boolean)
          .some(value => value.toLowerCase().includes(term))
      );
    }
    return result;
  }, [expenses, filters, search]);

  const loadExpenses = async (params = {}) => {
    try {
      setLoading(true);
      const data = await fetchExpenses(params);
      setExpenses(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  useEffect(() => {
    loadExpenses({
      payer: filters.payer || undefined,
      assignee: filters.assignee || undefined,
      category: filters.category || undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.payer, filters.assignee, filters.category]);

  const totalAmount = useMemo(
    () => filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0),
    [filteredExpenses],
  );

  const handleFormChange = event => {
    const { name, value } = event.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleCreate = () => {
    setFormState({ ...emptyForm });
    setFormOpen(true);
  };

  const handleEdit = expense => {
    setFormState({
      id: expense.id,
      description: expense.description,
      amount: expense.amount != null ? expense.amount : '',
      category: expense.category || '',
      payer: expense.payer || 'Business',
      assignee: expense.assignee || '',
      expenseDate: expense.expenseDate ? expense.expenseDate.substring(0, 10) : '',
      notes: expense.notes || '',
    });
    setFormOpen(true);
  };

  const resetForm = () => {
    setFormState({ ...emptyForm });
    setFormOpen(false);
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (!formState.description) {
      alert('Description is required.');
      return;
    }
    if (formState.amount === '' || Number(formState.amount) <= 0) {
      alert('Enter a valid amount.');
      return;
    }

    const payload = {
      description: formState.description,
      amount: Number(formState.amount),
      category: formState.category || undefined,
      payer: formState.payer || undefined,
      assignee: formState.assignee || undefined,
      expenseDate: formState.expenseDate || undefined,
      notes: formState.notes || undefined,
    };

    try {
      setSaving(true);
      if (formState.id) {
        await updateExpense(formState.id, payload);
      } else {
        await createExpense(payload);
      }
      resetForm();
      await loadExpenses({
        payer: filters.payer || undefined,
        assignee: filters.assignee || undefined,
        category: filters.category || undefined,
      });
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async expense => {
    const confirmed = window.confirm('Delete this expense entry?');
    if (!confirmed) return;
    try {
      await deleteExpense(expense.id);
      await loadExpenses({
        payer: filters.payer || undefined,
        assignee: filters.assignee || undefined,
        category: filters.category || undefined,
      });
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Expenses</h1>
        <div className="inline-actions" style={{ gap: '0.75rem' }}>
          <select
            value={filters.payer}
            onChange={event => setFilters(prev => ({ ...prev, payer: event.target.value }))}
            className="status-filter"
          >
            <option value="">All payers</option>
            {PAYERS.map(payer => (
              <option key={payer} value={payer}>{payer}</option>
            ))}
          </select>
          <select
            value={filters.assignee}
            onChange={event => setFilters(prev => ({ ...prev, assignee: event.target.value }))}
            className="status-filter"
          >
            <option value="">All assignees</option>
            {ASSIGNEES.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <select
            value={filters.category}
            onChange={event => setFilters(prev => ({ ...prev, category: event.target.value }))}
            className="status-filter"
          >
            <option value="">All categories</option>
            {CATEGORIES.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search expenses"
            className="status-filter"
          />
          <button type="button" className="button" onClick={handleCreate}>
            <FaPlus />
            New Expense
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <strong>Total: {formatCurrency(totalAmount)}</strong>
      </div>

      {loading && <div className="card">Loading expenses...</div>}
  {error && (
    <div className="card">
      <strong>Error:</strong> {error.message}
    </div>
  )}

      {!loading && !error && (
        <div className="card">
          {filteredExpenses.length ? (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Payer</th>
                    <th>Assignee</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map(expense => (
                    <tr key={expense.id}>
                      <td>{expense.expenseDate ? formatDate(expense.expenseDate) : '—'}</td>
                      <td><strong>{expense.description}</strong></td>
                      <td>{expense.category || '—'}</td>
                      <td>{formatCurrency(expense.amount)}</td>
                      <td>{expense.payer || '—'}</td>
                      <td>{expense.assignee || '—'}</td>
                      <td>{expense.notes || '—'}</td>
                      <td>
                        <div className="inline-actions">
                          <button type="button" className="button secondary" onClick={() => handleEdit(expense)}>
                            <FaEdit />
                            Edit
                          </button>
                          <button type="button" className="button danger" onClick={() => handleDelete(expense)}>
                            <FaTrashAlt />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">No expenses recorded yet.</div>
          )}
        </div>
      )}

      {formOpen && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h2>{formState.id ? 'Update Expense' : 'New Expense'}</h2>
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="form-row">
              <label htmlFor="description">Description</label>
              <input
                id="description"
                name="description"
                required
                value={formState.description}
                onChange={handleFormChange}
              />
            </div>
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <div className="form-row">
                <label htmlFor="amount">Amount</label>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={formState.amount}
                  onChange={handleFormChange}
                  placeholder="0.00"
                />
              </div>
              <div className="form-row">
                <label htmlFor="category">Category</label>
                <select id="category" name="category" value={formState.category} onChange={handleFormChange}>
                  <option value="">Select</option>
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label htmlFor="payer">Payer</label>
                <select id="payer" name="payer" value={formState.payer} onChange={handleFormChange}>
                  {PAYERS.map(payer => (
                    <option key={payer} value={payer}>{payer}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label htmlFor="assignee">Assignee</label>
                <select id="assignee" name="assignee" value={formState.assignee} onChange={handleFormChange}>
                  <option value="">None</option>
                  {ASSIGNEES.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label htmlFor="expenseDate">Date</label>
                <input
                  id="expenseDate"
                  name="expenseDate"
                  type="date"
                  value={formState.expenseDate}
                  onChange={handleFormChange}
                />
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                rows="3"
                value={formState.notes}
                onChange={handleFormChange}
                placeholder="Details, receipt numbers, etc."
              />
            </div>
            <div className="inline-actions">
              <button type="submit" className="button" disabled={saving}>
                <FaSave />
                {saving ? 'Saving...' : 'Save Expense'}
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

export default ExpensesPage;
