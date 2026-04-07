/**
 * Shared TypeScript types used across the whole app.
 * Keeping them in one place makes it easy to update them.
 */

// ── Status / enum values ───────────────────────────────────────────────────

// Where the money comes from (paid with your own funds, or borrowed)
export type FundsType = "MINE" | "BORROWED";

// Who the expense is for
export type ExpenseFor = "ME" | "HOUSEHOLD" | "HUBBY";

// Borrowed money repayment status
export type BorrowedStatus = "OUTSTANDING" | "REPAID";

// Hubby reimbursement status
export type ReimbursementStatus = "OWES_ME" | "PAID_BACK";

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
