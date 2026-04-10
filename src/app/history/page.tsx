"use client";

import { useState, useEffect, useCallback } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Income, Expense, HubbyBorrow, Repayment } from "@/types";

type TxType = "all" | "income" | "expense" | "hubby" | "repayment";

interface MixedTransaction {
  id: string;
  type: TxType;
  date: string;
  label: string;
  sublabel: string;
  amount: number;
  sign: 1 | -1;
  badge?: string;
}

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<MixedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<TxType>("all");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [incRes, expRes, hubbyRes] = await Promise.all([
        fetch("/api/income"),
        fetch("/api/expenses"),
        fetch("/api/hubby"),
      ]);
      const [incData, expData, hubbyData]: [Income[], Expense[], HubbyBorrow[]] = await Promise.all([
        incRes.json(), expRes.json(), hubbyRes.json(),
      ]);

      const txs: MixedTransaction[] = [];

      for (const inc of incData) {
        txs.push({
          id: `inc-${inc.id}`, type: "income",
          date: inc.date, label: inc.source.name,
          sublabel: inc.notes ?? "",
          amount: inc.amount, sign: 1,
        });
      }

      for (const exp of expData) {
        if (exp.isHubbyBorrow) {
          txs.push({
            id: `exp-hubby-${exp.id}`, type: "hubby",
            date: exp.date, label: exp.category.name,
            sublabel: `${exp.hubbyBorrow?.description ?? "For hubby"} · ${exp.notes ?? ""}`.trim().replace(/· $/, ""),
            amount: exp.amount, sign: -1,
            badge: exp.hubbyBorrow?.status,
          });
        } else {
          txs.push({
            id: `exp-${exp.id}`, type: "expense",
            date: exp.date, label: exp.category.name,
            sublabel: exp.notes ?? "",
            amount: exp.amount, sign: -1,
          });
        }
      }

      for (const b of hubbyData) {
        for (const rep of b.repayments as Repayment[]) {
          txs.push({
            id: `rep-${rep.id}`, type: "repayment",
            date: rep.date, label: "Hubby Repayment",
            sublabel: `${b.expense?.category?.name ?? ""}${rep.notes ? ` · ${rep.notes}` : ""}`,
            amount: rep.amount, sign: 1,
          });
        }
      }

      setTransactions(txs);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = transactions
    .filter(tx => filterType === "all" || tx.type === filterType)
    .filter(tx => {
      if (search) {
        const q = search.toLowerCase();
        return tx.label.toLowerCase().includes(q) || tx.sublabel.toLowerCase().includes(q);
      }
      return true;
    })
    .filter(tx => {
      if (from && new Date(tx.date) < new Date(from)) return false;
      if (to && new Date(tx.date) > new Date(to + "T23:59:59")) return false;
      return true;
    })
    .sort((a, b) => {
      const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
      return sort === "newest" ? diff : -diff;
    });

  const typeColor: Record<string, string> = {
    income: "bg-green-100 text-green-700",
    expense: "bg-forest-100 text-forest",
    hubby: "bg-crimson-100 text-crimson",
    repayment: "bg-gold-100 text-gold-700",
  };

  const typeIcon: Record<string, string> = {
    income: "↑",
    expense: "↓",
    hubby: "H",
    repayment: "R",
  };

  const TYPE_TABS: { key: TxType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "income", label: "Income" },
    { key: "expense", label: "Expenses" },
    { key: "hubby", label: "Hubby" },
    { key: "repayment", label: "Repayments" },
  ];

  const total = filtered.reduce((s, t) => s + t.sign * t.amount, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1>History</h1>
        <p className="text-xs text-gray-500">{filtered.length} transactions</p>
      </div>

      {/* Type tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {TYPE_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterType(tab.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filterType === tab.key ? "bg-forest text-white border-forest" : "bg-white text-gray-600 border-sage-200"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card space-y-3">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Search transactions…" value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input text-sm" />
          </div>
          <div>
            <label className="label">To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="input text-sm" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button onClick={() => setSort("newest")} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${sort === "newest" ? "bg-forest text-white" : "bg-sage-100 text-gray-600"}`}>Newest first</button>
            <button onClick={() => setSort("oldest")} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${sort === "oldest" ? "bg-forest text-white" : "bg-sage-100 text-gray-600"}`}>Oldest first</button>
          </div>
          {(search || from || to) && (
            <button onClick={() => { setSearch(""); setFrom(""); setTo(""); }} className="text-xs text-crimson hover:underline">Clear filters</button>
          )}
        </div>
      </div>

      {/* Net total */}
      {filtered.length > 0 && (
        <div className={`rounded-xl px-4 py-2.5 border text-sm font-semibold flex justify-between ${total >= 0 ? "bg-green-50 border-green-200 text-green-800" : "bg-crimson-50 border-crimson-200 text-crimson-700"}`}>
          <span>Net for this view</span>
          <span>{total >= 0 ? "+" : "-"}{formatCurrency(Math.abs(total))}</span>
        </div>
      )}

      {/* Transaction list */}
      {loading ? (
        <div className="space-y-2">{[0,1,2,3,4].map(i => <div key={i} className="h-14 bg-sage-100 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-3xl mb-3">📋</p>
          <p className="text-sm font-medium text-gray-600">No transactions found</p>
          <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(tx => (
            <div key={tx.id} className="card-sm flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${typeColor[tx.type]}`}>
                {typeIcon[tx.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-forest truncate">{tx.label}</p>
                  {tx.badge && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                      tx.badge === "PAID" ? "bg-green-100 text-green-700" :
                      tx.badge === "PARTIAL" ? "bg-blue-100 text-blue-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>{tx.badge === "OUTSTANDING" ? "Unpaid" : tx.badge === "PARTIAL" ? "Partial" : "Paid"}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400">{formatDate(tx.date)}{tx.sublabel ? ` · ${tx.sublabel}` : ""}</p>
              </div>
              <span className={`text-sm font-bold flex-shrink-0 ${tx.sign === 1 ? "text-green-700" : "text-forest"}`}>
                {tx.sign === 1 ? "+" : "-"}{formatCurrency(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
