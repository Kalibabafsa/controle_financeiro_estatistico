'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Circle, CheckCircle, LoaderCircle } from 'lucide-react';
import { DiretorShell } from '@/components/layout/DiretorShell';
import { EmptyState } from '@/components/ui/EmptyState';
import { financeiroService } from '@/features/financeiro/services';
import type { InadimplenteItem } from '@/features/financeiro/types';
import { initials, formatBRL, formatMonthLabel } from '@/lib/format';
import { UserX } from 'lucide-react';

// Tradução de prototipo/inadimplencia.html (US14).
// "Cobrado?" é um controle interno de UI (checklist do diretor), sem
// persistência no backend (não há campo correspondente no schema atual) —
// reinicia a cada carregamento da página. Ver recomendação em docs/planning.
export default function InadimplenciaPage() {
  const [items, setItems] = useState<InadimplenteItem[] | null>(null);
  const [percentualInadimplencia, setPercentualInadimplencia] = useState<number | null>(null);
  const [cobrados, setCobrados] = useState<Set<string>>(new Set());
  const month = formatMonthLabel(new Date());

  useEffect(() => {
    financeiroService.getInadimplencia().then(setItems);
    financeiroService.getDashboard().then((d) => setPercentualInadimplencia(d.percentualInadimplencia));
  }, []);

  function toggleCobrado(id: string) {
    setCobrados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const valorTotalEmAberto = items?.reduce((sum, item) => sum + (item.amount ?? 0), 0) ?? 0;

  return (
    <DiretorShell eyebrow="Financeiro" title="Gestão de Inadimplência">
      <p className="mb-4 text-sm text-slate-500 lg:hidden">{month}</p>

      {!items ? (
        <div className="flex justify-center py-16"><LoaderCircle className="h-8 w-8 animate-spin text-navy-600" /></div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
              <p className="font-display text-xl font-bold text-red-500">{items.length}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">Sócios inadimplentes</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
              <p className="font-display text-xl font-bold text-slate-800">{formatBRL(valorTotalEmAberto)}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">Valor total em aberto</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
              <p className="font-display text-xl font-bold text-navy-600">
                {percentualInadimplencia === null ? '—' : `${(percentualInadimplencia * 100).toFixed(0)}%`}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">Taxa de inadimplência</p>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="mt-4"><EmptyState icon={UserX} title="Nenhum inadimplente neste mês" description="Todos os sócios ativos têm lançamento registrado." /></div>
          ) : (
            <>
              <div className="mt-4 hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-5 py-3">Sócio</th>
                      <th className="px-5 py-3">Telefone</th>
                      <th className="px-5 py-3">Dias em aberto</th>
                      <th className="px-5 py-3">Valor devido</th>
                      <th className="px-5 py-3">Cobrado?</th>
                      <th className="px-5 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item) => {
                      const cobrado = cobrados.has(item.id);
                      return (
                        <tr key={item.id}>
                          <td className="flex items-center gap-3 px-5 py-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 font-display text-xs font-bold text-red-500">{initials(item.name)}</div>
                            <span className="font-medium text-slate-800">{item.name}</span>
                          </td>
                          <td className="px-5 py-3 text-slate-500">{item.phone ?? '—'}</td>
                          <td className="px-5 py-3 text-slate-500">{item.diasEmAberto ?? '—'} dias</td>
                          <td className="px-5 py-3 font-medium text-slate-800">{item.amount !== undefined ? formatBRL(item.amount) : '—'}</td>
                          <td className="px-5 py-3">
                            <button
                              onClick={() => toggleCobrado(item.id)}
                              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                cobrado ? 'bg-teal-50 text-teal-700' : 'border border-slate-300 text-slate-500 hover:border-navy-400 hover:text-navy-600'
                              }`}
                            >
                              {cobrado ? <CheckCircle className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                              {cobrado ? 'Cobrado' : 'Não cobrado'}
                            </button>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <Link href="/lancamento-mensalidade" className="text-xs font-semibold text-teal-600 hover:text-teal-700">Lançar pagamento</Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 space-y-3 lg:hidden">
                {items.map((item) => {
                  const cobrado = cobrados.has(item.id);
                  return (
                    <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-50 font-display text-xs font-bold text-red-500">{initials(item.name)}</div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-slate-800">{item.name}</p>
                          <p className="text-xs text-slate-500">
                            {item.phone ?? 'sem telefone'} · {item.diasEmAberto ?? '—'} dias · {item.amount !== undefined ? formatBRL(item.amount) : '—'}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleCobrado(item.id)}
                          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            cobrado ? 'bg-teal-50 text-teal-700' : 'border border-slate-300 text-slate-500'
                          }`}
                        >
                          {cobrado ? <CheckCircle className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      <Link href="/lancamento-mensalidade" className="mt-2 inline-block text-xs font-semibold text-teal-600 hover:text-teal-700">Lançar pagamento</Link>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </DiretorShell>
  );
}
