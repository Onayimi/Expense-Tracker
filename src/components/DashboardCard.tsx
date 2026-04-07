/**
 * DashboardCard
 * -------------
 * Stat card for the dashboard. Left border colour varies by card type.
 */

interface DashboardCardProps {
  title: string;
  value: string;
  subtitle?: string;
  /** Tailwind border-left colour class, e.g. "border-gold" */
  accentClass?: string;
  /** Tailwind text colour for the value, e.g. "text-forest" */
  valueClass?: string;
  icon?: string;
}

export default function DashboardCard({
  title,
  value,
  subtitle,
  accentClass = "border-gold",
  valueClass = "text-forest",
  icon = "📊",
}: DashboardCardProps) {
  return (
    <div className={`card border-l-4 ${accentClass} flex items-start gap-4`}>
      {/* Icon bubble */}
      <div className="text-2xl leading-none mt-0.5 flex-shrink-0">{icon}</div>

      {/* Text */}
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">
          {title}
        </p>
        <p className={`text-2xl font-extrabold mt-0.5 ${valueClass}`}>{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
