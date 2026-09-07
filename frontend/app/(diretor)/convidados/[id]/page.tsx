'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Info, LoaderCircle, Trash2 } from 'lucide-react';
import { DiretorShell } from '@/components/layout/DiretorShell';
import { Alert } from '@/components/ui/Alert';
import { convidadosService } from '@/features/convidados/services';
import { sociosService } from '@/features/socios/services';
import type { Convidado } from '@/features/convidados/types';
import type { Socio } from '@/features/socios/types';
import { ApiError } from '@/lib/api-client';
import { formatBRL, formatDateBR } from '@/lib/format';

interface ConvidadoDetail extends Convidado {
  payments: Array<{ id: string; matchDate: string; amount: string; paymentMethod: 'PIX' | 'DIN' }>;
}

// Tradução de prototipo/convidado-form.html (modo edição — RSP6/RSP7: remoção de contato LGPD).
export default function EditarConvidadoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [convidado, setConvidado] = useState<ConvidadoDetail | null>(null);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [invitedById, setInvitedById] = useState('');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [data, sociosResult] = await Promise.all([
      convidadosService.getById(params.id) as Promise<ConvidadoDetail>,
      sociosService.list({ pageSize: 100 }),
    ]);
    setConvidado(data);
    setName(data.name);
    setPhone(data.phone ?? '');
    setInvitedById(data.invitedById ?? '');
    setSocios(sociosResult.data);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      await convidadosService.update(params.id, { name, phone: phone || undefined, invitedById: invitedById || undefined });
      await load();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar as alterações.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveContact() {
    if (!confirm('Remover o contato deste convidado? Nome e telefone serão anonimizados; o histórico financeiro é preservado.')) return;
    setRemoving(true);
    try {
      await convidadosService.removeContact(params.id);
      router.push('/convidados');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível remover o contato.');
    } finally {
      setRemoving(false);
    }
  }

  if (!convidado) {
    return (
      <DiretorShell eyebrow="Associados" title="Editar Convidado">
        <div className="flex justify-center py-16"><LoaderCircle className="h-8 w-8 animate-spin text-navy-600" /></div>
      </DiretorShell>
    );
  }

  return (
    <DiretorShell eyebrow="Associados" title="Editar Convidado">
      <div className="mx-auto max-w-2xl">
        {success && <div className="mb-4"><Alert type="success" title="Dados do convidado atualizados com sucesso." /></div>}
        {error && <div className="mb-4"><Alert type="error" title="Não foi possível concluir a ação" description={error} /></div>}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-display text-sm font-semibold text-slate-700">Dados do convidado</p>
          <p className="mt-1 text-xs text-slate-400">Cadastro simplificado — convidados não têm login no sistema.</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="nome" className="mb-1.5 block text-sm font-medium text-slate-700">Nome completo</label>
              <input id="nome" value={name} onChange={(e) => setName(e.target.value)} disabled={Boolean(convidado.contactRemovedAt)} className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:bg-slate-50 disabled:text-slate-500" />
            </div>
            <div>
              <label htmlFor="telefone" className="mb-1.5 block text-sm font-medium text-slate-700">Telefone <span className="font-normal text-slate-400">(opcional)</span></label>
              <input id="telefone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={Boolean(convidado.contactRemovedAt)} placeholder="(11) 90000-0000" className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:bg-slate-50 disabled:text-slate-500" />
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
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-display text-sm font-semibold text-slate-700">Histórico de participações</p>
          <p className="mt-1 text-xs text-slate-400">Babas em que este convidado esteve presente. Convidados não entram nos rankings de temporada.</p>
          <div className="mt-4 divide-y divide-slate-100">
            {convidado.payments.length === 0 ? (
              <p className="py-2.5 text-sm text-slate-400">Nenhum pagamento registrado ainda.</p>
            ) : (
              convidado.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2.5">
                  <p className="text-sm text-slate-600">Domingo, {formatDateBR(p.matchDate)}</p>
                  <span className="text-xs text-slate-400">{formatBRL(p.amount)} · {p.paymentMethod === 'PIX' ? 'Pix' : 'Dinheiro'}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <button
            onClick={handleRemoveContact}
            disabled={removing || Boolean(convidado.contactRemovedAt)}
            className="flex items-center justify-center gap-2 rounded-full border border-red-200 px-6 py-2.5 font-display text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {removing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {convidado.contactRemovedAt ? 'Contato já removido' : 'Remover contato'}
          </button>
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <Link href="/convidados" className="flex items-center justify-center rounded-full border border-slate-300 px-6 py-2.5 font-display text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Cancelar
            </Link>
            <button onClick={handleSave} disabled={saving || Boolean(convidado.contactRemovedAt)} className="flex items-center justify-center gap-2 rounded-full bg-navy-600 px-6 py-2.5 font-display text-sm font-semibold text-white hover:bg-navy-700 disabled:opacity-70">
              {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Salvar alterações
            </button>
          </div>
        </div>

        <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
          <Info className="h-3.5 w-3.5" />
          &quot;Remover contato&quot; apaga apenas nome/telefone (LGPD); o histórico financeiro do convidado é preservado de forma anônima para a prestação de contas.
        </p>
      </div>
    </DiretorShell>
  );
}
