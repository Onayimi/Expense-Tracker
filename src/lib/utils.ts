/**
 * Utility / helper functions used across the app.
 */

import {
  EXPENSE_FOR,
  BORROWED_STATUS,
  REIMBURSEMENT_STATUS,
  type ExpenseFor,
  type FundsType,
  type BorrowedStatus,
  type ReimbursementStatus,
} from "@/types";

// ── Formatting ─────────────────────────────────────────────────────────────

/** Format a number as currency, e.g. 45.5 → "£45.50" */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

/** Format a date string or Date object as "5 Jan 2024" */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Format a date for an HTML date input (YYYY-MM-DD) */
export function toInputDate(date: string | Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Today's date formatted for an HTML date input */
export function todayInputDate(): string {
  return toInputDate(new Date());
}

// ── Label helpers ──────────────────────────────────────────────────────────

/** Human-readable label for expenseFor value */
export function expenseForLabel(expenseFor: ExpenseFor | string): string {
  const labels: Record<string, string> = {
    ME: "Me",
    HOUSEHOLD: "Household",
    HUBBY: "Hubby",
  };
  return labels[expenseFor] ?? expenseFor;
}

/** Human-readable label for fundsType value */
export function fundsTypeLabel(fundsType: FundsType | string): string {
  const labels: Record<string, string> = {
    MINE: "My money",
    BORROWED: "Borrowed",
  };
  return labels[fundsType] ?? fundsType;
}

/** Human-readable label for borrowedStatus value */
export function borrowedStatusLabel(status: BorrowedStatus | string): string {
  const labels: Record<string, string> = {
    OUTSTANDING: "Outstanding",
    REPAID: "Repaid",
  };
  return labels[status] ?? status;
}

/** Human-readable label for reimbursementStatus value */
export function reimbursementStatusLabel(
  status: ReimbursementStatus | string
): string {
  const labels: Record<string, string> = {
    OWES_ME: "Hubby owes me",
    PAID_BACK: "Paid back",
  };
  return labels[status] ?? status;
}

// ── Business logic helpers ─────────────────────────────────────────────────

/**
 * Given an expense's fundsType, returns the borrowedStatus that should
 * automatically be set when the expense is first created.
 * BORROWED → OUTSTANDING, MINE → null
 */
export function getDefaultBorrowedStatus(
  fundsType: FundsType
): BorrowedStatus | null {
  return fundsType === "BORROWED" ? BORROWED_STATUS.OUTSTANDING : null;
}

/**
 * Given an expense's expenseFor, returns the reimbursementStatus that should
 * automatically be set when the expense is first created.
 * HUBBY → OWES_ME, anything else → null
 */
export function getDefaultReimbursementStatus(
  expenseFor: ExpenseFor
): ReimbursementStatus | null {
  return expenseFor === EXPENSE_FOR.HUBBY
    ? REIMBURSEMENT_STATUS.OWES_ME
    : null;
}

// ── CSV Export ─────────────────────────────────────────────────────────────

/** Convert an array of objects to a CSV string */
export function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]);
  const csvRows = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          // Wrap values containing commas or quotes in double quotes
          const str = val == null ? "" : String(val);
          return str.includes(",") || str.includes('"')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(",")
    ),
  ];

  return csvRows.join("\n");
}

// ── Validation ─────────────────────────────────────────────────────────────

/** Basic expense form validation. Returns an error message or null. */
export function validateExpenseForm(data: {
  title: string;
  amount: number | string;
  category: string;
  date: string;
  fundingSourceId: number | string;
}): string | null {
  if (!data.title || String(data.title).trim().length === 0) {
    return "Title is required";
  }
  if (!data.date) {
    return "Date is required";
  }
  const amount = Number(data.amount);
  if (isNaN(amount) || amount <= 0) {
    return "Amount must be a positive number";
  }
  if (!data.category) {
    return "Category is required";
  }
  if (!data.fundingSourceId) {
    return "Please select a funding source";
  }
  return null; // no errors
}
