'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, Download, FileText, LoaderCircle } from 'lucide-react';
import { SocioShell } from '@/components/layout/SocioShell';
import { EmptyState } from '@/components/ui/EmptyState';
import { prestacaoContasService } from '@/features/prestacao-contas/services';
import type { PrestacaoContas } from '@/features/prestacao-contas/types';
import { formatBRL, formatDateBR, formatMonthLabel } from '@/lib/format';

function monthKey(referenceMonth: string): string {
  const date = new Date(referenceMonth);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

// Tradução de prototipo/prestacao-contas.html (RF20 — transparência ao sócio).
export default function PrestacaoContasSocioPage() {
  const [reports, setReports] = useState<PrestacaoContas[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    prestacaoContasService.list().then((data) => {
      setReports(data);
      if (data.length > 0) setOpenId(data[0].id);
    });
  }, []);

  async function handleDownload(report: PrestacaoContas) {
    setDownloading(report.id);
    try {
      const { url } = await prestacaoContasService.getPdfUrl(monthKey(report.referenceMonth));
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloading(null);
    }
  }

  return (
    <SocioShell eyebrow="Transparência" title="Prestação de Contas">
      <p className="mb-4 text-sm text-slate-500">Relatórios mensais de receitas, despesas e saldo da associação.</p>

      {!reports ? (
        <div className="flex justify-center py-16">
          <LoaderCircle className="h-8 w-8 animate-spin text-navy-600" />
        </div>
      ) : reports.length === 0 ? (
        <EmptyState icon={FileText} title="Nenhuma prestação de contas publicada ainda" />
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const isOpen = openId === report.id;
            const saldoPositivo = report.snapshot.cumulativeBalance >= 0;
            return (
              <div key={report.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <button
                  onClick={() => setOpenId(isOpen ? null : report.id)}
                  className="flex w-full items-center justify-between px-4 py-3.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-navy-50 text-navy-600">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div className="text-left">
                      <p className="font-display text-sm font-semibold text-slate-800">{formatMonthLabel(report.referenceMonth)}</p>
                      <p className="text-xs text-slate-500">Publicado em {formatDateBR(report.generatedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className={`hidden text-sm font-semibold sm:block ${saldoPositivo ? 'text-teal-600' : 'text-red-500'}`}>
                      Saldo: {formatBRL(report.snapshot.cumulativeBalance)}
                    </p>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 px-4 py-4">
                    <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[11px] text-slate-500">Receita total</p>
                        <p className="font-display text-sm font-bold text-slate-800">{formatBRL(report.snapshot.revenueTotal)}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[11px] text-slate-500">Despesa total</p>
                        <p className="font-display text-sm font-bold text-slate-800">{formatBRL(report.snapshot.expenseTotal)}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[11px] text-slate-500">Saldo do mês</p>
                        <p className={`font-display text-sm font-bold ${report.snapshot.monthBalance >= 0 ? 'text-teal-600' : 'text-red-500'}`}>
                          {formatBRL(report.snapshot.monthBalance)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[11px] text-slate-500">Saldo acumulado</p>
                        <p className={`font-display text-sm font-bold ${saldoPositivo ? 'text-navy-600' : 'text-red-500'}`}>
                          {formatBRL(report.snapshot.cumulativeBalance)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Receitas</p>
                        <ul className="space-y-1.5 text-sm text-slate-600">
                          <li className="flex justify-between"><span>Mensalidades de sócios</span><span className="font-medium text-slate-800">{formatBRL(report.snapshot.socioRevenue)}</span></li>
                          <li className="flex justify-between"><span>Pagamentos de convidados</span><span className="font-medium text-slate-800">{formatBRL(report.snapshot.guestRevenue)}</span></li>
                          <li className="flex justify-between"><span>Outras receitas</span><span className="font-medium text-slate-800">{formatBRL(report.snapshot.otherRevenue)}</span></li>
                        </ul>
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Despesas por categoria</p>
                        <ul className="space-y-1.5 text-sm text-slate-600">
                          {report.snapshot.expensesByCategory.map((item) => (
                            <li key={item.category} className="flex justify-between">
                              <span>{item.category}</span>
                              <span className="font-medium text-slate-800">{formatBRL(item.total)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownload(report)}
                      disabled={downloading === report.id}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-navy-600 py-2.5 font-display text-sm font-semibold text-white hover:bg-navy-700 disabled:opacity-70 sm:w-auto sm:px-6"
                    >
                      {downloading === report.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      Baixar PDF
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </SocioShell>
  );
}
