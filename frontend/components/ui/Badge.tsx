type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
}

// Badges de status (A/DM/I, Em dia/Inadimplente, Apto/Suspenso...) — docs/design-system.md.
const TONE_CLASSES: Record<BadgeTone, string> = {
  success: 'bg-teal-50 text-teal-700 border border-teal-200',
  warning: 'bg-sun-50 text-sun-500 border border-sun-100',
  danger: 'bg-red-50 text-red-600 border border-red-200',
  neutral: 'bg-slate-100 text-slate-500 border border-slate-200',
  info: 'bg-navy-50 text-navy-600 border border-navy-100',
};

export function Badge({ tone = 'neutral', children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE_CLASSES[tone]}`}>
      {children}
    </span>
  );
}
