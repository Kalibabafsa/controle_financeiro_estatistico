import { AlertTriangle, CheckCircle } from 'lucide-react';

interface AlertProps {
  type: 'error' | 'success';
  title: string;
  description?: string;
}

// Blocos de erro/sucesso — docs/design-system.md seção "Estados".
export function Alert({ type, title, description }: AlertProps) {
  const isError = type === 'error';
  const Icon = isError ? AlertTriangle : CheckCircle;

  return (
    <div
      role="alert"
      className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
        isError ? 'border-red-200 bg-red-50 text-red-700' : 'border-teal-200 bg-teal-50 text-teal-700'
      }`}
    >
      <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
      <div>
        <p className="font-medium">{title}</p>
        {description && <p>{description}</p>}
      </div>
    </div>
  );
}
