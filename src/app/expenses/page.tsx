/**
 * Expenses List Page  (/expenses)
 * ---------------------------------
 * Full expense list with filtering, search, and CSV export.
 * Styled with forest green + gold + mint brand palette.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ExpenseTable from "@/components/ExpenseTable";
import { CATEGORIES } from "@/types";
import type { Expense, FundingSource } from "@/types";

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 4 }, (_, i) => currentYear - i);

const MONTHS = [
  { value: "1",  label: "January" },
  { value: "2",  label: "February" },
  { value: "3",  label: "March" },
  { value: "4",  label: "April" },
  { value: "5",  label: "May" },
  { value: "6",  label: "June" },
  { value: "7",  label: "July" },
  { value: "8",  label: "August" },
  { value: "9",  label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export default function ExpensesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [fundingSource, setFundingSource] = useState("");
  const [expenseFor, setExpenseFor] = useState("");
  const [fundsType, setFundsType] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [fundingSources, setFundingSources] = useState<FundingSource[]>([]);
  const [loading, setLoading] = useState(true);

  // Load funding sources once for the filter dropdown
  useEffect(() => {
    fetch("/api/funding-sources")
      .then((r) => r.json())
      .then(setFundingSources)
      .catch(console.error);
  }, []);

  const loadExpenses = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (fundingSource) params.set("fundingSource", fundingSource);
    if (expenseFor) params.set("expenseFor", expenseFor);
    if (fundsType) params.set("fundsType", fundsType);
    if (month) params.set("month", month);
    if (year) params.set("year", year);

    fetch(`/api/expenses?${params}`)
      .then((r) => r.json())
      .then(setExpenses)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, category, fundingSource, expenseFor, fundsType, month, year]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  function handleExport() {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (fundingSource) params.set("fundingSource", fundingSource);
    if (expenseFor) params.set("expenseFor", expenseFor);
    if (fundsType) params.set("fundsType", fundsType);
    window.open(`/api/export?${params}`, "_blank");
  }

  function clearFilters() {
    setSearch("");
    setCategory("");
    setFundingSource("");
    setExpenseFor("");
    setFundsType("");
    setMonth("");
    setYear("");
  }

  const hasFilters =
    search || category || fundingSource || expenseFor || fundsType || month || year;

  return (
    <div className="space-y-6">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1>All Expenses</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading
              ? "Loading…"
              : `${expenses.length} expense${expenses.length !== 1 ? "s" : ""} found`}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary text-sm">
            ↓ Export CSV
          </button>
          <Link href="/expenses/new" className="btn-primary">
            + Add Expense
          </Link>
        </div>
      </div>

      {/* ── Filter panel ──────────────────────────────────────────────────── */}
      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-forest-600 uppercase tracking-wide">
          Filters
        </h3>

        {/* Search */}
        <div>
          <label className="label">Search</label>
          <input
            type="text"
            className="input"
            placeholder="Search by title or notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter dropdowns grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="label">Category</label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Source</label>
            <select className="input" value={fundingSource} onChange={(e) => setFundingSource(e.target.value)}>
              <option value="">All</option>
              {fundingSources.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">For</label>
            <select className="input" value={expenseFor} onChange={(e) => setExpenseFor(e.target.value)}>
              <option value="">All</option>
              <option value="ME">Me</option>
              <option value="HOUSEHOLD">Household</option>
              <option value="HUBBY">Hubby</option>
            </select>
          </div>

          <div>
            <label className="label">Funds Type</label>
            <select className="input" value={fundsType} onChange={(e) => setFundsType(e.target.value)}>
              <option value="">All</option>
              <option value="MINE">My Money</option>
              <option value="BORROWED">Borrowed</option>
            </select>
          </div>

          <div>
            <label className="label">Month</label>
            <select className="input" value={month} onChange={(e) => setMonth(e.target.value)}>
              <option value="">All months</option>
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Year</label>
            <select className="input" value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="">All years</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-gold-600 font-medium hover:underline"
          >
            ✕ Clear all filters
          </button>
        )}
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="card text-center py-16">
          <p className="text-forest-300 animate-pulse text-sm">Loading expenses…</p>
        </div>
      ) : (
        <ExpenseTable expenses={expenses} onRefresh={loadExpenses} />
      )}
    </div>
  );
}
