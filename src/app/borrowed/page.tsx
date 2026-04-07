/**
 * Borrowed Money Page  (/borrowed)
 * ----------------------------------
 * Shows all expenses that were paid with borrowed money.
 * - Outstanding = you still need to repay
 * - Repaid = you've paid it back
 */

"use client";

import { useState, useEffect } from "react";
import StatusBadge from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Expense } from "@/types";

export default function BorrowedPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all borrowed expenses
  function loadData() {
    setLoading(true);
    fetch("/api/expenses?fundsType=BORROWED")
      .then((r) => r.json())
      .then(setExpenses)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  // Mark a borrowed expense as repaid
  async function handleMarkRepaid(id: number) {
    const res = await fetch(`/api/expenses/${id}/repay`, { method: "POST" });
    if (res.ok) {
      loadData(); // Refresh the list
    } else {
      const data = await res.json();
      alert(data.error ?? "Failed to mark as repaid");
    }
  }

  // Split expenses into outstanding vs repaid
  const outstanding = expenses.filter((e) => e.borrowedStatus === "OUTSTANDING");
  const repaid = expenses.filter((e) => e.borrowedStatus === "REPAID");

  const totalOutstanding = outstanding.reduce((sum, e) => sum + e.amount, 0);
  const totalRepaid = repaid.reduce((sum, e) => sum + e.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 animate-pulse">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div>
        <h1>Borrowed Money</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track expenses paid with borrowed funds and mark them as repaid when
          you&apos;ve settled up.
        </p>
      </div>

      {/* ── Summary cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card border-l-4 border-gold-500">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Still Outstanding
          </p>
          <p className="text-3xl font-bold text-forest mt-1">
            {formatCurrency(totalOutstanding)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {outstanding.length} unpaid item{outstanding.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="card border-l-4 border-mint-400">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Repaid
          </p>
          <p className="text-3xl font-bold text-forest mt-1">
            {formatCurrency(totalRepaid)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {repaid.length} settled item{repaid.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* ── Outstanding section ──────────────────────────────────────────── */}
      <div>
        <h2 className="mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gold-500 inline-block"></span>
          Outstanding — You Owe
        </h2>

        {outstanding.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-2xl mb-2">🎉</p>
            <p className="text-gray-500 text-sm">
              No outstanding borrowed money — you&apos;re all clear!
            </p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full">
              <thead className="bg-forest text-mint-200">
                <tr>
                  <th className="table-header text-mint-200">Date</th>
                  <th className="table-header text-mint-200">Title</th>
                  <th className="table-header text-mint-200">Category</th>
                  <th className="table-header text-mint-200">Source</th>
                  <th className="table-header text-mint-200 text-right">Amount</th>
                  <th className="table-header text-mint-200">Notes</th>
                  <th className="table-header text-mint-200 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {outstanding.map((expense) => (
                  <tr key={expense.id} className="hover:bg-mint-50 transition-colors">
                    <td className="table-cell text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(expense.date)}
                    </td>
                    <td className="table-cell font-medium text-gray-900">
                      {expense.title}
                    </td>
                    <td className="table-cell">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {expense.category}
                      </span>
                    </td>
                    <td className="table-cell text-xs text-gray-600">
                      {expense.fundingSource.name}
                    </td>
                    <td className="table-cell text-right font-semibold text-forest whitespace-nowrap">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="table-cell text-xs text-gray-500 max-w-[150px]">
                      <span className="truncate block" title={expense.notes ?? ""}>
                        {expense.notes ?? "—"}
                      </span>
                    </td>
                    <td className="table-cell text-right">
                      <button
                        onClick={() => handleMarkRepaid(expense.id)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gold text-white hover:bg-gold-600 transition-colors"
                      >
                        Mark Repaid ✓
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Total row */}
              <tfoot className="bg-gold-50 border-t-2 border-gold-200">
                <tr>
                  <td colSpan={4} className="table-cell font-semibold text-gray-700">
                    Total Outstanding
                  </td>
                  <td className="table-cell text-right font-bold text-forest">
                    {formatCurrency(totalOutstanding)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ── Repaid section ───────────────────────────────────────────────── */}
      {repaid.length > 0 && (
        <div>
          <h2 className="mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-mint-400 inline-block"></span>
            Repaid — All Settled
          </h2>

          <div className="card p-0 overflow-hidden opacity-80">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="table-header">Date</th>
                  <th className="table-header">Title</th>
                  <th className="table-header">Category</th>
                  <th className="table-header">Source</th>
                  <th className="table-header text-right">Amount</th>
                  <th className="table-header">Repaid On</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {repaid.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="table-cell text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(expense.date)}
                    </td>
                    <td className="table-cell text-gray-500 line-through">
                      {expense.title}
                    </td>
                    <td className="table-cell">
                      <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
                        {expense.category}
                      </span>
                    </td>
                    <td className="table-cell text-xs text-gray-400">
                      {expense.fundingSource.name}
                    </td>
                    <td className="table-cell text-right font-medium text-gray-400 whitespace-nowrap">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="table-cell text-xs text-gray-500">
                      {expense.repaidDate ? formatDate(expense.repaidDate) : "—"}
                    </td>
                    <td className="table-cell">
                      <StatusBadge value="REPAID" />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td colSpan={4} className="table-cell font-semibold text-gray-500">
                    Total Repaid
                  </td>
                  <td className="table-cell text-right font-bold text-gray-600">
                    {formatCurrency(totalRepaid)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
