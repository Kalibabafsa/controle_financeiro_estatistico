'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Wallet, TrendingUp, TrendingDown, UserX, Users, LoaderCircle } from 'lucide-react';
import { DiretorShell } from '@/components/layout/DiretorShell';
import { financeiroService } from '@/features/financeiro/services';
import type { DashboardFinanceiroResponse, InadimplenteItem } from '@/features/financeiro/types';
import { formatBRL, formatMonthLabel, initials } from '@/lib/format';

// Tradução de prototipo/dashboard-financeiro.html (US7 — saldo acumulado; RF18 — KPIs).
export default function DashboardFinanceiroPage() {
  const [data, setData] = useState<DashboardFinanceiroResponse | null>(null);
  const [inadimplentes, setInadimplentes] = useState<InadimplenteItem[] | null>(null);

  useEffect(() => {
    financeiroService.getDashboard().then(setData);
    financeiroService.getInadimplencia().then(setInadimplentes);
  }, []);

  if (!data) {
    return (
      <DiretorShell eyebrow="Visão geral" title="Dashboard Financeiro">
        <div className="flex justify-center py-16">
          <LoaderCircle className="h-8 w-8 animate-spin text-navy-600" />
        </div>
      </DiretorShell>
    );
  }

  const maxSeries = Math.max(
    ...data.series.flatMap((s) => [Number(s.revenueTotal), Number(s.expenseTotal)]),
    1
  );

  return (
    <DiretorShell eyebrow="Visão geral" title="Dashboard Financeiro">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div className="col-span-2 rounded-2xl bg-gradient-to-br from-navy-600 to-teal-600 p-5 text-white shadow-sm lg:col-span-1">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-50">Saldo acumulado</p>
          </div>
          <p className="mt-2 font-display text-2xl font-bold">{formatBRL(data.cumulativeBalance)}</p>
          <p className="mt-1 text-xs text-teal-50/80">Até {formatMonthLabel(data.referenceMonth)}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <TrendingUp className="h-5 w-5 text-teal-600" />
            <p className="text-xs font-semibold uppercase tracking-wide">Receita do mês</p>
          </div>
          <p className="mt-2 font-display text-xl font-bold text-slate-800">{formatBRL(data.revenueTotal)}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <TrendingDown className="h-5 w-5 text-sun-500" />
            <p className="text-xs font-semibold uppercase tracking-wide">Despesa do mês</p>
          </div>
          <p className="mt-2 font-display text-xl font-bold text-slate-800">{formatBRL(data.expenseTotal)}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <UserX className="h-5 w-5 text-red-500" />
            <p className="text-xs font-semibold uppercase tracking-wide">Inadimplência</p>
          </div>
          <p className="mt-2 font-display text-xl font-bold text-slate-800">{(data.percentualInadimplencia * 100).toFixed(0)}%</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <Users className="h-5 w-5 text-navy-600" />
            <p className="text-xs font-semibold uppercase tracking-wide">Sócios ativos</p>
          </div>
          <p className="mt-2 font-display text-xl font-bold text-slate-800">{data.sociosAtivos}</p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="font-display text-sm font-semibold text-slate-700">Receitas x Despesas — últimos 6 meses</p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-teal-500" />Receita</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-300" />Despesa</span>
          </div>
        </div>
        <div className="mt-6 flex h-40 items-end justify-between gap-4 sm:gap-6">
          {data.series.map((month) => (
            <div key={month.referenceMonth} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex h-32 w-full items-end justify-center gap-1">
                <div
                  className="w-3 rounded-t-md bg-teal-500 sm:w-4"
                  style={{ height: `${(Number(month.revenueTotal) / maxSeries) * 100}%` }}
                />
                <div
                  className="w-3 rounded-t-md bg-slate-200 sm:w-4"
                  style={{ height: `${(Number(month.expenseTotal) / maxSeries) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">{formatMonthLabel(month.referenceMonth).slice(0, 3)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <p className="font-display text-sm font-semibold text-slate-700">Inadimplentes do mês</p>
            <Link href="/inadimplencia" className="text-xs font-semibold text-teal-600 hover:text-teal-700">Ver todos</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {!inadimplentes ? (
              <div className="flex justify-center py-6"><LoaderCircle className="h-5 w-5 animate-spin text-navy-600" /></div>
            ) : inadimplentes.length === 0 ? (
              <p className="px-5 py-4 text-sm text-slate-400">Nenhum inadimplente neste mês.</p>
            ) : (
              inadimplentes.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-red-50 font-display text-xs font-bold text-red-500">
                    {initials(item.name)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-400">Sem lançamento em {formatMonthLabel(data.referenceMonth)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <p className="font-display text-sm font-semibold text-slate-700">Ações rápidas</p>
          </div>
          <div className="flex flex-col divide-y divide-slate-100">
            <Link href="/lancamento-mensalidade" className="px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Lançar mensalidade</Link>
            <Link href="/lancamento-convidado" className="px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Lançar pagamento de convidado</Link>
            <Link href="/despesas" className="px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Lançar despesa</Link>
            <Link href="/prestacao-contas-geracao" className="px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Gerar prestação de contas</Link>
          </div>
        </div>
      </div>
    </DiretorShell>
  );
}
