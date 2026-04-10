"use client";

import { useState, useEffect, useCallback } from "react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate, todayISO, pct } from "@/lib/utils";
import type { HubbyBorrow } from "@/types";

type Tab = "outstanding" | "partial" | "paid" | "all";

export default function HubbyPage() {
  const [borrows, setBorrows] = useState<HubbyBorrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("outstanding");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Repayment modal
  const [repayTarget, setRepayTarget] = useState<HubbyBorrow | null>(null);
  const [repayForm, setRepayForm] = useState({ amount: "", date: todayISO(), notes: "" });
  const [repayError, setRepayError] = useState("");
  const [repaying, setRepaying] = useState(false);

  // Delete repayment
  const [deleteRepaymentTarget, setDeleteRepaymentTarget] = useState<string | null>(null);
  const [deletingRepayment, setDeletingRepayment] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hubby");
      const data = await res.json();
      setBorrows(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = borrows.filter(b => {
    if (activeTab === "all") return true;
    return b.status.toLowerCase() === activeTab;
  });

  const totals = {
    total: borrows.reduce((s, b) => s + b.totalAmount, 0),
    paid: borrows.reduce((s, b) => s + b.paidAmount, 0),
    outstanding: borrows.filter(b => b.status !== "PAID").reduce((s, b) => s + (b.totalAmount - b.paidAmount), 0),
  };

  const openRepay = (borrow: HubbyBorrow) => {
    const remaining = borrow.totalAmount - borrow.paidAmount;
    setRepayTarget(borrow);
    setRepayForm({ amount: remaining.toFixed(2), date: todayISO(), notes: "" });
    setRepayError("");
  };

  const handleRepay = async () => {
    if (!repayTarget) return;
    const amount = parseFloat(repayForm.amount);
    if (!amount || amount <= 0) { setRepayError("Enter a valid amount"); return; }
    const remaining = repayTarget.totalAmount - repayTarget.paidAmount;
    if (amount > remaining + 0.001) { setRepayError(`Cannot exceed remaining balance of ${formatCurrency(remaining)}`); return; }

    setRepaying(true); setRepayError("");
    try {
      const res = await fetch("/api/repayments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hubbyBorrowId: repayTarget.id, amount, date: repayForm.date, notes: repayForm.notes }),
      });
      if (!res.ok) { const d = await res.json(); setRepayError(d.error ?? "Failed"); return; }
      setRepayTarget(null);
      fetchData();
    } catch { setRepayError("Network error"); }
    finally { setRepaying(false); }
  };

  const handleDeleteRepayment = async () => {
    if (!deleteRepaymentTarget) return;
    setDeletingRepayment(true);
    try {
      await fetch(`/api/repayments/${deleteRepaymentTarget}`, { method: "DELETE" });
      setDeleteRepaymentTarget(null);
      fetchData();
    } finally { setDeletingRepayment(false); }
  };

  const TABS: { key: Tab; label: string; color: string }[] = [
    { key: "outstanding", label: "Outstanding", color: "text-amber-700 bg-amber-50 border-amber-200" },
    { key: "partial", label: "Partial", color: "text-blue-700 bg-blue-50 border-blue-200" },
    { key: "paid", label: "Paid", color: "text-green-700 bg-green-50 border-green-200" },
    { key: "all", label: "All", color: "" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1>Hubby Tracker</h1>
        <p className="text-xs text-gray-500">Track what hubby owes you</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-crimson-50 rounded-xl p-3 border border-crimson-100 text-center">
          <p className="text-xs text-crimson font-semibold">Outstanding</p>
          <p className="text-base font-bold text-crimson">{formatCurrency(totals.outstanding)}</p>
        </div>
        <div className="bg-gold-50 rounded-xl p-3 border border-gold-100 text-center">
          <p className="text-xs text-gold-700 font-semibold">Repaid</p>
          <p className="text-base font-bold text-gold-700">{formatCurrency(totals.paid)}</p>
        </div>
        <div className="bg-forest-50 rounded-xl p-3 border border-forest-100 text-center">
          <p className="text-xs text-forest font-semibold">Total Lent</p>
          <p className="text-base font-bold text-forest">{formatCurrency(totals.total)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              activeTab === tab.key
                ? tab.key === "all" ? "bg-forest text-white border-forest" : `border ${tab.color}`
                : "bg-white text-gray-500 border-sage-200"
            }`}
          >
            {tab.label}
            <span className="ml-1 opacity-60">({borrows.filter(b => tab.key === "all" ? true : b.status.toLowerCase() === tab.key).length})</span>
          </button>
        ))}
      </div>

      {/* Borrow list */}
      {loading ? (
        <div className="space-y-3">{[0,1,2].map(i => <div key={i} className="h-24 bg-sage-100 rounded-2xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={activeTab === "paid" ? "✅" : "💸"}
          title={activeTab === "paid" ? "No fully paid borrows" : "No outstanding borrows"}
          subtitle={activeTab === "outstanding" ? "When you pay for hubby, add an expense and mark it as Hubby Borrow" : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(borrow => {
            const remaining = borrow.totalAmount - borrow.paidAmount;
            const progress = pct(borrow.paidAmount, borrow.totalAmount);
            const isExpanded = expandedId === borrow.id;

            return (
              <div key={borrow.id} className={`rounded-2xl border overflow-hidden ${
                borrow.status === "PAID" ? "border-green-200 bg-green-50" :
                borrow.status === "PARTIAL" ? "border-blue-200 bg-blue-50" :
                "border-crimson-200 bg-crimson-50"
              }`}>
                {/* Card header */}
                <div className="p-4" onClick={() => setExpandedId(isExpanded ? null : borrow.id)}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold text-forest">{borrow.expense?.category?.name}</p>
                        <Badge status={borrow.status} />
                      </div>
                      {borrow.description && <p className="text-xs text-gray-600">{borrow.description}</p>}
                      <p className="text-xs text-gray-500 mt-0.5">{borrow.expense ? formatDate(borrow.expense.date) : "—"}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-forest">{formatCurrency(remaining)}</p>
                      <p className="text-xs text-gray-400">of {formatCurrency(borrow.totalAmount)}</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 bg-white/60 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${borrow.status === "PAID" ? "bg-green-500" : "bg-gold"}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{progress.toFixed(0)}% repaid</span>
                    <span className="text-xs text-gray-400">{isExpanded ? "▲ hide" : "▼ details"}</span>
                  </div>
                </div>

                {/* Expanded section */}
                {isExpanded && (
                  <div className="bg-white/80 border-t border-white/60 p-4 space-y-3">
                    {/* Action buttons */}
                    {borrow.status !== "PAID" && (
                      <button onClick={() => openRepay(borrow)} className="btn-gold w-full text-sm">
                        Record Repayment
                      </button>
                    )}

                    {/* Repayment history */}
                    {borrow.repayments.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Repayment History</p>
                        <div className="space-y-2">
                          {borrow.repayments.map(rep => (
                            <div key={rep.id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-sage-100">
                              <div>
                                <p className="text-sm font-semibold text-green-700">+{formatCurrency(rep.amount)}</p>
                                <p className="text-xs text-gray-500">{formatDate(rep.date)}{rep.notes ? ` · ${rep.notes}` : ""}</p>
                              </div>
                              <button
                                onClick={() => setDeleteRepaymentTarget(rep.id)}
                                className="text-gray-300 hover:text-crimson p-1"
                                aria-label="Delete repayment"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Line items */}
                    {borrow.expense?.lineItems && borrow.expense.lineItems.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Breakdown</p>
                        <div className="space-y-1">
                          {borrow.expense.lineItems.map(li => (
                            <div key={li.id} className="flex justify-between text-xs text-gray-600 px-2">
                              <span>{li.description}</span><span className="font-medium">{formatCurrency(li.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Repayment Modal */}
      <Modal open={!!repayTarget} onClose={() => { setRepayTarget(null); setRepayError(""); }} title="Record Repayment" size="sm">
        {repayTarget && (
          <div className="space-y-4">
            <div className="bg-forest-50 rounded-xl p-3 border border-forest-100">
              <p className="text-xs text-gray-500">For</p>
              <p className="text-sm font-semibold text-forest">{repayTarget.expense?.category?.name} · {repayTarget.description}</p>
              <p className="text-xs text-gray-500 mt-1">
                Outstanding: <strong className="text-crimson">{formatCurrency(repayTarget.totalAmount - repayTarget.paidAmount)}</strong>
              </p>
            </div>

            {repayError && <p className="text-xs text-crimson bg-crimson-50 px-3 py-2 rounded-lg">{repayError}</p>}

            <div>
              <label className="label">Repayment Amount</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input type="number" step="0.01" min="0.01" value={repayForm.amount} onChange={e => setRepayForm(f => ({ ...f, amount: e.target.value }))} className="input pl-7" />
              </div>
              <button
                className="text-xs text-gold font-semibold mt-1 hover:underline"
                onClick={() => setRepayForm(f => ({ ...f, amount: (repayTarget.totalAmount - repayTarget.paidAmount).toFixed(2) }))}
              >
                Set to full amount
              </button>
            </div>

            <div>
              <label className="label">Date Received</label>
              <input type="date" value={repayForm.date} onChange={e => setRepayForm(f => ({ ...f, date: e.target.value }))} className="input" />
            </div>

            <div>
              <label className="label">Notes (optional)</label>
              <input type="text" placeholder="e.g. cash, bank transfer" value={repayForm.notes} onChange={e => setRepayForm(f => ({ ...f, notes: e.target.value }))} className="input" />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setRepayTarget(null)} className="btn-secondary flex-1" disabled={repaying}>Cancel</button>
              <button onClick={handleRepay} className="btn-gold flex-1" disabled={repaying}>{repaying ? "Saving…" : "Record"}</button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteRepaymentTarget}
        onClose={() => setDeleteRepaymentTarget(null)}
        onConfirm={handleDeleteRepayment}
        message="Remove this repayment? The outstanding balance will be updated."
        loading={deletingRepayment}
      />
    </div>
  );
}
