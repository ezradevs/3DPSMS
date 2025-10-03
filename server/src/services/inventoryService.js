const { getDb } = require('../db');
const { toCents, fromCents } = require('../utils/currency');
const { deleteFileSafe } = require('../utils/files');

function mapItem(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: fromCents(row.price_cents),
    quantity: row.quantity,
    imagePath: row.image_path,
    defaultFilamentId: row.default_filament_id,
    defaultFilament: row.default_filament_id && (row.filament_material || row.filament_brand || row.filament_color || row.filament_owner || row.filament_dryness)
      ? {
          id: row.default_filament_id,
          material: row.filament_material,
          color: row.filament_color,
          brand: row.filament_brand,
          owner: row.filament_owner,
          dryness: row.filament_dryness,
        }
      : null,
    tag: row.tag,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    totalSold: row.total_sold ? Number(row.total_sold) : 0,
    totalRevenue: fromCents(row.total_revenue_cents || 0),
  };
}

function listItems() {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT
      i.id,
      i.name,
      i.description,
      i.price_cents,
      i.quantity,
      i.image_path,
      i.default_filament_id,
      i.tag,
      fs.material AS filament_material,
      fs.color AS filament_color,
      fs.brand AS filament_brand,
      fs.owner AS filament_owner,
      fs.dryness AS filament_dryness,
      i.tag,
      i.created_at,
      i.updated_at,
      COALESCE(SUM(s.quantity), 0) AS total_sold,
      COALESCE(SUM(s.total_price_cents), 0) AS total_revenue_cents
    FROM items i
    LEFT JOIN filament_spools fs ON fs.id = i.default_filament_id
    LEFT JOIN sales s ON s.item_id = i.id
    GROUP BY i.id
    ORDER BY i.name COLLATE NOCASE ASC
  `);
  const rows = stmt.all();
  return rows.map(mapItem);
}

function getItemById(id) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT
      i.*, 
      fs.material AS filament_material,
      fs.color AS filament_color,
      fs.brand AS filament_brand,
      fs.owner AS filament_owner,
      fs.dryness AS filament_dryness,
      COALESCE((SELECT SUM(quantity) FROM sales WHERE item_id = i.id), 0) AS total_sold,
      COALESCE((SELECT SUM(total_price_cents) FROM sales WHERE item_id = i.id), 0) AS total_revenue_cents
    FROM items i
    LEFT JOIN filament_spools fs ON fs.id = i.default_filament_id
    WHERE i.id = ?
  `);
  const row = stmt.get(id);
  if (!row) {
    return null;
  }
  return mapItem(row);
}

function createItem(data) {
  const db = getDb();
  const priceCents = toCents(data.price ?? 0);
  const quantity = data.quantity ?? 0;
  const stmt = db.prepare(`
    INSERT INTO items (name, description, price_cents, quantity, image_path, default_filament_id, tag)
    VALUES (@name, @description, @price_cents, @quantity, @image_path, @default_filament_id, @tag)
  `);

  const info = stmt.run({
    name: data.name,
    description: data.description || null,
    price_cents: priceCents,
    quantity,
    image_path: data.imagePath || null,
    default_filament_id: data.defaultFilamentId || null,
    tag: data.tag || null,
  });

  return getItemById(info.lastInsertRowid);
}

function updateItem(id, data) {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
  if (!existing) {
    throw Object.assign(new Error('Item not found'), { status: 404 });
  }

  let shouldDeleteOldImage = false;
  let nextImagePath = existing.image_path;
  if (data.imagePath !== undefined) {
    nextImagePath = data.imagePath;
    if (existing.image_path && existing.image_path !== data.imagePath) {
      shouldDeleteOldImage = true;
    }
  }

  const updates = {
    name: data.name ?? existing.name,
    description: data.description !== undefined ? data.description : existing.description,
    price_cents: data.price !== undefined ? toCents(data.price) : existing.price_cents,
    quantity: data.quantity !== undefined ? data.quantity : existing.quantity,
    image_path: nextImagePath,
    default_filament_id: data.defaultFilamentId !== undefined ? data.defaultFilamentId : existing.default_filament_id,
    tag: data.tag !== undefined ? data.tag : existing.tag,
    id,
  };

  db.prepare(`
    UPDATE items
    SET
      name = @name,
      description = @description,
      price_cents = @price_cents,
      quantity = @quantity,
      image_path = @image_path,
      default_filament_id = @default_filament_id,
      tag = @tag,
      updated_at = datetime('now')
    WHERE id = @id
  `).run(updates);

  if (shouldDeleteOldImage) {
    deleteFileSafe(existing.image_path);
  }

  return getItemById(id);
}

function adjustQuantity({ itemId, delta, reason = 'manual', referenceType = null, referenceId = null }) {
  const db = getDb();

  const current = db.prepare('SELECT quantity FROM items WHERE id = ?').get(itemId);
  if (!current) {
    throw Object.assign(new Error('Item not found'), { status: 404 });
  }

  const newQuantity = current.quantity + delta;
  if (newQuantity < 0) {
    throw Object.assign(new Error('Insufficient stock for adjustment'), { status: 400 });
  }

  db.prepare(`
    UPDATE items
    SET quantity = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(newQuantity, itemId);

  db.prepare(`
    INSERT INTO inventory_adjustments (item_id, delta, reason, reference_type, reference_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(itemId, delta, reason, referenceType, referenceId);

  return getItemById(itemId);
}

function getLowStockItems(threshold = 5) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT
      i.*,
      fs.material AS filament_material,
      fs.color AS filament_color,
      fs.brand AS filament_brand,
      fs.owner AS filament_owner,
      fs.dryness AS filament_dryness
    FROM items i
    LEFT JOIN filament_spools fs ON fs.id = i.default_filament_id
    WHERE i.quantity <= ?
    ORDER BY i.quantity ASC, i.name COLLATE NOCASE ASC
  `);
  const rows = stmt.all(threshold);
  return rows.map(row => mapItem({ ...row, total_sold: 0, total_revenue_cents: 0 }));
}

module.exports = {
  listItems,
  getItemById,
  createItem,
  updateItem,
  adjustQuantity,
  getLowStockItems,
};
