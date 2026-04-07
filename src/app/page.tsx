/**
 * Dashboard Page  (/)
 * --------------------
 * Overview of your finances with the brand forest green + gold palette.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardCard from "@/components/DashboardCard";
import StatusBadge from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { DashboardData } from "@/types";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then(setData)
      .catch(() => setError("Could not load dashboard data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-forest-300 animate-pulse text-sm">Loading dashboard…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card text-center py-12">
        <p className="text-crimson">{error ?? "No data available"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Your personal expense overview
          </p>
        </div>
        <Link href="/expenses/new" className="btn-primary">
          + Add Expense
        </Link>
      </div>

      {/* ── Main stat cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Total Spent"
          value={formatCurrency(data.totalAmount)}
          subtitle={`${data.totalExpenses} transactions`}
          accentClass="border-forest"
          valueClass="text-forest"
          icon="💰"
        />
        <DashboardCard
          title="Outstanding Borrowed"
          value={formatCurrency(data.totalOutstandingBorrowed)}
          subtitle="Money you still owe"
          accentClass="border-gold"
          valueClass="text-gold-600"
          icon="⚠️"
        />
        <DashboardCard
          title="Hubby Owes Me"
          value={formatCurrency(data.totalHubbyOwesMe)}
          subtitle="Pending reimbursements"
          accentClass="border-crimson"
          valueClass="text-crimson"
          icon="💸"
        />
        <DashboardCard
          title="All Settled"
          value={formatCurrency(
            data.totalRepaidBorrowed + data.totalReimbursementsReceived
          )}
          subtitle="Repaid + received back"
          accentClass="border-mint-400"
          valueClass="text-forest"
          icon="✅"
        />
      </div>

      {/* ── Secondary stat cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DashboardCard
          title="Borrowed Money Repaid"
          value={formatCurrency(data.totalRepaidBorrowed)}
          accentClass="border-mint-400"
          valueClass="text-forest"
          icon="🔄"
        />
        <DashboardCard
          title="Reimbursements Received"
          value={formatCurrency(data.totalReimbursementsReceived)}
          subtitle="From hubby"
          accentClass="border-mint-400"
          valueClass="text-forest"
          icon="🤝"
        />
      </div>

      {/* ── Breakdown by category ────────────────────────────────────────── */}
      {data.byCategory.length > 0 && (
        <div className="card">
          <h2 className="mb-5">Spending by Category</h2>
          <div className="space-y-4">
            {data.byCategory.map((item) => {
              const pct =
                data.totalAmount > 0
                  ? (item.total / data.totalAmount) * 100
                  : 0;
              return (
                <div key={item.category}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-forest font-medium">{item.category}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-400">
                        {item.count} item{item.count !== 1 ? "s" : ""}
                      </span>
                      <span className="font-bold text-forest">
                        {formatCurrency(item.total)}
                      </span>
                    </div>
                  </div>
                  {/* Brand-coloured progress bar */}
                  <div className="h-2 bg-mint-100 rounded-full overflow-hidden">
                    <div
                      className="h-2 bg-gold rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Breakdown by funding source ──────────────────────────────────── */}
      {data.bySource.length > 0 && (
        <div className="card">
          <h2 className="mb-4">Spending by Source of Funds</h2>
          <div className="divide-y divide-mint-100">
            {data.bySource.map((item) => (
              <div
                key={item.source}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-forest">
                    {item.source}
                  </p>
                  <p className="text-xs text-gray-400">
                    {item.count} expense{item.count !== 1 ? "s" : ""}
                  </p>
                </div>
                <span className="text-sm font-bold text-forest">
                  {formatCurrency(item.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Outstanding borrowed money ───────────────────────────────────── */}
      <div className="card border-t-4 border-gold">
        <div className="flex items-center justify-between mb-4">
          <h2>Unpaid Borrowed Funds</h2>
          <Link
            href="/borrowed"
            className="text-sm text-gold-600 font-medium hover:underline"
          >
            View all →
          </Link>
        </div>

        {data.outstandingBorrowedExpenses.length === 0 ? (
          <div className="text-center py-6 bg-mint-50 rounded-xl">
            <p className="text-2xl mb-1">🎉</p>
            <p className="text-sm text-forest-400">No outstanding borrowed money!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.outstandingBorrowedExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-3 bg-gold-50 rounded-xl border border-gold-100"
              >
                <div>
                  <p className="text-sm font-semibold text-forest">
                    {expense.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(expense.date)} · {expense.fundingSource.name}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge value="OUTSTANDING" />
                  <span className="font-bold text-gold-600">
                    {formatCurrency(expense.amount)}
                  </span>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center pt-3 border-t-2 border-gold-200">
              <span className="text-sm font-bold text-forest">Total outstanding</span>
              <span className="font-extrabold text-gold-600 text-lg">
                {formatCurrency(data.totalOutstandingBorrowed)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Hubby owes me ────────────────────────────────────────────────── */}
      <div className="card border-t-4 border-crimson">
        <div className="flex items-center justify-between mb-4">
          <h2>Hubby Owes Me</h2>
          <Link
            href="/reimbursements"
            className="text-sm text-gold-600 font-medium hover:underline"
          >
            View all →
          </Link>
        </div>

        {data.hubbyOwesMeExpenses.length === 0 ? (
          <div className="text-center py-6 bg-mint-50 rounded-xl">
            <p className="text-2xl mb-1">🎉</p>
            <p className="text-sm text-forest-400">Hubby is all settled up!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.hubbyOwesMeExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-3 bg-crimson-50 rounded-xl border border-crimson-100"
              >
                <div>
                  <p className="text-sm font-semibold text-forest">
                    {expense.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(expense.date)} · {expense.fundingSource.name}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge value="OWES_ME" />
                  <span className="font-bold text-crimson">
                    {formatCurrency(expense.amount)}
                  </span>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center pt-3 border-t-2 border-crimson-200">
              <span className="text-sm font-bold text-forest">Total owed by hubby</span>
              <span className="font-extrabold text-crimson text-lg">
                {formatCurrency(data.totalHubbyOwesMe)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
