'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, LoaderCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { loginFormSchema } from '@/features/auth/schemas';
import { ApiError } from '@/lib/api-client';

// Tradução 1:1 de prototipo/login.html — hero navy/teal + formulário (docs/design-system.md).
export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const parsed = loginFormSchema.safeParse({ email, password });
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        errors[String(issue.path[0])] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const me = await login(parsed.data.email, parsed.data.password);
      router.push(me.role === 'DIRETOR' ? '/dashboard' : '/inicio');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível entrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Painel de identidade (hero) */}
      <div className="relative overflow-hidden bg-gradient-to-br from-navy-600 via-navy-600 to-teal-600 px-6 py-12 text-white lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:px-16 lg:py-16">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-sun-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-teal-300/20 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-sm lg:mx-0">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-2xl backdrop-blur-sm">⚽</div>
            <div>
              <p className="font-display text-2xl font-extrabold tracking-tight">KALI BABA</p>
              <p className="text-xs font-medium uppercase tracking-widest text-teal-100">Associação Kalibaba</p>
            </div>
          </div>

          <div className="mt-10 lg:mt-16">
            <h1 className="font-display text-3xl font-bold leading-tight lg:text-4xl">
              Futebol de 7,<br />prestação de contas<br />sem complicação.
            </h1>
            <p className="mt-4 max-w-sm text-sm text-teal-50/90">
              Controle de mensalidades, presença, times e estatísticas do baba — tudo em um só lugar.
            </p>
          </div>

          <div className="mt-10 flex items-center gap-4 text-2xl">
            <span title="Toda semana">🌴</span>
            <span title="O baba">⚽</span>
            <span title="Confraternização">🍻</span>
            <span title="Sol de domingo">☀️</span>
          </div>

          <div className="mt-10 border-t border-white/20 pt-4 text-xs text-teal-100/80">
            <p>⏰ Todo domingo, 8h da manhã</p>
          </div>
        </div>
      </div>

      {/* Painel do formulário */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 lg:py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold text-navy-600">Entrar</h2>
            <p className="mt-1 text-sm text-slate-500">Acesse sua conta para continuar</p>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-medium">Não foi possível entrar</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                E-mail
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              </div>
              {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                Senha
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500/40" />
                Lembrar de mim
              </label>
              <Link href="/recuperar-senha" className="font-medium text-teal-600 hover:text-teal-700">
                Esqueci minha senha
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-navy-600 py-3 font-display text-sm font-semibold text-white transition hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span>{loading ? 'Entrando...' : 'Entrar'}</span>
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">Sistema Kalibaba © 2026 — Associação Kalibaba</p>
        </div>
      </div>
    </div>
  );
}
