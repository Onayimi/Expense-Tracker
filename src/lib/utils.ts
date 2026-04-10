// ─── Currency Formatting ──────────────────────────────────────────────────────

export function formatCurrency(amount: number, symbol = "$"): string {
  return `${symbol}${Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ─── Date Formatting ──────────────────────────────────────────────────────────

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateInput(date: string | Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatMonthYear(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function todayISO(): string {
  const d = new Date();
  return formatDateInput(d);
}

// ─── Month Helpers ────────────────────────────────────────────────────────────

export function startOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

// ─── Status Helpers ───────────────────────────────────────────────────────────

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    OUTSTANDING: "Outstanding",
    PARTIAL: "Partially Paid",
    PAID: "Fully Paid",
  };
  return map[status] ?? status;
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    OUTSTANDING: "text-amber-700 bg-amber-50 border-amber-300",
    PARTIAL: "text-blue-700 bg-blue-50 border-blue-300",
    PAID: "text-green-700 bg-green-50 border-green-300",
  };
  return map[status] ?? "text-gray-600 bg-gray-50 border-gray-200";
}

// ─── Number Helpers ───────────────────────────────────────────────────────────

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function pct(part: number, total: number): number {
  if (total === 0) return 0;
  return clamp((part / total) * 100, 0, 100);
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

export function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown): string => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}
