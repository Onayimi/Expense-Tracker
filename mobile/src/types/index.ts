// ── Status string unions ───────────────────────────────────────────────────

export type FundsType = 'MINE' | 'BORROWED';
export type ExpenseFor = 'ME' | 'HOUSEHOLD' | 'HUBBY';
export type BorrowedStatus = 'OUTSTANDING' | 'REPAID';
export type ReimbursementStatus = 'OWES_ME' | 'PAID_BACK';

// ── Expense categories ─────────────────────────────────────────────────────

export const CATEGORIES = [
  'Food & Groceries',
  'Dining Out',
  'Transport',
  'Utilities',
  'Healthcare',
  'Health & Fitness',
  'Home & Maintenance',
  'Shopping',
  'Clothing',
  'Entertainment',
  'Education',
  'Personal Care',
  'Pets',
  'Travel',
  'Gifts',
  'Subscriptions',
  'Other',
] as const;

// ── Data models (match the SQLite column names) ────────────────────────────

export interface FundingSource {
  id: number;
  name: string;
  is_default: number; // SQLite stores booleans as 0 or 1
  created_at: string;
}

export interface Expense {
  id: number;
  date: string;                          // "YYYY-MM-DD"
  title: string;
  category: string;
  amount: number;
  funding_source_id: number;
  funding_source_name?: string;          // joined from funding_sources table
  funds_type: FundsType;
  expense_for: ExpenseFor;
  notes: string | null;
  // Borrowed money tracking
  borrowed_status: BorrowedStatus | null;
  repaid_date: string | null;
  // Hubby reimbursement tracking
  reimbursement_status: ReimbursementStatus | null;
  reimbursement_date: string | null;
  created_at: string;
  updated_at: string;
}

// Values managed by the expense form
export interface ExpenseFormValues {
  date: string;
  title: string;
  category: string;
  amount: string;              // kept as string so it works with TextInput
  funding_source_id: number;
  funds_type: FundsType;
  expense_for: ExpenseFor;
  notes: string;
}

// Shape returned by getDashboardSummary()
export interface DashboardSummary {
  totalExpenses: number;
  totalAmount: number;
  totalOutstandingBorrowed: number;
  totalRepaidBorrowed: number;
  totalHubbyOwesMe: number;
  totalReimbursementsReceived: number;
  byCategory: { category: string; total: number }[];
  bySource: { name: string; total: number }[];
  outstandingBorrowed: Expense[];
  hubbyOwesMe: Expense[];
}
