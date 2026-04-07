/**
 * All database query functions.
 * Every screen imports from here — no raw SQL anywhere else.
 */

import { type SQLiteDatabase } from 'expo-sqlite';
import type {
  Expense,
  FundingSource,
  FundsType,
  ExpenseFor,
  DashboardSummary,
} from '../types';
import { todayString } from '../utils/helpers';

// ── Funding Sources ────────────────────────────────────────────────────────

/** Get all funding sources, defaults first then alphabetical */
export async function getAllFundingSources(
  db: SQLiteDatabase
): Promise<FundingSource[]> {
  return db.getAllAsync<FundingSource>(
    `SELECT * FROM funding_sources ORDER BY is_default DESC, name ASC`
  );
}

/** Add a new custom funding source */
export async function addFundingSource(
  db: SQLiteDatabase,
  name: string
): Promise<void> {
  await db.runAsync(
    `INSERT INTO funding_sources (name, is_default) VALUES (?, 0)`,
    [name.trim()]
  );
}

// ── Expenses ───────────────────────────────────────────────────────────────

/** Get all expenses (with funding source name), newest first. Optional filters. */
export async function getAllExpenses(
  db: SQLiteDatabase,
  filters?: {
    category?: string;
    fundingSourceId?: number;
    expenseFor?: string;
    fundsType?: string;
    search?: string;
  }
): Promise<Expense[]> {
  // Base query — always join to get the funding source name
  let sql = `
    SELECT e.*, fs.name AS funding_source_name
    FROM expenses e
    JOIN funding_sources fs ON e.funding_source_id = fs.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (filters?.category) {
    sql += ` AND e.category = ?`;
    params.push(filters.category);
  }
  if (filters?.fundingSourceId) {
    sql += ` AND e.funding_source_id = ?`;
    params.push(filters.fundingSourceId);
  }
  if (filters?.expenseFor) {
    sql += ` AND e.expense_for = ?`;
    params.push(filters.expenseFor);
  }
  if (filters?.fundsType) {
    sql += ` AND e.funds_type = ?`;
    params.push(filters.fundsType);
  }
  if (filters?.search) {
    sql += ` AND (e.title LIKE ? OR e.notes LIKE ?)`;
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  sql += ` ORDER BY e.date DESC, e.id DESC`;

  return db.getAllAsync<Expense>(sql, params);
}

/** Get a single expense by ID */
export async function getExpenseById(
  db: SQLiteDatabase,
  id: number
): Promise<Expense | null> {
  return db.getFirstAsync<Expense>(
    `SELECT e.*, fs.name AS funding_source_name
     FROM expenses e
     JOIN funding_sources fs ON e.funding_source_id = fs.id
     WHERE e.id = ?`,
    [id]
  );
}

/**
 * Create a new expense.
 *
 * Core logic applied here:
 *   funds_type = 'BORROWED'  →  borrowed_status = 'OUTSTANDING'
 *   expense_for = 'HUBBY'   →  reimbursement_status = 'OWES_ME'
 *   Both can apply at the same time.
 */
export async function createExpense(
  db: SQLiteDatabase,
  data: {
    date: string;
    title: string;
    category: string;
    amount: number;
    funding_source_id: number;
    funds_type: FundsType;
    expense_for: ExpenseFor;
    notes: string;
  }
): Promise<void> {
  // Auto-set statuses
  const borrowedStatus = data.funds_type === 'BORROWED' ? 'OUTSTANDING' : null;
  const reimbursementStatus = data.expense_for === 'HUBBY' ? 'OWES_ME' : null;

  await db.runAsync(
    `INSERT INTO expenses (
       date, title, category, amount, funding_source_id,
       funds_type, expense_for, notes,
       borrowed_status, reimbursement_status,
       updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
      data.date,
      data.title.trim(),
      data.category,
      data.amount,
      data.funding_source_id,
      data.funds_type,
      data.expense_for,
      data.notes.trim() || null,
      borrowedStatus,
      reimbursementStatus,
    ]
  );
}

/**
 * Update an existing expense.
 *
 * Status preservation rules:
 *   - If fundsType changes to MINE → clear borrowed fields entirely
 *   - If fundsType stays BORROWED and was already REPAID → keep REPAID + repaid_date
 *   - If fundsType stays BORROWED and was OUTSTANDING → keep OUTSTANDING
 *   - Same logic applies for the hubby reimbursement fields
 */
