'use client';

import { useEffect, useState } from 'react';
import { Download, LoaderCircle, Info } from 'lucide-react';
import { DiretorShell } from '@/components/layout/DiretorShell';
import { Alert } from '@/components/ui/Alert';
import { prestacaoContasService } from '@/features/prestacao-contas/services';
import type { PrestacaoContas, PrestacaoPreview } from '@/features/prestacao-contas/types';
import { ApiError } from '@/lib/api-client';
import { formatBRL, formatDateBR, formatMonthLabel, currentMonthInputValue } from '@/lib/format';

// Tradução de prototipo/prestacao-contas-geracao.html (US8).
// Nota: o snapshot agrega despesas por categoria (não por semana como no
// protótipo ilustrativo) — reflete a estrutura real de dados do backend.
export default function PrestacaoContasGeracaoPage() {
  const [month, setMonth] = useState(currentMonthInputValue().slice(0, 7));
  const [preview, setPreview] = useState<PrestacaoPreview | null>(null);
  const [reports, setReports] = useState<PrestacaoContas[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPreview();
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  function loadPreview() {
    setPreview(null);
    prestacaoContasService.preview(month).then(setPreview).catch(() => setPreview(null));
  }

  function loadReports() {
    prestacaoContasService.list().then(setReports);
  }

  async function handleGenerate() {
    setError(null);
    setGenerating(true);
    try {
      await prestacaoContasService.generate(`${month}-01`);
      setSuccess(true);
      loadReports();
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível gerar o PDF.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleDownload(referenceMonth: string) {
    const key = `${new Date(referenceMonth).getUTCFullYear()}-${String(new Date(referenceMonth).getUTCMonth() + 1).padStart(2, '0')}`;
    const { url } = await prestacaoContasService.getPdfUrl(key);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <DiretorShell eyebrow="Financeiro" title="Prestação de Contas">
      <div className="mx-auto max-w-4xl">
        {success && <div className="mb-4"><Alert type="success" title="PDF gerado com sucesso e disponível para os sócios." /></div>}
        {error && <div className="mb-4"><Alert type="error" title="Não foi possível gerar" description={error} /></div>}

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <label htmlFor="mes" className="text-sm font-medium text-slate-700">Mês de referência</label>
            <input id="mes" type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
          </div>
          <button onClick={handleGenerate} disabled={generating || !preview} className="flex items-center justify-center gap-2 rounded-full bg-navy-600 px-6 py-2.5 font-display text-sm font-semibold text-white hover:bg-navy-700 disabled:opacity-70">
            <span>Gerar PDF</span>
            {generating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          </button>
        </div>

        {!preview ? (
          <div className="mt-5 flex justify-center py-16"><LoaderCircle className="h-8 w-8 animate-spin text-navy-600" /></div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-br from-navy-600 to-teal-600 px-6 py-6 text-white">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚽</span>
                <p className="font-display text-sm font-extrabold tracking-tight">KALI BABA</p>
              </div>
              <p className="mt-3 font-display text-xl font-bold">Prestação de Contas — {formatMonthLabel(preview.referenceMonth)}</p>
              <p className="text-sm text-teal-50/90">Associação Kalibaba · preview</p>
            </div>

            <div className="px-6 py-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[11px] text-slate-500">Receita total</p>
                  <p className="font-display text-sm font-bold text-slate-800">{formatBRL(preview.revenueTotal)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[11px] text-slate-500">Despesa total</p>
                  <p className="font-display text-sm font-bold text-slate-800">{formatBRL(preview.expenseTotal)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[11px] text-slate-500">Saldo do mês</p>
                  <p className={`font-display text-sm font-bold ${preview.monthBalance >= 0 ? 'text-teal-600' : 'text-red-500'}`}>{formatBRL(preview.monthBalance)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[11px] text-slate-500">Saldo acumulado</p>
                  <p className={`font-display text-sm font-bold ${preview.cumulativeBalance >= 0 ? 'text-navy-600' : 'text-red-500'}`}>{formatBRL(preview.cumulativeBalance)}</p>
                </div>
              </div>

              <div className="mt-6">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Receitas</p>
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-slate-600">Mensalidades de sócios</span>
                    <span className="font-medium text-slate-800">{formatBRL(preview.socioRevenue)}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-slate-600">Pagamentos de convidados</span>
                    <span className="font-medium text-slate-800">{formatBRL(preview.guestRevenue)}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-slate-600">Outras receitas</span>
                    <span className="font-medium text-slate-800">{formatBRL(preview.otherRevenue)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Despesas por categoria</p>
                {preview.expensesByCategory.length === 0 ? (
                  <p className="text-sm text-slate-400">Nenhuma despesa lançada neste mês.</p>
                ) : (
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                    {preview.expensesByCategory.map((item) => (
                      <div key={item.category} className="flex items-center justify-between px-4 py-2.5 text-sm">
                        <span className="text-slate-600">{item.category}</span>
                        <span className="font-medium text-slate-800">{formatBRL(item.total)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="font-display text-sm font-semibold text-slate-700">Meses já gerados</p>
          </div>
          <div className="divide-y divide-slate-100">
            {!reports ? (
              <div className="flex justify-center py-6"><LoaderCircle className="h-5 w-5 animate-spin text-navy-600" /></div>
            ) : reports.length === 0 ? (
              <p className="px-5 py-4 text-sm text-slate-400">Nenhuma prestação de contas gerada ainda.</p>
            ) : (
              reports.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{formatMonthLabel(r.referenceMonth)}</p>
                    <p className="text-xs text-slate-400">Gerado em {formatDateBR(r.generatedAt)}</p>
                  </div>
                  <button onClick={() => handleDownload(r.referenceMonth)} className="text-xs font-semibold text-teal-600 hover:text-teal-700">Baixar PDF</button>
                </div>
              ))
            )}
          </div>
        </div>

        <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
          <Info className="h-3.5 w-3.5" />
          Ao gerar o PDF, o relatório fica automaticamente disponível para os sócios em &quot;Prestação de Contas&quot; no app deles.
        </p>
      </div>
    </DiretorShell>
  );
}
