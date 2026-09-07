'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, QrCode, Banknote, LoaderCircle } from 'lucide-react';
import { DiretorShell } from '@/components/layout/DiretorShell';
import { Alert } from '@/components/ui/Alert';
import { convidadosService } from '@/features/convidados/services';
import { financeiroService } from '@/features/financeiro/services';
import type { Convidado } from '@/features/convidados/types';
import type { GuestPayment } from '@/features/financeiro/types';
import { ApiError } from '@/lib/api-client';
import { formatDateBR } from '@/lib/format';

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

// Tradução de prototipo/lancamento-convidado.html.
export default function LancamentoConvidadoPage() {
  const [convidados, setConvidados] = useState<Convidado[]>([]);
  const [recentes, setRecentes] = useState<GuestPayment[] | null>(null);
  const [convidadoId, setConvidadoId] = useState('');
  const [matchDate, setMatchDate] = useState(todayInputValue());
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'DIN'>('PIX');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    convidadosService.list({ pageSize: 100 }).then((r) => {
      setConvidados(r.data);
      if (r.data.length > 0) setConvidadoId(r.data[0].id);
    });
    refreshRecentes();
  }, []);

  function refreshRecentes() {
    financeiroService.listPagamentosConvidados().then(setRecentes);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!convidadoId) {
      setError('Selecione um convidado.');
      return;
    }

    setSaving(true);
    try {
      await financeiroService.createPagamentoConvidado({
        convidadoId,
        matchDate,
        amount: amount ? Number(amount.replace(',', '.')) : undefined,
        paymentMethod,
        paidAt: new Date().toISOString(),
      });
      setSuccess(true);
      setAmount('');
      refreshRecentes();
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível registrar o pagamento.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <DiretorShell eyebrow="Financeiro" title="Lançamento de Pagamento de Convidado">
      <div className="mx-auto max-w-3xl">
        {success && <div className="mb-4"><Alert type="success" title="Pagamento avulso registrado com sucesso." /></div>}
        {error && <div className="mb-4"><Alert type="error" title="Não foi possível registrar" description={error} /></div>}

        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-display text-sm font-semibold text-slate-700">Registrar pagamento avulso de convidado</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="convidado" className="mb-1.5 block text-sm font-medium text-slate-700">Convidado</label>
              <select id="convidado" value={convidadoId} onChange={(e) => setConvidadoId(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30">
                {convidados.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}{c.invitedBy ? ` — convidado por ${c.invitedBy.name}` : ''}</option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-slate-400">
                Convidado não encontrado?{' '}
                <Link href="/convidados/novo" className="font-semibold text-teal-600 hover:text-teal-700">Cadastrar novo convidado</Link>.
              </p>
            </div>

            <div>
              <label htmlFor="domingo" className="mb-1.5 block text-sm font-medium text-slate-700">Domingo do baba</label>
              <input id="domingo" type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
            </div>

            <div>
              <label htmlFor="valor" className="mb-1.5 block text-sm font-medium text-slate-700">Valor</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm text-slate-400">R$</span>
                <input id="valor" type="text" placeholder="30,00" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
              </div>
              <p className="mt-1.5 text-xs text-slate-400">Deixe em branco para usar o valor padrão configurado.</p>
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-1.5 block text-sm font-medium text-slate-700">Forma de pagamento</p>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setPaymentMethod('PIX')} className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold ${paymentMethod === 'PIX' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white text-slate-500'}`}>
                <QrCode className="h-4 w-4" /> Pix
              </button>
              <button type="button" onClick={() => setPaymentMethod('DIN')} className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold ${paymentMethod === 'DIN' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white text-slate-500'}`}>
                <Banknote className="h-4 w-4" /> Dinheiro
              </button>
            </div>
          </div>

          <button type="submit" disabled={saving} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-navy-600 py-3 font-display text-sm font-semibold text-white hover:bg-navy-700 disabled:opacity-70 sm:w-auto sm:px-8">
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Registrar pagamento
          </button>
        </form>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="font-display text-sm font-semibold text-slate-700">Lançamentos recentes de convidados</p>
          </div>
          <div className="divide-y divide-slate-100">
            {!recentes ? (
              <div className="flex justify-center py-6"><LoaderCircle className="h-5 w-5 animate-spin text-navy-600" /></div>
            ) : recentes.length === 0 ? (
              <p className="px-5 py-4 text-sm text-slate-400">Nenhum lançamento ainda.</p>
            ) : (
              recentes.slice(0, 10).map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-navy-50 text-navy-600">
                    <Banknote className="h-4 w-4" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{p.convidado?.name}</p>
                    <p className="text-xs text-slate-400">{formatDateBR(p.matchDate)} · {p.paymentMethod === 'PIX' ? 'Pix' : 'Dinheiro'}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">R$ {Number(p.amount).toFixed(2).replace('.', ',')}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DiretorShell>
  );
}
