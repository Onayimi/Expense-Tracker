/**
 * Shared TypeScript types used across the whole app.
 * Keeping them in one place makes it easy to update them.
 */

// ── Constants (single source of truth) ────────────────────────────────────

/** Where the money comes from */
export const FUNDS_TYPES = {
  MINE: "MINE",
  BORROWED: "BORROWED",
} as const;

/** Who the expense is for */
export const EXPENSE_FOR = {
  ME: "ME",
  HOUSEHOLD: "HOUSEHOLD",
  HUBBY: "HUBBY",
} as const;

/** Borrowed money repayment status */
export const BORROWED_STATUS = {
  OUTSTANDING: "OUTSTANDING",
  REPAID: "REPAID",
} as const;

/** Hubby reimbursement status */
export const REIMBURSEMENT_STATUS = {
  OWES_ME: "OWES_ME",
  PAID_BACK: "PAID_BACK",
} as const;

/** All expense categories — add more here as needed */
export const CATEGORIES = [
  "Food & Groceries",
  "Dining Out",
  "Transport",
  "Utilities",
  "Healthcare",
  "Health & Fitness",
  "Home & Maintenance",
  "Shopping",
  "Clothing",
  "Entertainment",
  "Education",
  "Personal Care",
  "Pets",
  "Travel",
  "Gifts",
  "Subscriptions",
  "Other",
] as const;

// ── TypeScript types derived from the constants above ─────────────────────

export type FundsType = keyof typeof FUNDS_TYPES;
export type ExpenseFor = keyof typeof EXPENSE_FOR;
export type BorrowedStatus = keyof typeof BORROWED_STATUS;
export type ReimbursementStatus = keyof typeof REIMBURSEMENT_STATUS;
export type Category = (typeof CATEGORIES)[number];

// ── Data shapes (matching Prisma models) ──────────────────────────────────

export interface FundingSource {
  id: number;
  name: string;
  isDefault: boolean;
  createdAt: string;
}

export interface Expense {
  id: number;
  date: string;
  title: string;
  category: string;
  amount: number;
  fundingSourceId: number;
  fundingSource: FundingSource;
  fundsType: FundsType;
  expenseFor: ExpenseFor;
  notes: string | null;
  borrowedStatus: BorrowedStatus | null;
  repaidDate: string | null;
  reimbursementStatus: ReimbursementStatus | null;
  reimbursementDate: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Shape for creating or editing an expense (no auto-generated fields) */
export interface ExpenseFormData {
  date: string;
  title: string;
  category: string;
  amount: number | string;
  fundingSourceId: number | string;
  fundsType: FundsType;
  expenseFor: ExpenseFor;
  notes: string;
}

/** Dashboard summary data returned by the /api/dashboard route */
export interface DashboardData {
  totalExpenses: number;
  totalAmount: number;
  byCategory: { category: string; total: number; count: number }[];
  bySource: { source: string; total: number; count: number }[];
  totalOutstandingBorrowed: number;
  totalRepaidBorrowed: number;
  totalHubbyOwesMe: number;
  totalReimbursementsReceived: number;
  outstandingBorrowedExpenses: Expense[];
  hubbyOwesMeExpenses: Expense[];
}
