'use client';

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { LoaderCircle } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

// Botões — docs/design-system.md seção "Componentes > Botão".
const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-navy-600 text-white hover:bg-navy-700 focus-visible:ring-teal-500/40 disabled:opacity-70',
  secondary:
    'border border-slate-300 text-slate-600 hover:bg-slate-50 focus-visible:ring-teal-500/40 disabled:opacity-70',
  danger:
    'border border-red-200 text-red-600 hover:bg-red-50 focus-visible:ring-red-400/40 disabled:opacity-70',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', loading = false, disabled, className = '', children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 font-display text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      {children}
      {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
    </button>
  );
});
