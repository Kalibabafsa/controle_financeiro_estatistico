'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LoaderCircle } from 'lucide-react';
import { DiretorShell } from '@/components/layout/DiretorShell';
import { Alert } from '@/components/ui/Alert';
import { convidadosService } from '@/features/convidados/services';
import { sociosService } from '@/features/socios/services';
import type { Socio } from '@/features/socios/types';
import { ApiError } from '@/lib/api-client';

// Tradução de prototipo/convidado-form.html (modo criação).
export default function NovoConvidadoPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [invitedById, setInvitedById] = useState('');
  const [socios, setSocios] = useState<Socio[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    sociosService.list({ pageSize: 100 }).then((r) => setSocios(r.data));
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError('Informe o nome completo do convidado.');
      return;
    }

    setSaving(true);
    try {
      const convidado = await convidadosService.create({
        name,
        phone: phone || undefined,
        invitedById: invitedById || undefined,
      });
      router.push(`/convidados/${convidado.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar o convidado.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <DiretorShell eyebrow="Associados" title="Novo Convidado">
      <div className="mx-auto max-w-2xl">
        {error && <div className="mb-4"><Alert type="error" title="Não foi possível salvar" description={error} /></div>}

        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-display text-sm font-semibold text-slate-700">Dados do convidado</p>
          <p className="mt-1 text-xs text-slate-400">Cadastro simplificado — convidados não têm login no sistema.</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="nome" className="mb-1.5 block text-sm font-medium text-slate-700">Nome completo</label>
              <input id="nome" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
            </div>
            <div>
              <label htmlFor="telefone" className="mb-1.5 block text-sm font-medium text-slate-700">Telefone <span className="font-normal text-slate-400">(opcional)</span></label>
              <input id="telefone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 90000-0000" className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
            </div>
            <div>
              <label htmlFor="convidado-por" className="mb-1.5 block text-sm font-medium text-slate-700">Convidado por <span className="font-normal text-slate-400">(opcional)</span></label>
              <select id="convidado-por" value={invitedById} onChange={(e) => setInvitedById(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30">
                <option value="">Nenhum sócio específico</option>
                {socios.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        </form>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link href="/convidados" className="flex items-center justify-center rounded-full border border-slate-300 px-6 py-2.5 font-display text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Cancelar
          </Link>
          <button onClick={handleSubmit} disabled={saving} className="flex items-center justify-center gap-2 rounded-full bg-navy-600 px-6 py-2.5 font-display text-sm font-semibold text-white hover:bg-navy-700 disabled:opacity-70">
            {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
            Cadastrar convidado
          </button>
        </div>
      </div>
    </DiretorShell>
  );
}
