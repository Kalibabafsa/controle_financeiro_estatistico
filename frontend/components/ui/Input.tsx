import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, icon, id, className = '', ...props },
  ref
) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          className={`w-full rounded-xl border py-2.5 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
            icon ? 'pl-10' : 'pl-3.5'
          } ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/30'
              : 'border-slate-300 focus:border-teal-500 focus:ring-teal-500/30'
          } ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
});
