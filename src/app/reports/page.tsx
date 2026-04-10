"use client";

import { useState, useEffect, useCallback } from "react";
import { formatCurrency, formatMonthYear, pct, startOfMonth, endOfMonth } from "@/lib/utils";
import type { Income, Expense, HubbyBorrow } from "@/types";

interface MonthSummary {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

interface CategorySummary {
  name: string;
  total: number;
  count: number;
}

interface SourceSummary {
  name: string;
  total: number;
  count: number;
}

export default function ReportsPage() {
  const [income, setIncome] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [borrows, setBorrows] = useState<HubbyBorrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [incRes, expRes, hubRes] = await Promise.all([
        fetch("/api/income"),
        fetch("/api/expenses"),
        fetch("/api/hubby"),
      ]);
      const [incData, expData, hubData] = await Promise.all([incRes.json(), expRes.json(), hubRes.json()]);
      setIncome(incData);
      setExpenses(expData);
      setBorrows(hubData);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Compute monthly summaries
  const monthlyMap = new Map<string, MonthSummary>();
  const addToMonth = (date: string, incAmt: number, expAmt: number) => {
    const d = new Date(date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const existing = monthlyMap.get(key) ?? { month: key, income: 0, expenses: 0, net: 0 };
    monthlyMap.set(key, { ...existing, income: existing.income + incAmt, expenses: existing.expenses + expAmt, net: existing.net + incAmt - expAmt });
  };
  income.forEach(i => addToMonth(i.date, i.amount, 0));
  expenses.forEach(e => addToMonth(e.date, 0, e.amount));
  const monthlyData = Array.from(monthlyMap.values()).sort((a, b) => b.month.localeCompare(a.month));

  // Filtered to selected month
  const [selYear, selMonth] = selectedMonth.split("-").map(Number);
  const monthStart = startOfMonth(new Date(selYear, selMonth - 1, 1));
  const monthEnd = endOfMonth(new Date(selYear, selMonth - 1, 1));

  const inMonth = (dateStr: string) => {
    const d = new Date(dateStr);
    return d >= monthStart && d <= monthEnd;
  };

  const monthIncome = income.filter(i => inMonth(i.date));
  const monthExpenses = expenses.filter(e => inMonth(e.date));
  const totalIncome = monthIncome.reduce((s, i) => s + i.amount, 0);
  const totalExpenses = monthExpenses.reduce((s, e) => s + e.amount, 0);

  // Category breakdown for selected month
  const catMap = new Map<string, CategorySummary>();
  for (const e of monthExpenses) {
    const existing = catMap.get(e.category.name) ?? { name: e.category.name, total: 0, count: 0 };
    catMap.set(e.category.name, { ...existing, total: existing.total + e.amount, count: existing.count + 1 });
  }
  const categoryData = Array.from(catMap.values()).sort((a, b) => b.total - a.total);

  // Income source breakdown for selected month
  const srcMap = new Map<string, SourceSummary>();
  for (const i of monthIncome) {
    const existing = srcMap.get(i.source.name) ?? { name: i.source.name, total: 0, count: 0 };
    srcMap.set(i.source.name, { ...existing, total: existing.total + i.amount, count: existing.count + 1 });
  }
  const sourceData = Array.from(srcMap.values()).sort((a, b) => b.total - a.total);

  // All-time hubby summary
  const hubbyTotal = borrows.reduce((s, b) => s + b.totalAmount, 0);
  const hubbyRepaid = borrows.reduce((s, b) => s + b.paidAmount, 0);
  const hubbyOutstanding = hubbyTotal - hubbyRepaid;

  // Available months for selector
  const availableMonths = Array.from(new Set([
    ...income.map(i => { const d = new Date(i.date); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }),
    ...expenses.map(e => { const d = new Date(e.date); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }),
    selectedMonth,
  ])).sort((a, b) => b.localeCompare(a));

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-sage-100 rounded-xl w-48" />
        <div className="h-48 bg-sage-100 rounded-2xl" />
        <div className="h-48 bg-sage-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1>Reports</h1>
        <p className="text-xs text-gray-500">Financial summaries and breakdowns</p>
      </div>

      {/* Month selector */}
      <div>
        <label className="label">Reporting Period</label>
        <div className="relative">
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="select pr-8">
            {availableMonths.map(m => {
              const [y, mo] = m.split("-").map(Number);
              return <option key={m} value={m}>{formatMonthYear(new Date(y, mo - 1, 1))}</option>;
            })}
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>

      {/* Monthly overview */}
      <div className="card">
        <h2 className="mb-3">{formatMonthYear(new Date(selYear, selMonth - 1, 1))} Overview</h2>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
            <p className="text-xs text-green-700 font-semibold">Income</p>
            <p className="text-base font-bold text-green-800">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="bg-forest-50 rounded-xl p-3 text-center border border-forest-100">
            <p className="text-xs text-forest font-semibold">Spent</p>
            <p className="text-base font-bold text-forest">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className={`rounded-xl p-3 text-center border ${totalIncome - totalExpenses >= 0 ? "bg-gold-50 border-gold-100" : "bg-crimson-50 border-crimson-100"}`}>
            <p className={`text-xs font-semibold ${totalIncome - totalExpenses >= 0 ? "text-gold-700" : "text-crimson"}`}>Net</p>
            <p className={`text-base font-bold ${totalIncome - totalExpenses >= 0 ? "text-gold-800" : "text-crimson"}`}>{formatCurrency(totalIncome - totalExpenses)}</p>
          </div>
        </div>

        {/* Savings rate */}
        {totalIncome > 0 && (
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Spending rate</span>
              <span>{pct(totalExpenses, totalIncome).toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-sage-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${pct(totalExpenses, totalIncome) > 90 ? "bg-crimson" : pct(totalExpenses, totalIncome) > 70 ? "bg-gold" : "bg-green-500"}`}
                style={{ width: `${pct(totalExpenses, totalIncome)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Category breakdown */}
      {categoryData.length > 0 && (
        <div className="card">
          <h2 className="mb-3">Spending by Category</h2>
          <div className="space-y-3">
            {categoryData.map(cat => (
              <div key={cat.name}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-forest">{cat.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{cat.count} {cat.count === 1 ? "entry" : "entries"}</span>
                    <span className="text-sm font-bold text-forest">{formatCurrency(cat.total)}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-sage-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gold rounded-full transition-all duration-500" style={{ width: `${pct(cat.total, totalExpenses)}%` }} />
                </div>
                <p className="text-xs text-right text-gray-400 mt-0.5">{pct(cat.total, totalExpenses).toFixed(0)}% of total</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Income by source */}
      {sourceData.length > 0 && (
        <div className="card">
          <h2 className="mb-3">Income by Source</h2>
          <div className="space-y-3">
            {sourceData.map(src => (
              <div key={src.name}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-forest">{src.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{src.count} {src.count === 1 ? "entry" : "entries"}</span>
                    <span className="text-sm font-bold text-green-700">{formatCurrency(src.total)}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-sage-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-400 rounded-full transition-all duration-500" style={{ width: `${pct(src.total, totalIncome)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All-time hubby summary */}
      <div className="card">
        <h2 className="mb-3">All-Time Hubby Summary</h2>
        <div className="space-y-2">
          <div className="flex justify-between py-2 border-b border-sage-100">
            <span className="text-sm text-gray-600">Total lent to hubby</span>
            <span className="text-sm font-bold text-forest">{formatCurrency(hubbyTotal)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-sage-100">
            <span className="text-sm text-gray-600">Total repaid by hubby</span>
            <span className="text-sm font-bold text-green-700">{formatCurrency(hubbyRepaid)}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm font-semibold text-forest">Outstanding balance</span>
            <span className={`text-sm font-bold ${hubbyOutstanding > 0 ? "text-crimson" : "text-green-700"}`}>{formatCurrency(hubbyOutstanding)}</span>
          </div>
        </div>
        {hubbyTotal > 0 && (
          <div className="mt-3">
            <div className="h-2 bg-sage-100 rounded-full overflow-hidden">
              <div className="h-full bg-gold rounded-full transition-all duration-500" style={{ width: `${pct(hubbyRepaid, hubbyTotal)}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-1 text-right">{pct(hubbyRepaid, hubbyTotal).toFixed(0)}% recovered</p>
          </div>
        )}
      </div>

      {/* Monthly trend */}
      {monthlyData.length > 1 && (
        <div className="card">
          <h2 className="mb-3">Monthly Trend</h2>
          <div className="space-y-2">
            {monthlyData.slice(0, 6).map(m => {
              const [y, mo] = m.month.split("-").map(Number);
              const isSelected = m.month === selectedMonth;
              return (
                <div
                  key={m.month}
                  className={`p-3 rounded-xl cursor-pointer transition-colors ${isSelected ? "bg-forest-50 border border-forest-100" : "hover:bg-sage-50"}`}
                  onClick={() => setSelectedMonth(m.month)}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-medium ${isSelected ? "text-forest font-semibold" : "text-gray-600"}`}>
                      {formatMonthYear(new Date(y, mo - 1, 1))}
                    </span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-green-700">+{formatCurrency(m.income)}</span>
                      <span className="text-forest">-{formatCurrency(m.expenses)}</span>
                      <span className={`font-bold ${m.net >= 0 ? "text-gold-700" : "text-crimson"}`}>{m.net >= 0 ? "+" : ""}{formatCurrency(m.net)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
