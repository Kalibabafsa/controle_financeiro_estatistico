import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-navy-50 text-navy-400">
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <p className="font-display text-sm font-semibold text-slate-700">{title}</p>
        {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
      </div>
    </div>
  );
}
