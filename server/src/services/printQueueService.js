const { getDb } = require('../db');

const JOB_STATUSES = ['queued', 'printing', 'paused', 'completed', 'cancelled'];

function mapJob(row) {
  if (!row) return null;
  return {
    id: row.id,
    itemName: row.item_name,
    filamentSpoolId: row.filament_spool_id,
    filament: row.filament_spool_id && (row.spool_material || row.spool_color || row.spool_brand || row.spool_owner || row.spool_dryness)
      ? {
          id: row.filament_spool_id,
          material: row.spool_material,
          color: row.spool_color,
          brand: row.spool_brand,
          owner: row.spool_owner,
          dryness: row.spool_dryness,
        }
      : null,
    quantity: row.quantity,
    assignee: row.assignee,
    notes: row.notes,
    modelUrl: row.model_url,
    modelFilePath: row.model_file_path,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function listJobs({ status, assignee } = {}) {
  const db = getDb();
  const conditions = [];
  const params = [];

  if (status && JOB_STATUSES.includes(status)) {
    conditions.push('pq.status = ?');
    params.push(status);
  }

  if (assignee) {
    conditions.push('pq.assignee = ?');
    params.push(assignee);
  }

  let query = `
    SELECT
      pq.*,
      fs.material AS spool_material,
      fs.color AS spool_color,
      fs.brand AS spool_brand,
      fs.owner AS spool_owner,
      fs.dryness AS spool_dryness
    FROM print_queue_jobs pq
    LEFT JOIN filament_spools fs ON fs.id = pq.filament_spool_id
  `;

  if (conditions.length) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ' ORDER BY pq.priority DESC, pq.created_at ASC';

  const rows = db.prepare(query).all(...params);
  return rows.map(mapJob);
}

function getJobById(id) {
  const db = getDb();
  const row = db.prepare(`
    SELECT
      pq.*,
      fs.material AS spool_material,
      fs.color AS spool_color,
      fs.brand AS spool_brand,
      fs.owner AS spool_owner,
      fs.dryness AS spool_dryness
    FROM print_queue_jobs pq
    LEFT JOIN filament_spools fs ON fs.id = pq.filament_spool_id
    WHERE pq.id = ?
  `).get(id);
  return mapJob(row);
}

function createJob(data) {
  if (!data.itemName) {
    throw Object.assign(new Error('Item name is required'), { status: 400 });
  }
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO print_queue_jobs (
      item_name,
      filament_spool_id,
      quantity,
      assignee,
      notes,
      model_url,
      model_file_path,
      status,
      priority,
      due_date
    ) VALUES (@item_name, @filament_spool_id, @quantity, @assignee, @notes, @model_url, @model_file_path, @status, @priority, @due_date)
  `);

  const info = stmt.run({
    item_name: data.itemName,
    filament_spool_id: data.filamentSpoolId || null,
    quantity: data.quantity && Number(data.quantity) > 0 ? Number(data.quantity) : 1,
    assignee: data.assignee || null,
    notes: data.notes || null,
    model_url: data.modelUrl || null,
    model_file_path: data.modelFilePath || null,
    status: data.status && JOB_STATUSES.includes(data.status) ? data.status : 'queued',
    priority: data.priority != null ? Number(data.priority) : 0,
    due_date: data.dueDate || null,
  });

  return getJobById(info.lastInsertRowid);
}

function updateJob(id, data) {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM print_queue_jobs WHERE id = ?').get(id);
  if (!existing) {
    throw Object.assign(new Error('Job not found'), { status: 404 });
  }

  const updated = {
    item_name: data.itemName ?? existing.item_name,
    filament_spool_id: data.filamentSpoolId !== undefined ? data.filamentSpoolId : existing.filament_spool_id,
    quantity: data.quantity !== undefined ? Number(data.quantity) : existing.quantity,
    assignee: data.assignee !== undefined ? data.assignee : existing.assignee,
    notes: data.notes !== undefined ? data.notes : existing.notes,
    model_url: data.modelUrl !== undefined ? data.modelUrl : existing.model_url,
    model_file_path: data.modelFilePath !== undefined ? data.modelFilePath : existing.model_file_path,
    status: data.status && JOB_STATUSES.includes(data.status) ? data.status : existing.status,
    priority: data.priority !== undefined ? Number(data.priority) : existing.priority,
    due_date: data.dueDate !== undefined ? data.dueDate : existing.due_date,
    id,
  };

  db.prepare(`
    UPDATE print_queue_jobs
    SET
      item_name = @item_name,
      filament_spool_id = @filament_spool_id,
      quantity = @quantity,
      assignee = @assignee,
      notes = @notes,
      model_url = @model_url,
      model_file_path = @model_file_path,
      status = @status,
      priority = @priority,
      due_date = @due_date,
      updated_at = datetime('now')
    WHERE id = @id
  `).run(updated);

  return getJobById(id);
}

function deleteJob(id) {
  const db = getDb();
  const existing = db.prepare('SELECT model_file_path FROM print_queue_jobs WHERE id = ?').get(id);
  if (!existing) {
    throw Object.assign(new Error('Job not found'), { status: 404 });
  }
  db.prepare('DELETE FROM print_queue_jobs WHERE id = ?').run(id);
  return existing;
}

module.exports = {
  JOB_STATUSES,
  listJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
};
