'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Info, Lock, LoaderCircle } from 'lucide-react';
import { DiretorShell } from '@/components/layout/DiretorShell';
import { Alert } from '@/components/ui/Alert';
import { sociosService } from '@/features/socios/services';
import type { Socio, SocioStatusRecord } from '@/features/socios/types';
import { ApiError } from '@/lib/api-client';
import { formatMonthLabel, currentMonthInputValue } from '@/lib/format';

const STATUS_BADGE: Record<Socio['currentStatus'], string> = {
  A: 'bg-teal-50 text-teal-700', DM: 'bg-sun-50 text-sun-500', I: 'bg-slate-100 text-slate-500',
};
const STATUS_LABEL: Record<Socio['currentStatus'], string> = { A: 'Ativo', DM: 'DM', I: 'Inativo' };

// Tradução de prototipo/socio-form.html (modo edição — dados + status mensal + histórico).
export default function EditarSocioPage() {
  const params = useParams<{ id: string }>();
  const [socio, setSocio] = useState<Socio | null>(null);
  const [history, setHistory] = useState<SocioStatusRecord[] | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'A' | 'DM' | 'I'>('A');
  const [observation, setObservation] = useState('');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [data, hist] = await Promise.all([
      sociosService.getById(params.id),
      sociosService.getStatusHistory(params.id),
    ]);
    setSocio(data);
    setName(data.name);
    setEmail(data.email ?? '');
    setPhone(data.phone ?? '');
    setStatus(data.currentStatus);
    setObservation(data.observation ?? '');
    setHistory(hist);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      await sociosService.update(params.id, { name, email: email || undefined, phone: phone || undefined });
      await sociosService.updateStatus(params.id, {
        referenceMonth: currentMonthInputValue(),
        status,
        observation: status === 'DM' ? observation : undefined,
      });
      await load();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar as alterações.');
    } finally {
      setSaving(false);
    }
  }

  if (!socio) {
    return (
      <DiretorShell eyebrow="Associados" title="Editar Sócio">
        <div className="flex justify-center py-16"><LoaderCircle className="h-8 w-8 animate-spin text-navy-600" /></div>
      </DiretorShell>
    );
  }

  return (
    <DiretorShell eyebrow="Associados" title="Editar Sócio">
      <div className="mx-auto max-w-2xl">
        {success && <div className="mb-4"><Alert type="success" title="Dados do sócio atualizados com sucesso." /></div>}
        {error && <div className="mb-4"><Alert type="error" title="Não foi possível salvar" description={error} /></div>}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-display text-sm font-semibold text-slate-700">Dados pessoais</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">Nome completo</label>
              <input id="name" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">E-mail</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
            </div>
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-slate-700">Telefone / WhatsApp</label>
              <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-display text-sm font-semibold text-slate-700">Status atual ({formatMonthLabel(new Date())})</p>
          <p className="mt-1 text-xs text-slate-400">Define se o sócio é cobrado normalmente neste mês. Sócios em DM não são cobrados por padrão.</p>

          <div className="mt-4">
            <label htmlFor="status" className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
            <select id="status" value={status} onChange={(e) => setStatus(e.target.value as 'A' | 'DM' | 'I')} className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30">
              <option value="A">Ativo (A)</option>
              <option value="DM">Departamento Médico (DM)</option>
              <option value="I">Inativo (I)</option>
            </select>
          </div>

          {status === 'DM' && (
            <div className="mt-4">
              <label htmlFor="observation" className="mb-1.5 block text-sm font-medium text-slate-700">Observação (Departamento Médico)</label>
              <textarea
                id="observation"
                rows={3}
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder="Ex.: lesão no joelho, previsão de retorno em setembro."
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                <Lock className="h-3.5 w-3.5" />
                Visível apenas para você (diretor) — nunca para outros sócios.
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-display text-sm font-semibold text-slate-700">Histórico de status por mês</p>
          <div className="mt-4 space-y-3">
            {!history || history.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhum histórico registrado ainda.</p>
            ) : (
              history.map((record) => (
                <div key={record.id} className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-600">{formatMonthLabel(record.referenceMonth)}</p>
                    {record.observation && <p className="text-xs text-slate-400">{record.observation}</p>}
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[record.status]}`}>
                    {STATUS_LABEL[record.status]}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link href="/socios" className="flex items-center justify-center rounded-full border border-slate-300 px-6 py-2.5 font-display text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Cancelar
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-full bg-navy-600 px-6 py-2.5 font-display text-sm font-semibold text-white hover:bg-navy-700 disabled:opacity-70"
          >
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Salvar alterações
          </button>
        </div>

        <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
          <Info className="h-3.5 w-3.5" />
          Sócios não podem ser excluídos — apenas marcados como Inativo, preservando o histórico da associação.
        </p>
      </div>
    </DiretorShell>
  );
}
