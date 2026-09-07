'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, LoaderCircle } from 'lucide-react';
import { SocioShell } from '@/components/layout/SocioShell';
import { perfilService } from '@/features/perfil/services';
import type { MeuPerfil } from '@/features/perfil/types';
import { initials, formatMonthLabel } from '@/lib/format';

const STATUS_LABEL: Record<MeuPerfil['currentStatus'], string> = { A: 'Ativo', DM: 'Departamento Médico', I: 'Inativo' };
const STATUS_DOT: Record<MeuPerfil['currentStatus'], string> = { A: 'bg-teal-500', DM: 'bg-sun-400', I: 'bg-slate-400' };

// Tradução de prototipo/meu-perfil.html (RF4/RF13 — sócio vê/edita seus dados;
// e-mail permanece somente leitura porque é usado para login).
export default function MeuPerfilPage() {
  const [perfil, setPerfil] = useState<MeuPerfil | null>(null);
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    perfilService.get().then((data) => {
      setPerfil(data);
      setPhone(data.phone ?? '');
    });
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const updated = await perfilService.update({ phone });
      setPerfil(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  if (!perfil) {
    return (
      <SocioShell eyebrow="Conta" title="Meu Perfil">
        <div className="flex justify-center py-16">
          <LoaderCircle className="h-8 w-8 animate-spin text-navy-600" />
        </div>
      </SocioShell>
    );
  }

  return (
    <SocioShell eyebrow="Conta" title="Meu Perfil">
      <div className="mx-auto max-w-xl">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-navy-600 font-display text-xl font-bold text-white">
            {initials(perfil.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg font-bold text-slate-800">{perfil.name}</p>
            {perfil.memberSince && <p className="text-sm text-slate-500">Sócio desde {formatMonthLabel(perfil.memberSince)}</p>}
            <span className="mt-1.5 inline-block rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
              {STATUS_LABEL[perfil.currentStatus]}
            </span>
          </div>
        </div>

        {success && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700" role="status">
            <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <p className="font-medium">Dados atualizados com sucesso.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-display text-sm font-semibold text-slate-700">Dados pessoais</p>

          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="nome" className="mb-1.5 block text-sm font-medium text-slate-700">Nome completo</label>
              <input
                id="nome"
                type="text"
                value={perfil.name}
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500"
              />
              <p className="mt-1.5 text-xs text-slate-400">Solicite ao diretor caso precise corrigir seu nome.</p>
            </div>

            <div>
              <label htmlFor="telefone" className="mb-1.5 block text-sm font-medium text-slate-700">Telefone / WhatsApp</label>
              <input
                id="telefone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">E-mail</label>
              <input
                id="email"
                type="email"
                value={perfil.email ?? ''}
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500"
              />
              <p className="mt-1.5 text-xs text-slate-400">Usado para login — solicite ao diretor caso precise alterar.</p>
            </div>

            <div>
              <p className="mb-1.5 block text-sm font-medium text-slate-700">Status atual</p>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <span className={`h-2 w-2 rounded-full ${STATUS_DOT[perfil.currentStatus]}`} />
                  {STATUS_LABEL[perfil.currentStatus]}
                </span>
                <span className="text-xs text-slate-400">Definido pelo diretor</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-navy-600 py-3 font-display text-sm font-semibold text-white transition hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:ring-offset-2 disabled:opacity-70"
          >
            {saving ? 'Salvando...' : 'Salvar alterações'}
            {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
          </button>
        </form>
      </div>
    </SocioShell>
  );
}
