/** Format a number as currency — e.g. 45.5 → "£45.50" */
export function formatCurrency(amount: number): string {
  return `£${amount.toFixed(2)}`;
}

/** Format "YYYY-MM-DD" → "15 Jan 2024" */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  // Parse manually to avoid timezone shifting
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Get today's date as a "YYYY-MM-DD" string */
export function todayString(): string {
  const d = new Date();
  return toDateString(d);
}

/** Convert a JS Date to "YYYY-MM-DD" string */
export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Parse "YYYY-MM-DD" into a JS Date at noon (avoids timezone shifting to previous day) */
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}
