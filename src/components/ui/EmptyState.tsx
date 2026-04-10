interface Props {
  icon?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon = "📂", title, subtitle, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-base font-semibold text-forest mb-1">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500 mb-5 max-w-xs">{subtitle}</p>}
      {action}
    </div>
  );
}
