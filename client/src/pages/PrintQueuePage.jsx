import { useEffect, useMemo, useState } from 'react';
import {
  fetchPrintQueue,
  createPrintJob,
  updatePrintJob,
  deletePrintJob,
  fetchFilamentSpools,
} from '../api/api';
import { formatDate } from '../utils/formatters';
import { API_BASE } from '../api/api';
import {
  FaPlus,
  FaSave,
  FaTimes,
  FaPlay,
  FaStop,
  FaCheckCircle,
  FaTrashAlt,
  FaCloudDownloadAlt,
  FaExternalLinkAlt,
  FaEdit,
} from 'react-icons/fa';

const JOB_STATUSES = [
  { value: 'queued', label: 'Queued', badgeClass: 'status-new' },
  { value: 'printing', label: 'Printing', badgeClass: 'status-progress' },
  { value: 'paused', label: 'Paused', badgeClass: 'status-warning' },
  { value: 'completed', label: 'Completed', badgeClass: 'status-ready' },
  { value: 'cancelled', label: 'Cancelled', badgeClass: 'status-cancelled' },
];

const ASSIGNEES = ['Ezra', 'Dylan'];

const drynessLabels = {
  vacuum: 'Vacuum Sealed',
  sealed: 'Brand New Sealed',
  open: 'Open',
};

const emptyForm = {
  id: null,
  itemName: '',
  filamentSpoolId: '',
  quantity: 1,
  assignee: '',
  notes: '',
  modelUrl: '',
  dueDate: '',
  priority: 0,
  status: 'queued',
};

const modelExtensions = ['.stl', '.obj', '.3mf', '.amf', '.zip'];

