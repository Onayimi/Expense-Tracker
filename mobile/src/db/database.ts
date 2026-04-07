import { type SQLiteDatabase } from 'expo-sqlite';

/**
 * Called once by SQLiteProvider when the app first opens.
 * Creates tables if they don't exist, then seeds the 3 default funding sources.
 * Safe to run every launch — CREATE TABLE IF NOT EXISTS and INSERT OR IGNORE
 * mean it won't duplicate anything.
 */
export async function initDatabase(db: SQLiteDatabase): Promise<void> {
  // WAL mode gives better read/write performance on mobile
  await db.execAsync('PRAGMA journal_mode = WAL;');

  // Funding sources table — where the money comes from
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS funding_sources (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL UNIQUE,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Expenses table — every expense entry
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS expenses (
      id                   INTEGER PRIMARY KEY AUTOINCREMENT,
      date                 TEXT    NOT NULL,
      title                TEXT    NOT NULL,
      category             TEXT    NOT NULL,
      amount               REAL    NOT NULL,
      funding_source_id    INTEGER NOT NULL REFERENCES funding_sources(id),
      funds_type           TEXT    NOT NULL DEFAULT 'MINE',
      expense_for          TEXT    NOT NULL DEFAULT 'ME',
      notes                TEXT,
      borrowed_status      TEXT,
      repaid_date          TEXT,
      reimbursement_status TEXT,
      reimbursement_date   TEXT,
      created_at           TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at           TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Seed the 3 default funding sources
  // INSERT OR IGNORE = skip silently if the name already exists
  await db.runAsync(
    `INSERT OR IGNORE INTO funding_sources (name, is_default) VALUES (?, 1)`,
    ['Personal']
  );
  await db.runAsync(
    `INSERT OR IGNORE INTO funding_sources (name, is_default) VALUES (?, 1)`,
    ['House']
  );
  await db.runAsync(
    `INSERT OR IGNORE INTO funding_sources (name, is_default) VALUES (?, 1)`,
    ['Loan from Hubby']
  );
}
