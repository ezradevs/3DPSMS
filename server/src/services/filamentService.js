const { getDb } = require('../db');
const { toCents, fromCents } = require('../utils/currency');

function mapSpool(row) {
  if (!row) return null;
  return {
    id: row.id,
    material: row.material,
    color: row.color,
    brand: row.brand,
    owner: row.owner,
    dryness: row.dryness,
    weightGrams: row.weight_grams,
    remainingGrams: row.remaining_grams,
    cost: row.cost_cents != null ? fromCents(row.cost_cents) : null,
    purchaseDate: row.purchase_date,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    usageCount: row.usage_count ? Number(row.usage_count) : 0,
    usedGramsTotal: row.used_grams_total ? Number(row.used_grams_total) : 0,
  };
}

function listSpools() {
  const db = getDb();
  const rows = db.prepare(`
    SELECT
      s.*,
      COUNT(u.id) AS usage_count,
      COALESCE(SUM(u.used_grams), 0) AS used_grams_total
    FROM filament_spools s
    LEFT JOIN filament_usage_logs u ON u.spool_id = s.id
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `).all();
  return rows.map(mapSpool);
}

function getSpoolById(id) {
  const db = getDb();
  const row = db.prepare(
    `SELECT s.*, COUNT(u.id) AS usage_count, COALESCE(SUM(u.used_grams), 0) AS used_grams_total
     FROM filament_spools s
     LEFT JOIN filament_usage_logs u ON u.spool_id = s.id
     WHERE s.id = ?
     GROUP BY s.id`
  ).get(id);
  return mapSpool(row);
}

function createSpool(data) {
  if (!data.material) {
    throw Object.assign(new Error('Material is required'), { status: 400 });
  }
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO filament_spools (
      material,
      color,
      brand,
      owner,
       dryness,
      weight_grams,
      remaining_grams,
      cost_cents,
      purchase_date,
      notes
    ) VALUES (@material, @color, @brand, @owner, @dryness, @weight_grams, @remaining_grams, @cost_cents, @purchase_date, @notes)
  `);
  const info = stmt.run({
    material: data.material,
    color: data.color || null,
    brand: data.brand || null,
    owner: data.owner || null,
    dryness: data.dryness || null,
    weight_grams: data.weightGrams != null ? Number(data.weightGrams) : 0,
    remaining_grams: data.remainingGrams != null ? Number(data.remainingGrams) : (data.weightGrams != null ? Number(data.weightGrams) : 0),
    cost_cents: data.cost != null ? toCents(data.cost) : null,
    purchase_date: data.purchaseDate || null,
    notes: data.notes || null,
  });
  return getSpoolById(info.lastInsertRowid);
}

function updateSpool(id, data) {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM filament_spools WHERE id = ?').get(id);
  if (!existing) {
    throw Object.assign(new Error('Spool not found'), { status: 404 });
  }

  const updated = {
    material: data.material ?? existing.material,
    color: data.color !== undefined ? data.color : existing.color,
    brand: data.brand !== undefined ? data.brand : existing.brand,
    weight_grams: data.weightGrams !== undefined ? Number(data.weightGrams) : existing.weight_grams,
    remaining_grams: data.remainingGrams !== undefined ? Number(data.remainingGrams) : existing.remaining_grams,
    cost_cents: data.cost !== undefined ? (data.cost != null ? toCents(data.cost) : null) : existing.cost_cents,
    purchase_date: data.purchaseDate !== undefined ? data.purchaseDate : existing.purchase_date,
    notes: data.notes !== undefined ? data.notes : existing.notes,
    owner: data.owner !== undefined ? data.owner : existing.owner,
    dryness: data.dryness !== undefined ? data.dryness : existing.dryness,
    id,
  };

  db.prepare(`
    UPDATE filament_spools
    SET
      material = @material,
      color = @color,
      brand = @brand,
      owner = @owner,
      dryness = @dryness,
      weight_grams = @weight_grams,
      remaining_grams = @remaining_grams,
      cost_cents = @cost_cents,
      purchase_date = @purchase_date,
      notes = @notes,
      updated_at = datetime('now')
    WHERE id = @id
  `).run(updated);

  return getSpoolById(id);
}

function logUsage(spoolId, { usedGrams, reason, reference }) {
  const db = getDb();
  const spool = db.prepare('SELECT * FROM filament_spools WHERE id = ?').get(spoolId);
  if (!spool) {
    throw Object.assign(new Error('Spool not found'), { status: 404 });
  }

  const grams = Number(usedGrams);
  if (!Number.isFinite(grams) || grams <= 0) {
    throw Object.assign(new Error('Used grams must be a positive number'), { status: 400 });
  }

  if (spool.remaining_grams < grams) {
    throw Object.assign(new Error('Not enough filament remaining on this spool'), { status: 400 });
  }

  const insertUsage = db.prepare(`
    INSERT INTO filament_usage_logs (spool_id, used_grams, reason, reference)
    VALUES (?, ?, ?, ?)
  `);

  const updateSpoolStmt = db.prepare(`
    UPDATE filament_spools
    SET remaining_grams = remaining_grams - ?, updated_at = datetime('now')
    WHERE id = ?
  `);

  const logId = db.transaction(() => {
    const info = insertUsage.run(spoolId, grams, reason || null, reference || null);
    updateSpoolStmt.run(grams, spoolId);
    return info.lastInsertRowid;
  })();

  return {
    usage: db.prepare('SELECT * FROM filament_usage_logs WHERE id = ?').get(logId),
    spool: getSpoolById(spoolId),
  };
}

function listUsage(spoolId) {
  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM filament_usage_logs
    WHERE spool_id = ?
    ORDER BY created_at DESC
  `).all(spoolId);
  return rows.map(row => ({
    id: row.id,
    spoolId: row.spool_id,
    usedGrams: row.used_grams,
    reason: row.reason,
    reference: row.reference,
    createdAt: row.created_at,
  }));
}

module.exports = {
  listSpools,
  getSpoolById,
  createSpool,
  updateSpool,
  logUsage,
  listUsage,
};
