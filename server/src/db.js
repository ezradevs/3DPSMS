const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

let dbInstance;

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', '3dpsms.sqlite');

function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

function runMigrations(db) {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price_cents INTEGER NOT NULL DEFAULT 0,
      quantity INTEGER NOT NULL DEFAULT 0,
      image_path TEXT,
      default_filament_id INTEGER,
      tag TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (default_filament_id) REFERENCES filament_spools(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS sales_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      location TEXT,
      session_date TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      ended_at TEXT,
      weather TEXT
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price_cents INTEGER NOT NULL,
      total_price_cents INTEGER NOT NULL,
      sold_at TEXT NOT NULL DEFAULT (datetime('now')),
      note TEXT,
      payment_method TEXT DEFAULT 'card',
      cash_received_cents INTEGER,
      change_given_cents INTEGER,
      FOREIGN KEY (session_id) REFERENCES sales_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS inventory_adjustments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      delta INTEGER NOT NULL,
      reason TEXT,
      reference_type TEXT,
      reference_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS custom_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      contact_info TEXT,
      source TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      due_date TEXT,
      request_details TEXT,
      notes TEXT,
      quoted_price_cents INTEGER,
      deposit_paid_cents INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS filament_spools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material TEXT NOT NULL,
      color TEXT,
      brand TEXT,
      owner TEXT,
      dryness TEXT,
      weight_grams INTEGER NOT NULL DEFAULT 0,
      remaining_grams INTEGER NOT NULL DEFAULT 0,
      cost_cents INTEGER,
      purchase_date TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS filament_usage_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      spool_id INTEGER NOT NULL,
      used_grams INTEGER NOT NULL,
      reason TEXT,
      reference TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (spool_id) REFERENCES filament_spools(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS print_queue_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_name TEXT NOT NULL,
      filament_spool_id INTEGER,
      quantity INTEGER NOT NULL DEFAULT 1,
      assignee TEXT,
      notes TEXT,
      model_url TEXT,
      model_file_path TEXT,
      status TEXT NOT NULL DEFAULT 'queued',
      priority INTEGER NOT NULL DEFAULT 0,
      due_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (filament_spool_id) REFERENCES filament_spools(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      category TEXT,
      payer TEXT,
      assignee TEXT,
      expense_date TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_sales_session ON sales(session_id);
    CREATE INDEX IF NOT EXISTS idx_sales_item ON sales(item_id);
    CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_item ON inventory_adjustments(item_id);
    CREATE INDEX IF NOT EXISTS idx_custom_orders_status ON custom_orders(status);
    CREATE INDEX IF NOT EXISTS idx_filament_spools_material ON filament_spools(material);
    CREATE INDEX IF NOT EXISTS idx_filament_usage_spool ON filament_usage_logs(spool_id);
    CREATE INDEX IF NOT EXISTS idx_print_queue_status ON print_queue_jobs(status);
    CREATE INDEX IF NOT EXISTS idx_print_queue_assignee ON print_queue_jobs(assignee);
    CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
    CREATE INDEX IF NOT EXISTS idx_expenses_payer ON expenses(payer);
  `);

  ensureSalesColumns(db);
  ensureSalesSessionColumns(db);
  ensureItemsColumns(db);
  ensureCustomOrdersColumns(db);
  ensureFilamentColumns(db);
  ensurePrintQueueColumns(db);
  ensureExpensesColumns(db);
}

function columnExists(db, tableName, columnName) {
  const stmt = db.prepare(`PRAGMA table_info(${tableName})`);
  const columns = stmt.all();
  return columns.some(column => column.name === columnName);
}

function ensureSalesColumns(db) {
  if (!columnExists(db, 'sales', 'payment_method')) {
    db.prepare("ALTER TABLE sales ADD COLUMN payment_method TEXT DEFAULT 'card'").run();
  }
  if (!columnExists(db, 'sales', 'cash_received_cents')) {
    db.prepare('ALTER TABLE sales ADD COLUMN cash_received_cents INTEGER').run();
  }
  if (!columnExists(db, 'sales', 'change_given_cents')) {
    db.prepare('ALTER TABLE sales ADD COLUMN change_given_cents INTEGER').run();
  }
  if (!columnExists(db, 'sales', 'sold_at')) {
    db.prepare("ALTER TABLE sales ADD COLUMN sold_at TEXT NOT NULL DEFAULT (datetime('now'))").run();
  }
}

function ensureSalesSessionColumns(db) {
  if (!columnExists(db, 'sales_sessions', 'weather')) {
    db.prepare('ALTER TABLE sales_sessions ADD COLUMN weather TEXT').run();
  }
}

function ensureItemsColumns(db) {
  if (!columnExists(db, 'items', 'default_filament_id')) {
    db.prepare('ALTER TABLE items ADD COLUMN default_filament_id INTEGER').run();
  }
  if (!columnExists(db, 'items', 'tag')) {
    db.prepare('ALTER TABLE items ADD COLUMN tag TEXT').run();
  }
}

function ensureCustomOrdersColumns(db) {
  const requiredColumns = [
    { name: 'customer_name', definition: 'TEXT' },
    { name: 'contact_info', definition: 'TEXT' },
    { name: 'source', definition: 'TEXT' },
    { name: 'status', definition: "TEXT NOT NULL DEFAULT 'new'" },
    { name: 'due_date', definition: 'TEXT' },
    { name: 'request_details', definition: 'TEXT' },
    { name: 'notes', definition: 'TEXT' },
    { name: 'quoted_price_cents', definition: 'INTEGER' },
    { name: 'deposit_paid_cents', definition: 'INTEGER' },
    { name: 'updated_at', definition: "TEXT NOT NULL DEFAULT (datetime('now'))" },
  ];

  requiredColumns.forEach(column => {
    if (!columnExists(db, 'custom_orders', column.name)) {
      db.prepare(`ALTER TABLE custom_orders ADD COLUMN ${column.name} ${column.definition}`).run();
    }
  });
}

function ensureFilamentColumns(db) {
  const spoolColumns = [
    { name: 'material', definition: 'TEXT' },
    { name: 'color', definition: 'TEXT' },
    { name: 'brand', definition: 'TEXT' },
    { name: 'owner', definition: 'TEXT' },
    { name: 'dryness', definition: 'TEXT' },
    { name: 'weight_grams', definition: 'INTEGER NOT NULL DEFAULT 0' },
    { name: 'remaining_grams', definition: 'INTEGER NOT NULL DEFAULT 0' },
    { name: 'cost_cents', definition: 'INTEGER' },
    { name: 'purchase_date', definition: 'TEXT' },
    { name: 'notes', definition: 'TEXT' },
    { name: 'updated_at', definition: "TEXT NOT NULL DEFAULT (datetime('now'))" },
  ];

  spoolColumns.forEach(column => {
    if (!columnExists(db, 'filament_spools', column.name)) {
      db.prepare(`ALTER TABLE filament_spools ADD COLUMN ${column.name} ${column.definition}`).run();
    }
  });

  const usageColumns = [
    { name: 'spool_id', definition: 'INTEGER' },
    { name: 'used_grams', definition: 'INTEGER NOT NULL DEFAULT 0' },
    { name: 'reason', definition: 'TEXT' },
    { name: 'reference', definition: 'TEXT' },
  ];

  usageColumns.forEach(column => {
    if (!columnExists(db, 'filament_usage_logs', column.name)) {
      db.prepare(`ALTER TABLE filament_usage_logs ADD COLUMN ${column.name} ${column.definition}`).run();
    }
  });
}

function ensurePrintQueueColumns(db) {
  const jobColumns = [
    { name: 'item_name', definition: 'TEXT' },
    { name: 'filament_spool_id', definition: 'INTEGER' },
    { name: 'quantity', definition: 'INTEGER NOT NULL DEFAULT 1' },
    { name: 'assignee', definition: 'TEXT' },
    { name: 'notes', definition: 'TEXT' },
    { name: 'model_url', definition: 'TEXT' },
    { name: 'model_file_path', definition: 'TEXT' },
    { name: 'status', definition: "TEXT NOT NULL DEFAULT 'queued'" },
    { name: 'priority', definition: 'INTEGER NOT NULL DEFAULT 0' },
    { name: 'due_date', definition: 'TEXT' },
    { name: 'updated_at', definition: "TEXT NOT NULL DEFAULT (datetime('now'))" },
  ];

  jobColumns.forEach(column => {
    if (!columnExists(db, 'print_queue_jobs', column.name)) {
      db.prepare(`ALTER TABLE print_queue_jobs ADD COLUMN ${column.name} ${column.definition}`).run();
    }
  });
}

function ensureExpensesColumns(db) {
  const expenseColumns = [
    { name: 'description', definition: 'TEXT' },
    { name: 'amount_cents', definition: 'INTEGER NOT NULL DEFAULT 0' },
    { name: 'category', definition: 'TEXT' },
    { name: 'payer', definition: 'TEXT' },
    { name: 'assignee', definition: 'TEXT' },
    { name: 'expense_date', definition: 'TEXT' },
    { name: 'notes', definition: 'TEXT' },
    { name: 'updated_at', definition: "TEXT NOT NULL DEFAULT (datetime('now'))" },
  ];

  expenseColumns.forEach(column => {
    if (!columnExists(db, 'expenses', column.name)) {
      db.prepare(`ALTER TABLE expenses ADD COLUMN ${column.name} ${column.definition}`).run();
    }
  });
}

function initDatabase() {
  if (!dbInstance) {
    ensureDirectoryExists(path.dirname(DB_PATH));
    dbInstance = new Database(DB_PATH);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');
    runMigrations(dbInstance);
  }

  return dbInstance;
}

function getDb() {
  if (!dbInstance) {
    throw new Error('Database not initialised. Call initDatabase() first.');
  }

  return dbInstance;
}

function closeDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

function resetDatabase() {
  closeDatabase();
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }
  const walPath = `${DB_PATH}-wal`;
  const shmPath = `${DB_PATH}-shm`;
  if (fs.existsSync(walPath)) {
    fs.unlinkSync(walPath);
  }
  if (fs.existsSync(shmPath)) {
    fs.unlinkSync(shmPath);
  }
  initDatabase();
}

module.exports = {
  initDatabase,
  getDb,
  closeDatabase,
  resetDatabase,
  DB_PATH,
};
