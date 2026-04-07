/**
 * Reimbursements Page  (/reimbursements)
 * ----------------------------------------
 * Shows all expenses paid for hubby that need reimbursement.
 * - Owes Me = hubby hasn't paid you back yet
 * - Paid Back = hubby settled the expense
 */

"use client";

import { useState, useEffect } from "react";
import StatusBadge from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Expense } from "@/types";

export default function ReimbursementsPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  function loadData() {
    setLoading(true);
    fetch("/api/expenses?expenseFor=HUBBY")
      .then((r) => r.json())
      .then(setExpenses)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  // Mark as paid back by hubby
  async function handleMarkPaidBack(id: number) {
    const res = await fetch(`/api/expenses/${id}/reimburse`, { method: "POST" });
    if (res.ok) {
      loadData();
    } else {
      const data = await res.json();
      alert(data.error ?? "Failed to mark as paid back");
    }
  }

  // Split into pending vs settled
  const owesMe = expenses.filter((e) => e.reimbursementStatus === "OWES_ME");
  const paidBack = expenses.filter((e) => e.reimbursementStatus === "PAID_BACK");

  const totalOwesMe = owesMe.reduce((sum, e) => sum + e.amount, 0);
  const totalPaidBack = paidBack.reduce((sum, e) => sum + e.amount, 0);

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
        <h1>Hubby Reimbursements</h1>
        <p className="text-sm text-gray-500 mt-1">
          Expenses you paid for your husband. Mark them as paid back when he
          reimburses you.
        </p>
      </div>

      {/* ── Summary cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card border-l-4 border-crimson">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Hubby Owes Me
          </p>
          <p className="text-3xl font-bold text-forest mt-1">
            {formatCurrency(totalOwesMe)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {owesMe.length} pending item{owesMe.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="card border-l-4 border-mint-400">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Received Back
          </p>
          <p className="text-3xl font-bold text-forest mt-1">
            {formatCurrency(totalPaidBack)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {paidBack.length} settled item{paidBack.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* ── Hubby owes me section ────────────────────────────────────────── */}
      <div>
        <h2 className="mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-crimson inline-block"></span>
          Hubby Owes Me
        </h2>

        {owesMe.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-2xl mb-2">🎉</p>
            <p className="text-gray-500 text-sm">
              Hubby is all settled up — nothing owed!
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
                {owesMe.map((expense) => (
                  <tr key={expense.id} className="hover:bg-red-50 transition-colors">
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
                    <td className="table-cell text-right font-semibold text-crimson whitespace-nowrap">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="table-cell text-xs text-gray-500 max-w-[150px]">
                      <span className="truncate block" title={expense.notes ?? ""}>
                        {expense.notes ?? "—"}
                      </span>
                    </td>
                    <td className="table-cell text-right">
                      <button
                        onClick={() => handleMarkPaidBack(expense.id)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gold text-white hover:bg-gold-600 transition-colors"
                      >
                        Paid Back ✓
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Total row */}
              <tfoot className="bg-red-50 border-t-2 border-red-200">
                <tr>
                  <td colSpan={4} className="table-cell font-semibold text-gray-700">
                    Total Owed by Hubby
                  </td>
                  <td className="table-cell text-right font-bold text-crimson">
                    {formatCurrency(totalOwesMe)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ── Paid back / settled section ──────────────────────────────────── */}
      {paidBack.length > 0 && (
        <div>
          <h2 className="mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-mint-400 inline-block"></span>
            Paid Back — Settled
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
                  <th className="table-header">Paid Back On</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paidBack.map((expense) => (
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
                      {expense.reimbursementDate
                        ? formatDate(expense.reimbursementDate)
                        : "—"}
                    </td>
                    <td className="table-cell">
                      <StatusBadge value="PAID_BACK" />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td colSpan={4} className="table-cell font-semibold text-gray-500">
                    Total Received Back
                  </td>
                  <td className="table-cell text-right font-bold text-gray-600">
                    {formatCurrency(totalPaidBack)}
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
