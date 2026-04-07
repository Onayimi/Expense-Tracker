/**
 * StatusBadge
 * -----------
 * Coloured pill badge for status values, using the brand palette.
 */

interface BadgeProps {
  value: string | null | undefined;
  variant?: "auto" | "gold" | "mint" | "crimson" | "forest" | "gray";
}

// Auto-map known values to colours
const AUTO_COLORS: Record<string, string> = {
  OUTSTANDING:  "gold",
  REPAID:       "mint",
  OWES_ME:      "crimson",
  PAID_BACK:    "mint",
  MINE:         "forest",
  BORROWED:     "gold",
  ME:           "gray",
  HOUSEHOLD:    "forest",
  HUBBY:        "crimson",
};

// Tailwind classes per colour — using brand palette
const COLOR_CLASSES: Record<string, string> = {
  gold:    "bg-gold-100 text-gold-700 border border-gold-200",
  mint:    "bg-mint-100 text-forest-700 border border-mint-200",
  crimson: "bg-crimson-50 text-crimson-600 border border-crimson-200",
  forest:  "bg-forest-50 text-forest-600 border border-forest-200",
  gray:    "bg-gray-100 text-gray-600 border border-gray-200",
};

const DISPLAY_LABELS: Record<string, string> = {
  OUTSTANDING: "Outstanding",
  REPAID:      "Repaid",
  OWES_ME:     "Owes Me",
  PAID_BACK:   "Paid Back",
  MINE:        "My Money",
  BORROWED:    "Borrowed",
  ME:          "Me",
  HOUSEHOLD:   "Household",
  HUBBY:       "Hubby",
};

export default function StatusBadge({ value, variant = "auto" }: BadgeProps) {
  if (!value) return null;

  const colorKey =
    variant === "auto" ? (AUTO_COLORS[value] ?? "gray") : variant;
  const colorClass = COLOR_CLASSES[colorKey] ?? COLOR_CLASSES.gray;
  const label = DISPLAY_LABELS[value] ?? value;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colorClass}`}
    >
      {label}
    </span>
  );
}
