"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import { formatCurrency, formatDate, todayISO } from "@/lib/utils";
import type { Expense, ExpenseCategory, ExpenseLineItem } from "@/types";

interface LineItemInput { description: string; amount: string; }

function ExpensesPageInner() {
  const searchParams = useSearchParams();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(searchParams.get("add") === "1");
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [filterCat, setFilterCat] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    amount: "", date: todayISO(), notes: "", categoryId: "",
    isHubbyBorrow: false, hubbyDescription: "", useLineItems: false,
  });
  const [lineItems, setLineItems] = useState<LineItemInput[]>([{ description: "", amount: "" }]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [expRes, catRes] = await Promise.all([
        fetch(`/api/expenses${filterCat ? `?categoryId=${filterCat}` : ""}`),
        fetch("/api/categories"),
      ]);
      const [expData, catData] = await Promise.all([expRes.json(), catRes.json()]);
      setExpenses(expData);
      setCategories(catData);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [filterCat]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetForm = (cats: ExpenseCategory[] = categories) => {
    setForm({ amount: "", date: todayISO(), notes: "", categoryId: cats[0]?.id ?? "", isHubbyBorrow: false, hubbyDescription: "", useLineItems: false });
    setLineItems([{ description: "", amount: "" }]);
    setError("");
  };

  const openAdd = () => { setEditing(null); resetForm(); setShowForm(true); };

  const openEdit = (exp: Expense) => {
    setEditing(exp);
    setForm({
      amount: String(exp.amount), date: exp.date.split("T")[0], notes: exp.notes ?? "",
      categoryId: exp.categoryId, isHubbyBorrow: exp.isHubbyBorrow,
      hubbyDescription: exp.hubbyBorrow?.description ?? "",
      useLineItems: exp.lineItems.length > 0,
    });
    setLineItems(exp.lineItems.length > 0
      ? exp.lineItems.map((li: ExpenseLineItem) => ({ description: li.description, amount: String(li.amount) }))
      : [{ description: "", amount: "" }]);
    setError("");
    setShowForm(true);
  };

  const addLineItem = () => setLineItems(li => [...li, { description: "", amount: "" }]);
  const removeLineItem = (i: number) => setLineItems(li => li.filter((_, idx) => idx !== i));
  const updateLineItem = (i: number, field: "description" | "amount", val: string) =>
    setLineItems(li => li.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  const lineItemTotal = lineItems.reduce((s, li) => s + (parseFloat(li.amount) || 0), 0);

  const handleSave = async () => {
    if (!form.categoryId) { setError("Select a category"); return; }
    if (!form.date) { setError("Pick a date"); return; }
    let finalAmount = parseFloat(form.amount);
    if (form.useLineItems) {
      const valid = lineItems.filter(li => li.description.trim() && parseFloat(li.amount) > 0);
      if (!valid.length) { setError("Add at least one line item"); return; }
      finalAmount = valid.reduce((s, li) => s + parseFloat(li.amount), 0);
    }
    if (!finalAmount || finalAmount <= 0) { setError("Enter a valid amount"); return; }

    setSaving(true); setError("");
    try {
      const validItems = form.useLineItems
        ? lineItems.filter(li => li.description.trim() && parseFloat(li.amount) > 0)
            .map(li => ({ description: li.description.trim(), amount: parseFloat(li.amount) }))
        : [];
      const url = editing ? `/api/expenses/${editing.id}` : "/api/expenses";
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalAmount, date: form.date, notes: form.notes, categoryId: form.categoryId, isHubbyBorrow: form.isHubbyBorrow, hubbyDescription: form.hubbyDescription, lineItems: validItems }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed"); return; }
      setShowForm(false); setEditing(null); fetchData();
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await fetch(`/api/expenses/${deleteTarget}`, { method: "DELETE" }); setDeleteTarget(null); fetchData(); }
    finally { setDeleting(false); }
  };

  const totalFiltered = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1>Expenses</h1>
          <p className="text-xs text-gray-500">{expenses.length} entries · {formatCurrency(totalFiltered)}</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Add
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        <button onClick={() => setFilterCat("")} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${!filterCat ? "bg-forest text-white border-forest" : "bg-white text-gray-600 border-sage-200"}`}>All</button>
        {categories.map(c => (
          <button key={c.id} onClick={() => setFilterCat(filterCat === c.id ? "" : c.id)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filterCat === c.id ? "bg-forest text-white border-forest" : "bg-white text-gray-600 border-sage-200"}`}>{c.name}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[0,1,2].map(i => <div key={i} className="h-16 bg-sage-100 rounded-xl animate-pulse" />)}</div>
      ) : expenses.length === 0 ? (
        <EmptyState icon="🧾" title="No expenses yet" subtitle="Start tracking your spending by category" action={<button onClick={openAdd} className="btn-primary">Add Expense</button>} />
      ) : (
        <div className="space-y-2">
          {expenses.map(exp => (
            <div key={exp.id} className="card-sm">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${exp.isHubbyBorrow ? "bg-crimson-100 text-crimson" : "bg-forest-100 text-forest"}`}>
                  {exp.category.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedId(expandedId === exp.id ? null : exp.id)}>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-semibold text-forest">{exp.category.name}</p>
                    {exp.isHubbyBorrow && <span className="text-xs bg-crimson-100 text-crimson px-1.5 py-0.5 rounded-full font-medium">Hubby</span>}
                    {exp.lineItems.length > 0 && <span className="text-xs text-gray-400">({exp.lineItems.length} items)</span>}
                  </div>
                  <p className="text-xs text-gray-400">{formatDate(exp.date)}{exp.notes ? ` · ${exp.notes}` : ""}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-sm font-bold text-forest">{formatCurrency(exp.amount)}</span>
                  <button onClick={() => openEdit(exp)} className="btn-ghost p-1.5 ml-1"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                  <button onClick={() => setDeleteTarget(exp.id)} className="btn-ghost p-1.5 text-crimson-400"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
              </div>
              {expandedId === exp.id && exp.lineItems.length > 0 && (
                <div className="mt-3 pt-3 border-t border-sage-100 space-y-1">
                  {exp.lineItems.map(li => (
                    <div key={li.id} className="flex justify-between text-xs text-gray-600">
                      <span>{li.description}</span><span className="font-medium">{formatCurrency(li.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
              {exp.isHubbyBorrow && exp.hubbyBorrow && (
                <div className="mt-2 pt-2 border-t border-crimson-100 flex justify-between text-xs">
                  <span className="text-crimson">Still owed by hubby</span>
                  <span className="font-semibold text-crimson">{formatCurrency(exp.hubbyBorrow.totalAmount - exp.hubbyBorrow.paidAmount)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null); setError(""); }} title={editing ? "Edit Expense" : "Add Expense"} size="lg">
        <div className="space-y-4">
          {error && <p className="text-xs text-crimson bg-crimson-50 px-3 py-2 rounded-lg">{error}</p>}

          <div>
            <label className="label">Category</label>
            <div className="relative">
              <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} className="select pr-8">
                <option value="">Select category…</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          <div>
            <label className="label">Date</label>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="input" />
          </div>

          <div className="flex items-center gap-3 py-1">
            <button type="button" onClick={() => setForm(f => ({ ...f, useLineItems: !f.useLineItems }))} className={`relative w-10 h-5 rounded-full transition-colors ${form.useLineItems ? "bg-forest" : "bg-gray-200"}`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.useLineItems ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
            <span className="text-sm text-gray-600">Add itemized breakdown</span>
          </div>

          {form.useLineItems ? (
            <div className="space-y-2">
              <label className="label">Line Items</label>
              {lineItems.map((li, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input type="text" placeholder="Item name" value={li.description} onChange={e => updateLineItem(i, "description", e.target.value)} className="input flex-1" />
                  <div className="relative w-28 flex-shrink-0">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input type="number" step="0.01" min="0" placeholder="0.00" value={li.amount} onChange={e => updateLineItem(i, "amount", e.target.value)} className="input pl-7" />
                  </div>
                  {lineItems.length > 1 && <button onClick={() => removeLineItem(i)} className="text-gray-400 hover:text-crimson p-1 flex-shrink-0"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>}
                </div>
              ))}
              <div className="flex items-center justify-between">
                <button onClick={addLineItem} className="btn-ghost text-xs">+ Add item</button>
                {lineItemTotal > 0 && <p className="text-xs text-gray-500">Total: <strong>{formatCurrency(lineItemTotal)}</strong></p>}
              </div>
            </div>
          ) : (
            <div>
              <label className="label">Amount</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input type="number" step="0.01" min="0" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="input pl-7" />
              </div>
            </div>
          )}

          <div>
            <label className="label">Notes (optional)</label>
            <input type="text" placeholder="Optional note" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input" />
          </div>

          <div className={`rounded-xl p-3 border transition-colors ${form.isHubbyBorrow ? "bg-crimson-50 border-crimson-200" : "bg-sage-50 border-sage-200"}`}>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setForm(f => ({ ...f, isHubbyBorrow: !f.isHubbyBorrow }))} className={`relative w-10 h-5 rounded-full transition-colors ${form.isHubbyBorrow ? "bg-crimson" : "bg-gray-200"}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isHubbyBorrow ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
              <span className={`text-sm font-medium ${form.isHubbyBorrow ? "text-crimson-700" : "text-gray-600"}`}>Paid on behalf of hubby (he will repay)</span>
            </div>
            {form.isHubbyBorrow && (
              <input type="text" placeholder="What did you pay for? (optional)" value={form.hubbyDescription} onChange={e => setForm(f => ({ ...f, hubbyDescription: e.target.value }))} className="input text-xs mt-2" />
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="btn-secondary flex-1" disabled={saving}>Cancel</button>
            <button onClick={handleSave} className="btn-primary flex-1" disabled={saving}>{saving ? "Saving…" : editing ? "Update" : "Add Expense"}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} message="Delete this expense? Any hubby borrow record and repayments will also be removed." loading={deleting} />
    </div>
  );
}

export default function ExpensesPage() {
  return <Suspense><ExpensesPageInner /></Suspense>;
}
