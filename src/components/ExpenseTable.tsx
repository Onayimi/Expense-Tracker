/**
 * ExpenseTable
 * ------------
 * Full expense list table with brand palette styling.
 */

"use client";

import Link from "next/link";
import StatusBadge from "./StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Expense } from "@/types";

interface ExpenseTableProps {
  expenses: Expense[];
  onRefresh: () => void;
}

export default function ExpenseTable({ expenses, onRefresh }: ExpenseTableProps) {

  async function handleDelete(id: number, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (res.ok) {
      onRefresh();
    } else {
      alert("Failed to delete expense.");
    }
  }

  async function handleMarkRepaid(id: number) {
    const res = await fetch(`/api/expenses/${id}/repay`, { method: "POST" });
    if (res.ok) {
      onRefresh();
    } else {
      const data = await res.json();
      alert(data.error ?? "Failed to mark as repaid");
    }
  }

  async function handleMarkPaidBack(id: number) {
    const res = await fetch(`/api/expenses/${id}/reimburse`, { method: "POST" });
    if (res.ok) {
      onRefresh();
    } else {
      const data = await res.json();
      alert(data.error ?? "Failed to mark as paid back");
    }
  }

  if (expenses.length === 0) {
    return (
      <div className="card text-center py-16">
        <p className="text-4xl mb-3">🧾</p>
        <p className="text-forest font-semibold mb-1">No expenses found</p>
        <p className="text-gray-400 text-sm mb-5">
          Try adjusting your filters, or add a new expense.
        </p>
        <Link href="/expenses/new" className="btn-primary inline-flex">
          + Add First Expense
        </Link>
      </div>
    );
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Forest-green header row */}
          <thead className="bg-forest">
            <tr>
              <th className="table-header text-mint-200">Date</th>
              <th className="table-header text-mint-200">Title</th>
              <th className="table-header text-mint-200">Category</th>
              <th className="table-header text-mint-200 text-right">Amount</th>
              <th className="table-header text-mint-200">Source</th>
              <th className="table-header text-mint-200">For</th>
              <th className="table-header text-mint-200">Status</th>
              <th className="table-header text-mint-200">Notes</th>
              <th className="table-header text-mint-200 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-mint-50">
            {expenses.map((expense) => (
              <tr
                key={expense.id}
                className="hover:bg-mint-50 transition-colors"
              >
                {/* Date */}
                <td className="table-cell whitespace-nowrap text-gray-500 text-xs">
                  {formatDate(expense.date)}
                </td>

                {/* Title */}
                <td className="table-cell font-semibold text-forest">
                  {expense.title}
                </td>

                {/* Category */}
                <td className="table-cell">
                  <span className="text-xs text-forest-600 bg-mint-100 px-2 py-0.5 rounded-full font-medium">
                    {expense.category}
                  </span>
                </td>

                {/* Amount */}
                <td className="table-cell text-right font-bold text-forest whitespace-nowrap">
                  {formatCurrency(expense.amount)}
                </td>

                {/* Funding source */}
                <td className="table-cell text-xs text-gray-500 whitespace-nowrap">
                  {expense.fundingSource.name}
                </td>

                {/* Who it's for */}
                <td className="table-cell">
                  <StatusBadge value={expense.expenseFor} />
                </td>

                {/* Status badges */}
                <td className="table-cell">
                  <div className="flex flex-col gap-1">
                    {expense.fundsType === "BORROWED" && (
                      <StatusBadge value={expense.fundsType} />
                    )}
                    {expense.borrowedStatus && (
                      <StatusBadge value={expense.borrowedStatus} />
                    )}
                    {expense.reimbursementStatus && (
                      <StatusBadge value={expense.reimbursementStatus} />
                    )}
                  </div>
                </td>

                {/* Notes */}
                <td className="table-cell max-w-[140px]">
                  {expense.notes ? (
                    <span
                      className="text-xs text-gray-500 truncate block"
                      title={expense.notes}
                    >
                      {expense.notes}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>

                {/* Actions */}
                <td className="table-cell">
                  <div className="flex items-center justify-end gap-1 flex-wrap">
                    {/* Edit */}
                    <Link
                      href={`/expenses/${expense.id}/edit`}
                      className="px-2 py-1 text-xs text-forest font-medium hover:bg-mint-100 rounded-lg transition-colors"
                    >
                      Edit
                    </Link>

                    {/* Mark borrowed as repaid */}
                    {expense.borrowedStatus === "OUTSTANDING" && (
                      <button
                        onClick={() => handleMarkRepaid(expense.id)}
                        className="px-2 py-1 text-xs bg-gold text-white font-medium rounded-lg hover:bg-gold-600 transition-colors"
                      >
                        Mark Repaid
                      </button>
                    )}

                    {/* Mark hubby as paid back */}
                    {expense.reimbursementStatus === "OWES_ME" && (
                      <button
                        onClick={() => handleMarkPaidBack(expense.id)}
                        className="px-2 py-1 text-xs bg-gold text-white font-medium rounded-lg hover:bg-gold-600 transition-colors"
                      >
                        Paid Back
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(expense.id, expense.title)}
                      className="px-2 py-1 text-xs text-crimson hover:bg-crimson-50 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Row count footer */}
      <div className="px-4 py-3 bg-mint-50 border-t border-mint-100 text-xs text-forest-400 font-medium">
        {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
