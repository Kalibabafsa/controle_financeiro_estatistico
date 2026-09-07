'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, Lock, LoaderCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { forgotPasswordFormSchema, resetPasswordFormSchema } from '@/features/auth/schemas';

// Tradução de prototipo/recuperar-senha.html. Quando a URL tem ?token=..., mostra o
// formulário de definir nova senha (etapa após clicar no link recebido por e-mail) —
// fluxo necessário para completar RF2, não coberto por uma tela própria no protótipo.
export default function RecuperarSenhaPage() {
  return (
    <Suspense fallback={null}>
      <RecuperarSenhaContent />
    </Suspense>
  );
}

function RecuperarSenhaContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  return token ? <ResetPasswordForm token={token} /> : <ForgotPasswordForm />;
}

function HeroPanel({ title, description }: { title: React.ReactNode; description: string }) {
  return (
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
          <h1 className="font-display text-3xl font-bold leading-tight lg:text-4xl">{title}</h1>
          <p className="mt-4 max-w-sm text-sm text-teal-50/90">{description}</p>
        </div>
        <div className="mt-10 flex items-center gap-4 text-2xl">
          <span title="Toda semana">🌴</span>
          <span title="O baba">⚽</span>
          <span title="Confraternização">🍻</span>
          <span title="Sol de domingo">☀️</span>
        </div>
      </div>
    </div>
  );
}

function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = forgotPasswordFormSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'E-mail inválido.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email: parsed.data.email });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível enviar o link agora.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <HeroPanel
        title={<>Sem problema,<br />acontece com<br />todo mundo.</>}
        description="Informe seu e-mail cadastrado e enviaremos um link seguro para você criar uma nova senha."
      />

      <div className="flex flex-1 items-center justify-center px-6 py-12 lg:py-16">
        <div className="w-full max-w-sm">
          {!sent ? (
            <>
              <Link href="/login" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-navy-600">
                <ArrowLeft className="h-4 w-4" />
                Voltar para o login
              </Link>

              <h2 className="font-display text-2xl font-bold text-navy-600">Recuperar senha</h2>
              <p className="mt-1 text-sm text-slate-500">Digite o e-mail associado à sua conta.</p>

              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Não foi possível continuar</p>
                    <p>{error}</p>
                  </div>
                </div>
              )}

              <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">E-mail</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Mail className="h-5 w-5" />
                    </span>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="voce@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-navy-600 py-3 font-display text-sm font-semibold text-white transition hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span>{loading ? 'Enviando...' : 'Enviar link de redefinição'}</span>
                  {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                <CheckCircle className="h-7 w-7" />
              </div>
              <h2 className="mt-4 font-display text-xl font-bold text-navy-600">Link enviado!</h2>
              <p className="mt-2 text-sm text-slate-500">
                Se este e-mail estiver cadastrado, enviamos um link de redefinição de senha para{' '}
                <span className="font-medium text-slate-700">{email}</span>. Verifique também a caixa de spam.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 py-3 font-display text-sm font-semibold text-navy-600 transition hover:border-navy-400 hover:bg-navy-50"
              >
                Voltar para o login
              </Link>
            </div>
          )}

          <p className="mt-8 text-center text-xs text-slate-400">Sistema Kalibaba © 2026 — Associação Kalibaba</p>
        </div>
      </div>
    </div>
  );
}

function ResetPasswordForm({ token }: { token: string }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = resetPasswordFormSchema.safeParse({ newPassword, confirmPassword });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Dados inválidos.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', { token, newPassword: parsed.data.newPassword });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível redefinir sua senha.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <HeroPanel
        title={<>Quase lá!<br />defina sua<br />nova senha.</>}
        description="Escolha uma nova senha para voltar a acessar sua conta."
      />

      <div className="flex flex-1 items-center justify-center px-6 py-12 lg:py-16">
        <div className="w-full max-w-sm">
          {!done ? (
            <>
              <h2 className="font-display text-2xl font-bold text-navy-600">Nova senha</h2>
              <p className="mt-1 text-sm text-slate-500">Crie uma senha com pelo menos 8 caracteres.</p>

              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Não foi possível redefinir</p>
                    <p>{error}</p>
                  </div>
                </div>
              )}

              <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
                <div>
                  <label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium text-slate-700">Nova senha</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Lock className="h-5 w-5" />
                    </span>
                    <input
                      id="newPassword"
                      type="password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-slate-700">Confirmar senha</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Lock className="h-5 w-5" />
                    </span>
                    <input
                      id="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-navy-600 py-3 font-display text-sm font-semibold text-white transition hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span>{loading ? 'Salvando...' : 'Redefinir senha'}</span>
                  {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                <CheckCircle className="h-7 w-7" />
              </div>
              <h2 className="mt-4 font-display text-xl font-bold text-navy-600">Senha redefinida!</h2>
              <p className="mt-2 text-sm text-slate-500">Já pode entrar com sua nova senha.</p>
              <Link
                href="/login"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 py-3 font-display text-sm font-semibold text-navy-600 transition hover:border-navy-400 hover:bg-navy-50"
              >
                Ir para o login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