function PrintQueuePage() {
  const [jobs, setJobs] = useState([]);
  const [spools, setSpools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [spoolLoading, setSpoolLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [formState, setFormState] = useState({ ...emptyForm });
  const [modelFile, setModelFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const filteredJobs = useMemo(() => {
    let filtered = [...jobs];
    if (statusFilter) {
      filtered = filtered.filter(job => job.status === statusFilter);
    }
    if (assigneeFilter) {
      filtered = filtered.filter(job => job.assignee === assigneeFilter);
    }
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      filtered = filtered.filter(job =>
        [job.itemName, job.notes, job.assignee]
          .filter(Boolean)
          .some(value => value.toLowerCase().includes(term)));
    }
    return filtered;
  }, [jobs, statusFilter, assigneeFilter, search]);

  const loadJobs = async (filters = {}) => {
    try {
      setLoading(true);
      const data = await fetchPrintQueue(filters);
      setJobs(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSpools = async () => {
    try {
      setSpoolLoading(true);
      const data = await fetchFilamentSpools();
      setSpools(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSpoolLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
    loadSpools();
  }, []);

  const handleFilterChange = async () => {
    await loadJobs({
      status: statusFilter || undefined,
      assignee: assigneeFilter || undefined,
    });
  };

  useEffect(() => {
    handleFilterChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, assigneeFilter]);

  const handleFormChange = event => {
    const { name, value } = event.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleCreate = () => {
    setFormState({ ...emptyForm });
    setModelFile(null);
    setFormOpen(true);
  };

  const handleEdit = job => {
    setFormState({
      id: job.id,
      itemName: job.itemName,
      filamentSpoolId: job.filamentSpoolId ? String(job.filamentSpoolId) : '',
      quantity: job.quantity,
      assignee: job.assignee || '',
      notes: job.notes || '',
      modelUrl: job.modelUrl || '',
      dueDate: job.dueDate ? job.dueDate.substring(0, 10) : '',
      priority: job.priority ?? 0,
      status: job.status || 'queued',
    });
    setModelFile(null);
    setFormOpen(true);
  };

  const resetForm = () => {
    setFormState({ ...emptyForm });
    setModelFile(null);
    setFormOpen(false);
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (!formState.itemName) {
      alert('Item name is required.');
      return;
    }

    const payload = {
      itemName: formState.itemName,
      filamentSpoolId: formState.filamentSpoolId ? Number(formState.filamentSpoolId) : null,
      quantity: Number(formState.quantity) > 0 ? Number(formState.quantity) : 1,
      assignee: formState.assignee || undefined,
      notes: formState.notes || undefined,
      modelUrl: formState.modelUrl || undefined,
      dueDate: formState.dueDate || undefined,
      priority: formState.priority !== '' ? Number(formState.priority) : 0,
      status: formState.status,
    };

    try {
      setSaving(true);
      if (formState.id) {
        await updatePrintJob(formState.id, payload, modelFile || undefined);
      } else {
        await createPrintJob(payload, modelFile || undefined);
      }
      resetForm();
      await loadJobs({
        status: statusFilter || undefined,
        assignee: assigneeFilter || undefined,
      });
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (job, status) => {
    try {
      await updatePrintJob(job.id, { status });
      await loadJobs({
        status: statusFilter || undefined,
        assignee: assigneeFilter || undefined,
      });
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleDelete = async job => {
    const confirmed = window.confirm('Remove this job from the queue?');
    if (!confirmed) return;
    try {
      await deletePrintJob(job.id);
      await loadJobs({
        status: statusFilter || undefined,
        assignee: assigneeFilter || undefined,
      });
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const modelDownloadUrl = job => {
    if (!job.modelFilePath) return null;
    return `${API_BASE.replace(/\/api\/?$/, '')}/${job.modelFilePath}`;
  };

  return (
    <div>
      <div className="page-header">
        <h1>Print Queue</h1>
        <div className="inline-actions" style={{ gap: '0.75rem' }}>
          <select
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value)}
            className="status-filter"
          >
            <option value="">All statuses</option>
            {JOB_STATUSES.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
          <select
            value={assigneeFilter}
            onChange={event => setAssigneeFilter(event.target.value)}
            className="status-filter"
          >
            <option value="">All assignees</option>
            {ASSIGNEES.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search jobs"
            className="status-filter"
          />
          <button type="button" className="button" onClick={handleCreate}>
            <FaPlus />
            New Job
          </button>
        </div>
      </div>

      {loading && <div className="card">Loading print queue...</div>}
      {error && (
        <div className="card">
          <strong>Error:</strong> {error.message}
        </div>
      )}

      {!loading && !error && (
        <div className="card">
          {filteredJobs.length ? (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Filament</th>
                    <th>Qty</th>
                    <th>Assignee</th>
                    <th>Due</th>
                    <th>Status</th>
                    <th>Model</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map(job => {
                    const statusMeta = JOB_STATUSES.find(s => s.value === job.status) || JOB_STATUSES[0];
                    return (
                      <tr key={job.id}>
                        <td>
                          <div><strong>{job.itemName}</strong></div>
                          {job.notes && (
                            <div className="muted" style={{ fontSize: '0.85rem' }}>{job.notes}</div>
                          )}
                          <div className="muted" style={{ fontSize: '0.7rem' }}>
                            Created {formatDate(job.createdAt)}
                          </div>
                        </td>
                        <td>
                          {job.filament ? (
                            <div className="muted" style={{ fontSize: '0.85rem', display: 'grid', gap: '0.25rem' }}>
                              <span>{[job.filament.material, job.filament.color, job.filament.brand].filter(Boolean).join(' • ')}</span>
                              {job.filament.owner && <span>Owner: {job.filament.owner}</span>}
                              {job.filament.dryness && <span>{drynessLabels[job.filament.dryness] || job.filament.dryness}</span>}
                            </div>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                        <td>{job.quantity}</td>
                        <td>{job.assignee || '—'}</td>
                        <td>{job.dueDate ? formatDate(job.dueDate) : '—'}</td>
                        <td>
                          <span className={`badge ${statusMeta.badgeClass}`}>{statusMeta.label}</span>
                        </td>
                        <td>
                          <div className="inline-actions">
                            {job.modelUrl && (
                              <a
                                href={job.modelUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="button ghost"
                                title="Open model link"
                              >
                                <FaExternalLinkAlt />
                              </a>
                            )}
                            {job.modelFilePath && (
                              <a
                                href={modelDownloadUrl(job)}
                                className="button ghost"
                                download
                                title="Download model"
                              >
                                <FaCloudDownloadAlt />
                              </a>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="inline-actions">
                            {job.status !== 'printing' && job.status !== 'completed' && job.status !== 'cancelled' && (
                              <button type="button" className="button secondary" onClick={() => handleStatusChange(job, 'printing')}>
                                <FaPlay />
                                Start
                              </button>
                            )}
                            {job.status === 'printing' && (
                              <button type="button" className="button ghost" onClick={() => handleStatusChange(job, 'paused')}>
                                <FaStop />
                                Pause
                              </button>
                            )}
                            {job.status !== 'completed' && (
                              <button type="button" className="button ghost" onClick={() => handleStatusChange(job, 'completed')}>
                                <FaCheckCircle />
                                Done
                              </button>
                            )}
                            <button type="button" className="button secondary" onClick={() => handleEdit(job)}>
                              <FaEdit />
                              Edit
                            </button>
                            <button type="button" className="button danger" onClick={() => handleDelete(job)}>
                              <FaTrashAlt />
                              Delete
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
            <div className="empty-state">Print queue is empty. Add the next job to get started.</div>
          )}
        </div>
      )}

      {formOpen && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h2>{formState.id ? 'Update Job' : 'New Print Job'}</h2>
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="form-row">
              <label htmlFor="itemName">Item Name</label>
              <input
                id="itemName"
                name="itemName"
                required
                value={formState.itemName}
                onChange={handleFormChange}
              />
            </div>
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <div className="form-row">
                <label htmlFor="filamentSpoolId">Filament</label>
                <select
                  id="filamentSpoolId"
                  name="filamentSpoolId"
                  value={formState.filamentSpoolId}
                  onChange={handleFormChange}
                  disabled={spoolLoading && spools.length === 0}
                >
                  <option value="">Select spool</option>
                  {spools.map(spool => (
                    <option key={spool.id} value={spool.id}>
                      {[spool.material, spool.color, spool.brand].filter(Boolean).join(' • ') || `Spool #${spool.id}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label htmlFor="quantity">Quantity</label>
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={formState.quantity}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="form-row">
                <label htmlFor="assignee">Assignee</label>
                <select id="assignee" name="assignee" value={formState.assignee} onChange={handleFormChange}>
                  <option value="">Unassigned</option>
                  {ASSIGNEES.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label htmlFor="dueDate">Due Date</label>
                <input id="dueDate" name="dueDate" type="date" value={formState.dueDate} onChange={handleFormChange} />
              </div>
              <div className="form-row">
                <label htmlFor="priority">Priority</label>
                <input
                  id="priority"
                  name="priority"
                  type="number"
                  step="1"
                  value={formState.priority}
                  onChange={handleFormChange}
                />
              </div>
              <div className="form-row">
                <label htmlFor="status">Status</label>
                <select id="status" name="status" value={formState.status} onChange={handleFormChange}>
                  {JOB_STATUSES.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="modelUrl">Model Link</label>
              <input
                id="modelUrl"
                name="modelUrl"
                type="url"
                value={formState.modelUrl}
                onChange={handleFormChange}
                placeholder="https://..."
              />
            </div>
            <div className="form-row">
              <label htmlFor="modelFile">Upload Model ({modelExtensions.join(', ')})</label>
              <input
                id="modelFile"
                type="file"
                accept={modelExtensions.join(',')}
                onChange={event => setModelFile(event.target.files?.[0] || null)}
              />
              {modelFile && (
                <div className="muted">Selected: {modelFile.name}</div>
              )}
            </div>
            <div className="form-row">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                rows="3"
                value={formState.notes}
                onChange={handleFormChange}
                placeholder="Printer settings, warnings, cleanup steps..."
              />
            </div>
            <div className="inline-actions">
              <button type="submit" className="button" disabled={saving}>
                <FaSave />
                {saving ? 'Saving...' : 'Save Job'}
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

export default PrintQueuePage;
