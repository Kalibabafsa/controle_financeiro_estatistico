'use client';

import { useEffect, useState } from 'react';
import { Check, QrCode, Banknote, LoaderCircle } from 'lucide-react';
import { DiretorShell } from '@/components/layout/DiretorShell';
import { Alert } from '@/components/ui/Alert';
import { sociosService } from '@/features/socios/services';
import { financeiroService } from '@/features/financeiro/services';
import type { Socio } from '@/features/socios/types';
import type { SocioPayment } from '@/features/financeiro/types';
import { ApiError } from '@/lib/api-client';
import { currentMonthInputValue, formatMonthLabel } from '@/lib/format';

const STATUS_LABEL: Record<Socio['currentStatus'], string> = { A: 'já em dia', DM: 'em Departamento Médico', I: 'inativo' };

// Tradução de prototipo/lancamento-mensalidade.html (US4/US5).
export default function LancamentoMensalidadePage() {
  const [socios, setSocios] = useState<Socio[]>([]);
  const [recentes, setRecentes] = useState<SocioPayment[] | null>(null);
  const [socioId, setSocioId] = useState('');
  const [referenceMonth, setReferenceMonth] = useState(currentMonthInputValue().slice(0, 7));
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'DIN'>('PIX');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    sociosService.list({ pageSize: 100 }).then((r) => {
      setSocios(r.data);
      if (r.data.length > 0) setSocioId(r.data[0].id);
    });
    refreshRecentes();
  }, []);

  function refreshRecentes() {
    financeiroService.listMensalidades({ month: `${currentMonthInputValue().slice(0, 7)}-01` }).then(setRecentes);
  }

  const socioSelecionado = socios.find((s) => s.id === socioId);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!socioId) {
      setError('Selecione um sócio.');
      return;
    }

    setSaving(true);
    try {
      await financeiroService.createMensalidade({
        socioId,
        referenceMonth: `${referenceMonth}-01`,
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
    <DiretorShell eyebrow="Financeiro" title="Lançamento de Mensalidades">
      <div className="mx-auto max-w-3xl">
        {success && <div className="mb-4"><Alert type="success" title="Pagamento registrado com sucesso." description="O status do sócio no mês foi atualizado." /></div>}
        {error && <div className="mb-4"><Alert type="error" title="Não foi possível registrar" description={error} /></div>}

        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-display text-sm font-semibold text-slate-700">Registrar pagamento de mensalidade</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="socio" className="mb-1.5 block text-sm font-medium text-slate-700">Sócio</label>
              <select id="socio" value={socioId} onChange={(e) => setSocioId(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30">
                {socios.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} — {STATUS_LABEL[s.currentStatus]}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="mes" className="mb-1.5 block text-sm font-medium text-slate-700">Mês de referência</label>
              <input id="mes" type="month" value={referenceMonth} onChange={(e) => setReferenceMonth(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
            </div>

            <div>
              <label htmlFor="valor" className="mb-1.5 block text-sm font-medium text-slate-700">Valor</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm text-slate-400">R$</span>
                <input id="valor" type="text" placeholder="110,00" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
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

          {socioSelecionado?.currentStatus === 'DM' && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-sun-100 bg-sun-50 px-4 py-3 text-sm text-sun-500">
              <div>
                <p className="font-semibold text-slate-700">Sócio em Departamento Médico (DM)</p>
                <p className="mt-0.5 text-slate-500">Por padrão, sócios em DM não são cobrados. Registrar este pagamento é um override manual.</p>
              </div>
            </div>
          )}

          <button type="submit" disabled={saving} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-navy-600 py-3 font-display text-sm font-semibold text-white hover:bg-navy-700 disabled:opacity-70 sm:w-auto sm:px-8">
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Registrar pagamento
          </button>
        </form>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="font-display text-sm font-semibold text-slate-700">Lançamentos recentes de mensalidade</p>
          </div>
          <div className="divide-y divide-slate-100">
            {!recentes ? (
              <div className="flex justify-center py-6"><LoaderCircle className="h-5 w-5 animate-spin text-navy-600" /></div>
            ) : recentes.length === 0 ? (
              <p className="px-5 py-4 text-sm text-slate-400">Nenhum lançamento neste mês ainda.</p>
            ) : (
              recentes.slice(0, 10).map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                    <Check className="h-4 w-4" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{p.socio?.name}</p>
                    <p className="text-xs text-slate-400">{formatMonthLabel(p.referenceMonth)} · {p.paymentMethod === 'PIX' ? 'Pix' : 'Dinheiro'}</p>
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