export async function updateExpense(
  db: SQLiteDatabase,
  id: number,
  data: {
    date: string;
    title: string;
    category: string;
    amount: number;
    funding_source_id: number;
    funds_type: FundsType;
    expense_for: ExpenseFor;
    notes: string;
  }
): Promise<void> {
  // Fetch current state so we can preserve settled statuses
  const current = await db.getFirstAsync<Expense>(
    `SELECT * FROM expenses WHERE id = ?`,
    [id]
  );
  if (!current) throw new Error(`Expense with id ${id} not found`);

  // Work out the new borrowed status
  let borrowedStatus: string | null = null;
  let repaidDate: string | null = null;
  if (data.funds_type === 'BORROWED') {
    if (current.borrowed_status === 'REPAID') {
      // Already repaid — preserve that status and date
      borrowedStatus = 'REPAID';
      repaidDate = current.repaid_date;
    } else {
      borrowedStatus = 'OUTSTANDING';
    }
  }

  // Work out the new reimbursement status
  let reimbursementStatus: string | null = null;
  let reimbursementDate: string | null = null;
  if (data.expense_for === 'HUBBY') {
    if (current.reimbursement_status === 'PAID_BACK') {
      // Already paid back — preserve that status and date
      reimbursementStatus = 'PAID_BACK';
      reimbursementDate = current.reimbursement_date;
    } else {
      reimbursementStatus = 'OWES_ME';
    }
  }

  await db.runAsync(
    `UPDATE expenses SET
       date = ?, title = ?, category = ?, amount = ?,
       funding_source_id = ?, funds_type = ?, expense_for = ?,
       notes = ?,
       borrowed_status = ?, repaid_date = ?,
       reimbursement_status = ?, reimbursement_date = ?,
       updated_at = datetime('now')
     WHERE id = ?`,
    [
      data.date,
      data.title.trim(),
      data.category,
      data.amount,
      data.funding_source_id,
      data.funds_type,
      data.expense_for,
      data.notes.trim() || null,
      borrowedStatus,
      repaidDate,
      reimbursementStatus,
      reimbursementDate,
      id,
    ]
  );
}

/** Delete an expense permanently */
export async function deleteExpense(
  db: SQLiteDatabase,
  id: number
): Promise<void> {
  await db.runAsync(`DELETE FROM expenses WHERE id = ?`, [id]);
}

/**
 * Mark a borrowed expense as REPAID.
 * Sets borrowed_status = 'REPAID' and records today as the repaid_date.
 */
export async function markAsRepaid(
  db: SQLiteDatabase,
  id: number
): Promise<void> {
  await db.runAsync(
    `UPDATE expenses
     SET borrowed_status = 'REPAID',
         repaid_date = ?,
         updated_at = datetime('now')
     WHERE id = ? AND funds_type = 'BORROWED'`,
    [todayString(), id]
  );
}

/**
 * Mark a hubby expense as PAID_BACK.
 * Sets reimbursement_status = 'PAID_BACK' and records today as the reimbursement_date.
 */
export async function markAsPaidBack(
  db: SQLiteDatabase,
  id: number
): Promise<void> {
  await db.runAsync(
    `UPDATE expenses
     SET reimbursement_status = 'PAID_BACK',
         reimbursement_date = ?,
         updated_at = datetime('now')
     WHERE id = ? AND expense_for = 'HUBBY'`,
    [todayString(), id]
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────

/** Compute all summary stats for the dashboard screen */
export async function getDashboardSummary(
  db: SQLiteDatabase
): Promise<DashboardSummary> {
  const all = await db.getAllAsync<Expense>(
    `SELECT e.*, fs.name AS funding_source_name
     FROM expenses e
     JOIN funding_sources fs ON e.funding_source_id = fs.id`
  );

  // Total overview
  const totalExpenses = all.length;
  const totalAmount = all.reduce((sum, e) => sum + e.amount, 0);

  // Group by category
  const catMap = new Map<string, number>();
  for (const e of all) {
    catMap.set(e.category, (catMap.get(e.category) ?? 0) + e.amount);
  }
  const byCategory = [...catMap.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  // Group by funding source
  const srcMap = new Map<string, number>();
  for (const e of all) {
    const name = e.funding_source_name ?? 'Unknown';
    srcMap.set(name, (srcMap.get(name) ?? 0) + e.amount);
  }
  const bySource = [...srcMap.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);

  // Borrowed money
  const outstandingBorrowed = all.filter(e => e.borrowed_status === 'OUTSTANDING');
  const repaidBorrowed = all.filter(e => e.borrowed_status === 'REPAID');
  const totalOutstandingBorrowed = outstandingBorrowed.reduce((s, e) => s + e.amount, 0);
  const totalRepaidBorrowed = repaidBorrowed.reduce((s, e) => s + e.amount, 0);

  // Hubby reimbursements
  const hubbyOwesMe = all.filter(e => e.reimbursement_status === 'OWES_ME');
  const hubbyPaidBack = all.filter(e => e.reimbursement_status === 'PAID_BACK');
  const totalHubbyOwesMe = hubbyOwesMe.reduce((s, e) => s + e.amount, 0);
  const totalReimbursementsReceived = hubbyPaidBack.reduce((s, e) => s + e.amount, 0);

  return {
    totalExpenses,
    totalAmount,
    totalOutstandingBorrowed,
    totalRepaidBorrowed,
    totalHubbyOwesMe,
    totalReimbursementsReceived,
    byCategory,
    bySource,
    outstandingBorrowed,
    hubbyOwesMe,
  };
}
