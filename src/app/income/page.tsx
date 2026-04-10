"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import { formatCurrency, formatDate, todayISO } from "@/lib/utils";
import type { Income, IncomeSource } from "@/types";

function IncomePageInner() {
  const searchParams = useSearchParams();
  const [income, setIncome] = useState<Income[]>([]);
  const [sources, setSources] = useState<IncomeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(searchParams.get("add") === "1");
  const [editing, setEditing] = useState<Income | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [filterSource, setFilterSource] = useState("");
  const [error, setError] = useState("");

  // Form state
  const [form, setForm] = useState({ amount: "", date: todayISO(), notes: "", sourceId: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [incRes, srcRes] = await Promise.all([
        fetch(`/api/income${filterSource ? `?sourceId=${filterSource}` : ""}`),
        fetch("/api/income-sources"),
      ]);
      const [incData, srcData] = await Promise.all([incRes.json(), srcRes.json()]);
      setIncome(incData);
      setSources(srcData);
      if (!form.sourceId && srcData.length > 0) {
        setForm(f => ({ ...f, sourceId: srcData[0].id }));
      }
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [filterSource, form.sourceId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openEdit = (inc: Income) => {
    setEditing(inc);
    setForm({
      amount: String(inc.amount),
      date: inc.date.split("T")[0],
      notes: inc.notes ?? "",
      sourceId: inc.sourceId,
    });
    setError("");
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ amount: "", date: todayISO(), notes: "", sourceId: sources[0]?.id ?? "" });
    setError("");
    setShowAdd(true);
  };

  const handleSave = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) { setError("Enter a valid amount"); return; }
    if (!form.sourceId) { setError("Select a source"); return; }
    if (!form.date) { setError("Pick a date"); return; }
    setSaving(true);
    setError("");
    try {
      const url = editing ? `/api/income/${editing.id}` : "/api/income";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(form.amount), date: form.date, notes: form.notes, sourceId: form.sourceId }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed"); return; }
      setShowAdd(false);
      setEditing(null);
      fetchData();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/income/${deleteTarget}`, { method: "DELETE" });
      setDeleteTarget(null);
      fetchData();
    } finally {
      setDeleting(false);
    }
  };

  const totalFiltered = income.reduce((s, i) => s + i.amount, 0);
  const bySource = sources.map(s => ({
    ...s,
    total: income.filter(i => i.sourceId === s.id).reduce((sum, i) => sum + i.amount, 0),
    count: income.filter(i => i.sourceId === s.id).length,
  })).filter(s => s.count > 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Income</h1>
          <p className="text-xs text-gray-500">{income.length} entries · {formatCurrency(totalFiltered)}</p>
        </div>
        <button onClick={openAdd} className="btn-gold">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add
        </button>
      </div>

      {/* Source filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setFilterSource("")}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${!filterSource ? "bg-forest text-white border-forest" : "bg-white text-gray-600 border-sage-200"}`}
        >
          All
        </button>
        {sources.map(s => (
          <button
            key={s.id}
            onClick={() => setFilterSource(filterSource === s.id ? "" : s.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filterSource === s.id ? "bg-forest text-white border-forest" : "bg-white text-gray-600 border-sage-200"}`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* By-source summary */}
      {bySource.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {bySource.map(s => (
            <div key={s.id} className="bg-green-50 rounded-xl p-3 border border-green-100">
              <p className="text-xs text-green-700 font-semibold">{s.name}</p>
              <p className="text-base font-bold text-green-800">{formatCurrency(s.total)}</p>
              <p className="text-xs text-green-600">{s.count} {s.count === 1 ? "entry" : "entries"}</p>
            </div>
          ))}
        </div>
      )}

      {/* Income list */}
      {loading ? (
        <div className="space-y-2">
          {[0,1,2].map(i => <div key={i} className="h-16 bg-sage-100 rounded-xl animate-pulse" />)}
        </div>
      ) : income.length === 0 ? (
        <EmptyState icon="💰" title="No income recorded" subtitle="Track money coming in and assign a source" action={<button onClick={openAdd} className="btn-gold">Add Income</button>} />
      ) : (
        <div className="space-y-2">
          {income.map(inc => (
            <div key={inc.id} className="card-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm flex-shrink-0">
                {inc.source.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-forest">{inc.source.name}</p>
                <p className="text-xs text-gray-400">{formatDate(inc.date)}{inc.notes ? ` · ${inc.notes}` : ""}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-sm font-bold text-green-700">+{formatCurrency(inc.amount)}</span>
                <button onClick={() => openEdit(inc)} className="btn-ghost p-1.5 ml-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button onClick={() => setDeleteTarget(inc.id)} className="btn-ghost p-1.5 text-crimson-400">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={showAdd || !!editing}
        onClose={() => { setShowAdd(false); setEditing(null); setError(""); }}
        title={editing ? "Edit Income" : "Add Income"}
      >
        <div className="space-y-4">
          {error && <p className="text-xs text-crimson bg-crimson-50 px-3 py-2 rounded-lg">{error}</p>}
          <div>
            <label className="label">Amount</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input type="number" step="0.01" min="0" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="input pl-7" />
            </div>
          </div>
          <div>
            <label className="label">Source</label>
            <div className="relative">
              <select value={form.sourceId} onChange={e => setForm(f => ({ ...f, sourceId: e.target.value }))} className="select pr-8">
                <option value="">Select source…</option>
                {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <input type="text" placeholder="e.g. April salary" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => { setShowAdd(false); setEditing(null); }} className="btn-secondary flex-1" disabled={saving}>Cancel</button>
            <button onClick={handleSave} className="btn-primary flex-1" disabled={saving}>
              {saving ? "Saving…" : editing ? "Update" : "Add Income"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message="Delete this income entry? This cannot be undone."
        loading={deleting}
      />
    </div>
  );
}

export default function IncomePage() {
  return (
    <Suspense>
      <IncomePageInner />
    </Suspense>
  );
}
