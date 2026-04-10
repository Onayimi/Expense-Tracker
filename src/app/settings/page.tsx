"use client";

import { useState, useEffect, useCallback } from "react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { IncomeSource, ExpenseCategory, AppSettings } from "@/types";

function ManagerSection({
  title,
  items,
  onAdd,
  onRename,
  onDelete,
}: {
  title: string;
  items: (IncomeSource | ExpenseCategory)[];
  onAdd: (name: string) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = async () => {
    if (!newName.trim()) { setError("Name is required"); return; }
    setSaving(true); setError("");
    try { await onAdd(newName.trim()); setNewName(""); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  };

  const handleRename = async () => {
    if (!editId || !editName.trim()) return;
    setSaving(true); setError("");
    try { await onRename(editId, editName.trim()); setEditId(null); setEditName(""); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try { await onDelete(deleteId); setDeleteId(null); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  };

  return (
    <div className="card space-y-3">
      <h2>{title}</h2>
      {error && <p className="text-xs text-crimson bg-crimson-50 px-3 py-2 rounded-lg">{error}</p>}

      {/* Add new */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder={`New ${title.toLowerCase().replace("manage ", "")}…`}
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleAdd(); }}
          className="input flex-1"
        />
        <button onClick={handleAdd} disabled={saving} className="btn-gold px-4">Add</button>
      </div>

      {/* List */}
      <div className="space-y-1.5">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-sage-50 border border-sage-100">
            {editId === item.id ? (
              <>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setEditId(null); }}
                  className="input flex-1 py-1.5 text-xs"
                  autoFocus
                />
                <button onClick={handleRename} disabled={saving} className="btn-primary text-xs px-3 py-1.5">Save</button>
                <button onClick={() => setEditId(null)} className="btn-ghost text-xs px-2 py-1.5">Cancel</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-forest font-medium">{item.name}</span>
                {item.isDefault && <span className="text-xs text-gray-400 italic">default</span>}
                <button onClick={() => { setEditId(item.id); setEditName(item.name); }} className="btn-ghost p-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button onClick={() => setDeleteId(item.id)} className="btn-ghost p-1.5 text-crimson-400">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-gray-400 text-center py-3">No items yet</p>}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        message="Delete this item? It cannot be deleted if entries are using it."
        loading={saving}
      />
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [sources, setSources] = useState<IncomeSource[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [settingsSaved, setSettingsSaved] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, cRes, appRes] = await Promise.all([
        fetch("/api/income-sources"),
        fetch("/api/categories"),
        fetch("/api/settings"),
      ]);
      const [s, c, app] = await Promise.all([sRes.json(), cRes.json(), appRes.json()]);
      setSources(s);
      setCategories(c);
      setSettings(app);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true); setSettingsError(""); setSettingsSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) { setSettingsError("Failed to save"); return; }
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    } finally { setSaving(false); }
  };

  const apiCall = async (url: string, method: string, body?: unknown) => {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.error ?? "Failed");
    }
    return res.json();
  };

  const addSource = async (name: string) => {
    await apiCall("/api/income-sources", "POST", { name });
    await fetchData();
  };
  const renameSource = async (id: string, name: string) => {
    await apiCall(`/api/income-sources/${id}`, "PUT", { name });
    await fetchData();
  };
  const deleteSource = async (id: string) => {
    await apiCall(`/api/income-sources/${id}`, "DELETE");
    await fetchData();
  };

  const addCategory = async (name: string) => {
    await apiCall("/api/categories", "POST", { name });
    await fetchData();
  };
  const renameCategory = async (id: string, name: string) => {
    await apiCall(`/api/categories/${id}`, "PUT", { name });
    await fetchData();
  };
  const deleteCategory = async (id: string) => {
    await apiCall(`/api/categories/${id}`, "DELETE");
    await fetchData();
  };

  if (loading) {
    return <div className="space-y-4 animate-pulse"><div className="h-40 bg-sage-100 rounded-2xl" /><div className="h-64 bg-sage-100 rounded-2xl" /><div className="h-64 bg-sage-100 rounded-2xl" /></div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1>Settings</h1>
        <p className="text-xs text-gray-500">Manage your app preferences</p>
      </div>

      {/* App settings */}
      <div className="card space-y-4">
        <h2>App Preferences</h2>
        {settingsError && <p className="text-xs text-crimson bg-crimson-50 px-3 py-2 rounded-lg">{settingsError}</p>}
        {settingsSaved && <p className="text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg">Settings saved!</p>}

        {settings && (
          <>
            <div>
              <label className="label">App Name</label>
              <input type="text" value={settings.appName} onChange={e => setSettings(s => s ? { ...s, appName: e.target.value } : s)} className="input" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Currency Code</label>
                <input type="text" maxLength={3} value={settings.currency} onChange={e => setSettings(s => s ? { ...s, currency: e.target.value.toUpperCase() } : s)} className="input" placeholder="USD" />
              </div>
              <div>
                <label className="label">Currency Symbol</label>
                <input type="text" maxLength={3} value={settings.currencySymbol} onChange={e => setSettings(s => s ? { ...s, currencySymbol: e.target.value } : s)} className="input" placeholder="$" />
              </div>
            </div>
            <button onClick={saveSettings} disabled={saving} className="btn-primary w-full">
              {saving ? "Saving…" : "Save Settings"}
            </button>
          </>
        )}
      </div>

      {/* Data export */}
      <div className="card">
        <h2 className="mb-3">Data Export</h2>
        <p className="text-xs text-gray-500 mb-3">Export all your transactions as a CSV file for use in Excel or Google Sheets.</p>
        <a href="/api/export" download className="btn-secondary w-full text-center">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Download CSV Export
        </a>
      </div>

      {/* Manage income sources */}
      <ManagerSection
        title="Income Sources"
        items={sources}
        onAdd={addSource}
        onRename={renameSource}
        onDelete={deleteSource}
      />

      {/* Manage categories */}
      <ManagerSection
        title="Expense Categories"
        items={categories}
        onAdd={addCategory}
        onRename={renameCategory}
        onDelete={deleteCategory}
      />

      {/* About */}
      <div className="card text-center py-4">
        <div className="w-12 h-12 rounded-2xl bg-forest flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-gold" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
        </div>
        <p className="text-sm font-bold text-forest">Vela</p>
        <p className="text-xs text-gray-400">Personal Finance Tracker · v1.0</p>
      </div>
    </div>
  );
}
