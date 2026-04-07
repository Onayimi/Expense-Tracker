/**
 * ExpenseForm
 * -----------
 * Reusable form for creating and editing expenses.
 * Styled with the forest green + gold + mint brand palette.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, type FundsType, type ExpenseFor } from "@/types";
import { todayInputDate, validateExpenseForm } from "@/lib/utils";

interface FundingSource {
  id: number;
  name: string;
}

interface ExpenseFormProps {
  initialData?: {
    date: string;
    title: string;
    category: string;
    amount: number;
    fundingSourceId: number;
    fundsType: FundsType;
    expenseFor: ExpenseFor;
    notes: string;
  };
  expenseId?: number;
}

export default function ExpenseForm({ initialData, expenseId }: ExpenseFormProps) {
  const router = useRouter();
  const isEditing = !!expenseId;

  const [date, setDate] = useState(initialData?.date ?? todayInputDate());
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [category, setCategory] = useState(initialData?.category ?? "");
  const [amount, setAmount] = useState(
    initialData?.amount ? String(initialData.amount) : ""
  );
  const [fundingSourceId, setFundingSourceId] = useState(
    initialData?.fundingSourceId ? String(initialData.fundingSourceId) : ""
  );
  const [fundsType, setFundsType] = useState<FundsType>(
    initialData?.fundsType ?? "MINE"
  );
  const [expenseFor, setExpenseFor] = useState<ExpenseFor>(
    initialData?.expenseFor ?? "ME"
  );
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  const [fundingSources, setFundingSources] = useState<FundingSource[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/funding-sources")
      .then((r) => r.json())
      .then(setFundingSources)
      .catch(() => setError("Could not load funding sources"));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validateExpenseForm({
      title,
      amount,
      category,
      date,
      fundingSourceId,
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        date,
        title: title.trim(),
        category,
        amount: parseFloat(amount),
        fundingSourceId: parseInt(fundingSourceId),
        fundsType,
        expenseFor,
        notes: notes.trim(),
      };

      const url = isEditing ? `/api/expenses/${expenseId}` : "/api/expenses";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Something went wrong");
      }

      router.push("/expenses");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Error banner ──────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 bg-crimson-50 border border-crimson-200 rounded-xl text-crimson text-sm font-medium">
          {error}
        </div>
      )}

      {/* ── Date + Title ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="date">
            Date <span className="text-crimson">*</span>
          </label>
          <input
            id="date"
            type="date"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="title">
            Title <span className="text-crimson">*</span>
          </label>
          <input
            id="title"
            type="text"
            className="input"
            placeholder="e.g. Weekly groceries"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
      </div>

      {/* ── Category + Amount ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="category">
            Category <span className="text-crimson">*</span>
          </label>
          <select
            id="category"
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">Select category…</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="amount">
            Amount (£) <span className="text-crimson">*</span>
          </label>
          <input
            id="amount"
            type="number"
            className="input"
            placeholder="0.00"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
      </div>

      {/* ── Funding Source ────────────────────────────────────────────── */}
      <div>
        <label className="label" htmlFor="fundingSource">
          Source of Funds <span className="text-crimson">*</span>
        </label>
        <select
          id="fundingSource"
          className="input"
          value={fundingSourceId}
          onChange={(e) => setFundingSourceId(e.target.value)}
          required
        >
          <option value="">Select funding source…</option>
          {fundingSources.map((source) => (
            <option key={source.id} value={source.id}>
              {source.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-1">Where is the money coming from?</p>
      </div>

      {/* ── Funds Type ────────────────────────────────────────────────── */}
      <div>
        <label className="label">
          Funds Type <span className="text-crimson">*</span>
        </label>
        <div className="flex gap-4">
          {/* MINE */}
          <label
            className={`flex items-center gap-2.5 cursor-pointer px-4 py-3 rounded-xl border-2 transition-colors flex-1 ${
              fundsType === "MINE"
                ? "border-forest bg-forest-50"
                : "border-gray-200 hover:border-mint-300"
            }`}
          >
            <input
              type="radio"
              name="fundsType"
              value="MINE"
              checked={fundsType === "MINE"}
              onChange={() => setFundsType("MINE")}
              className="accent-forest"
            />
            <div>
              <span className="text-sm font-semibold text-forest block">My own money</span>
              <span className="text-xs text-gray-400">Paying from your own funds</span>
            </div>
          </label>

          {/* BORROWED */}
          <label
            className={`flex items-center gap-2.5 cursor-pointer px-4 py-3 rounded-xl border-2 transition-colors flex-1 ${
              fundsType === "BORROWED"
                ? "border-gold bg-gold-50"
                : "border-gray-200 hover:border-gold-200"
            }`}
          >
            <input
              type="radio"
              name="fundsType"
              value="BORROWED"
              checked={fundsType === "BORROWED"}
              onChange={() => setFundsType("BORROWED")}
              className="accent-gold-500"
            />
            <div>
              <span className="text-sm font-semibold text-forest block">Borrowed money</span>
              <span className="text-xs text-gray-400">Will be tracked as outstanding</span>
            </div>
          </label>
        </div>

        {/* Borrowed info callout */}
        {fundsType === "BORROWED" && (
          <div className="mt-3 p-3 bg-gold-50 border border-gold-200 rounded-xl text-sm text-gold-700 flex gap-2">
            <span className="text-base">⚠️</span>
            <p>
              <strong>Borrowed money:</strong> This expense will be marked as{" "}
              <strong>Outstanding</strong> and shown in your{" "}
              <em>Borrowed Money</em> summary until you mark it as repaid.
            </p>
          </div>
        )}
      </div>

      {/* ── Expense For ───────────────────────────────────────────────── */}
      <div>
        <label className="label">
          This expense is for <span className="text-crimson">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {(
            [
              { value: "ME", label: "Me", sub: "Personal expense" },
              { value: "HOUSEHOLD", label: "Household", sub: "Shared expense" },
              { value: "HUBBY", label: "Hubby", sub: "He owes me" },
            ] as const
          ).map((option) => (
            <label
              key={option.value}
              className={`flex flex-col items-center gap-1 cursor-pointer px-3 py-3 rounded-xl border-2 text-center transition-colors ${
                expenseFor === option.value
                  ? option.value === "HUBBY"
                    ? "border-crimson bg-crimson-50"
                    : "border-forest bg-forest-50"
                  : "border-gray-200 hover:border-mint-300"
              }`}
            >
              <input
                type="radio"
                name="expenseFor"
                value={option.value}
                checked={expenseFor === option.value}
                onChange={() => setExpenseFor(option.value)}
                className="sr-only"
              />
              <span className="text-sm font-semibold text-forest">{option.label}</span>
              <span className="text-xs text-gray-400">{option.sub}</span>
            </label>
          ))}
        </div>

        {/* Hubby info callout */}
        {expenseFor === "HUBBY" && (
          <div className="mt-3 p-3 bg-crimson-50 border border-crimson-200 rounded-xl text-sm text-crimson-600 flex gap-2">
            <span className="text-base">💸</span>
            <p>
              <strong>Hubby owes you:</strong> This expense will be marked as{" "}
              <strong>Owes Me</strong> and shown in your{" "}
              <em>Reimbursements</em> summary until he pays you back.
            </p>
          </div>
        )}
      </div>

      {/* ── Notes ─────────────────────────────────────────────────────── */}
      <div>
        <label className="label" htmlFor="notes">
          Notes{" "}
          <span className="text-gray-400 font-normal text-xs">(optional)</span>
        </label>
        <textarea
          id="notes"
          className="input resize-none"
          rows={3}
          placeholder="Any extra details about this expense…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* ── Submit ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-2 border-t border-mint-100">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting
            ? "Saving…"
            : isEditing
            ? "Save Changes"
            : "Add Expense"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => router.back()}
          disabled={submitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
