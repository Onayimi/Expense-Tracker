"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency, formatDate, pct } from "@/lib/utils";
import type { DashboardData } from "@/types";

function BalanceCard({ value, label, sub, color }: { value: number; label: string; sub?: string; color: string }) {
  return (
    <div className={`rounded-2xl p-4 ${color}`}>
      <p className="text-xs font-semibold opacity-75 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold">{formatCurrency(value)}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => { if (!r.ok) throw new Error("Failed"); return r.json(); })
      .then(setData)
      .catch(() => setError("Could not load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-3 animate-pulse">
        <div className="h-32 bg-sage-100 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          {[0,1,2,3].map(i => <div key={i} className="h-20 bg-sage-100 rounded-2xl" />)}
        </div>
        <div className="h-48 bg-sage-100 rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card text-center py-12">
        <p className="text-crimson text-sm">{error ?? "No data"}</p>
        <button onClick={() => location.reload()} className="btn-secondary mt-3 text-xs">Retry</button>
      </div>
    );
  }

  const balancePositive = data.availableBalance >= 0;

  return (
    <div className="space-y-4">

      {/* ── Main Balance Hero ──────────────────────────────────────────── */}
      <div className="bg-forest rounded-3xl p-5 text-white shadow-lg">
        <p className="text-sage-200 text-xs font-semibold uppercase tracking-widest mb-1">Available Balance</p>
        <p className={`text-4xl font-bold mb-1 ${balancePositive ? "text-white" : "text-crimson-300"}`}>
          {balancePositive ? "" : "-"}{formatCurrency(data.availableBalance)}
        </p>
        <p className="text-sage-300 text-xs">Total funds minus all expenses and outstanding hubby borrows</p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="bg-forest-400 rounded-xl p-3">
            <p className="text-sage-300 text-xs mb-0.5">This Month Income</p>
            <p className="text-gold font-bold">{formatCurrency(data.thisMonthIncome)}</p>
          </div>
          <div className="bg-forest-400 rounded-xl p-3">
            <p className="text-sage-300 text-xs mb-0.5">This Month Spent</p>
            <p className="text-white font-bold">{formatCurrency(data.thisMonthExpenses)}</p>
          </div>
        </div>
      </div>

      {/* ── Quick Add Buttons ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/income?add=1" className="btn-gold py-3 text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Income
        </Link>
        <Link href="/expenses?add=1" className="btn-primary py-3 text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
          </svg>
          Add Expense
        </Link>
      </div>

      {/* ── Summary Stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <BalanceCard value={data.totalIncome} label="Total Income" color="bg-green-50 text-green-800" />
        <BalanceCard value={data.totalExpenses} label="Total Spent" color="bg-forest-50 text-forest-700" />
        <BalanceCard
          value={data.outstandingHubbyBalance}
          label="Hubby Owes"
          sub="Outstanding balance"
          color="bg-crimson-50 text-crimson-700"
        />
        <BalanceCard
          value={data.totalRepaid}
          label="Repaid by Hubby"
          color="bg-gold-50 text-gold-700"
        />
      </div>

      {/* ── Hubby Outstanding ─────────────────────────────────────────── */}
      {data.pendingHubbyBorrows.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-crimson inline-block" />
              Hubby Owes Me
            </h2>
            <Link href="/hubby" className="text-xs text-gold font-semibold hover:underline">View all →</Link>
          </div>
          <div className="space-y-2">
            {data.pendingHubbyBorrows.slice(0, 3).map((b) => {
              const remaining = b.totalAmount - b.paidAmount;
              const paid = pct(b.paidAmount, b.totalAmount);
              return (
                <div key={b.id} className="bg-crimson-50 rounded-xl p-3 border border-crimson-100">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-semibold text-forest">{b.expense?.category?.name}</p>
                      <p className="text-xs text-gray-500">{b.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-crimson">{formatCurrency(remaining)}</p>
                      <p className="text-xs text-gray-400">of {formatCurrency(b.totalAmount)}</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-crimson-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gold rounded-full" style={{ width: `${paid}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Category Breakdown This Month ─────────────────────────────── */}
      {data.categoryBreakdown.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2>This Month by Category</h2>
            <Link href="/reports" className="text-xs text-gold font-semibold hover:underline">Reports →</Link>
          </div>
          <div className="space-y-3">
            {data.categoryBreakdown.slice(0, 5).map((item) => (
              <div key={item.category}>
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="font-medium text-forest">{item.category}</span>
                  <span className="font-bold text-forest">{formatCurrency(item.total)}</span>
                </div>
                <div className="h-1.5 bg-sage-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold rounded-full transition-all duration-500"
                    style={{ width: `${pct(item.total, data.thisMonthExpenses)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent Activity ───────────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2>Recent Activity</h2>
          <Link href="/history" className="text-xs text-gold font-semibold hover:underline">All →</Link>
        </div>

        {data.recentIncome.length === 0 && data.recentExpenses.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No transactions yet</p>
        ) : (
          <div className="space-y-2">
            {/* Merge and sort recent */}
            {[
              ...data.recentIncome.map(i => ({ type: "income" as const, id: i.id, date: i.date, label: i.source.name, amount: i.amount, notes: i.notes })),
              ...data.recentExpenses.map(e => ({ type: "expense" as const, id: e.id, date: e.date, label: e.category.name, amount: e.amount, notes: e.notes, isHubby: e.isHubbyBorrow })),
            ]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 8)
              .map((tx) => (
                <div key={`${tx.type}-${tx.id}`} className="flex items-center gap-3 py-2 border-b border-sage-50 last:border-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                    tx.type === "income" ? "bg-green-100 text-green-700" :
                    ("isHubby" in tx && tx.isHubby) ? "bg-crimson-100 text-crimson" :
                    "bg-forest-100 text-forest"
                  }`}>
                    {tx.type === "income" ? "↑" : "↓"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-forest truncate">{tx.label}</p>
                    <p className="text-xs text-gray-400">{formatDate(tx.date)}{tx.notes ? ` · ${tx.notes}` : ""}</p>
                  </div>
                  <span className={`text-sm font-bold ${tx.type === "income" ? "text-green-700" : "text-forest"}`}>
                    {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
