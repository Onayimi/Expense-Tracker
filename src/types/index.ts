// ─── Domain Types ─────────────────────────────────────────────────────────────

export interface IncomeSource {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Income {
  id: string;
  amount: number;
  date: string;
  notes?: string | null;
  sourceId: string;
  source: IncomeSource;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseLineItem {
  id: string;
  description: string;
  amount: number;
  expenseId: string;
}

export interface Expense {
  id: string;
  amount: number;
  date: string;
  notes?: string | null;
  categoryId: string;
  category: ExpenseCategory;
  isHubbyBorrow: boolean;
  lineItems: ExpenseLineItem[];
  hubbyBorrow?: HubbyBorrow | null;
  createdAt: string;
  updatedAt: string;
}

export interface HubbyBorrow {
  id: string;
  expenseId: string;
  expense?: Expense;
  description?: string | null;
  totalAmount: number;
  paidAmount: number;
  status: "OUTSTANDING" | "PARTIAL" | "PAID";
  repayments: Repayment[];
  createdAt: string;
  updatedAt: string;
}

export interface Repayment {
  id: string;
  hubbyBorrowId: string;
  amount: number;
  date: string;
  notes?: string | null;
  createdAt: string;
}

export interface AppSettings {
  id: string;
  appName: string;
  currency: string;
  currencySymbol: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardData {
  totalIncome: number;
  totalExpenses: number;
  totalHubbyBorrowed: number;
  totalRepaid: number;
  availableBalance: number;
  outstandingHubbyBalance: number;
  thisMonthIncome: number;
  thisMonthExpenses: number;
  recentIncome: Income[];
  recentExpenses: Expense[];
  pendingHubbyBorrows: HubbyBorrow[];
  categoryBreakdown: { category: string; total: number; count: number }[];
}

// ─── API Input Types ──────────────────────────────────────────────────────────

export interface CreateIncomeInput {
  amount: number;
  date: string;
  notes?: string;
  sourceId: string;
}

export interface CreateExpenseInput {
  amount: number;
  date: string;
  notes?: string;
  categoryId: string;
  isHubbyBorrow?: boolean;
  lineItems?: { description: string; amount: number }[];
  hubbyDescription?: string;
}

export interface CreateRepaymentInput {
  hubbyBorrowId: string;
  amount: number;
  date: string;
  notes?: string;
}

export type TransactionType = "income" | "expense" | "hubby" | "repayment" | "all";
