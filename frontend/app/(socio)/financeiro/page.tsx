'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, LoaderCircle, Wallet } from 'lucide-react';
import { SocioShell } from '@/components/layout/SocioShell';
import { EmptyState } from '@/components/ui/EmptyState';
import { financeiroService } from '@/features/financeiro/services';
import type { SocioPayment } from '@/features/financeiro/types';
import { formatBRL, formatDateBR, formatMonthLabel } from '@/lib/format';

// Tradução 1:1 de prototipo/situacao-financeira.html.
export default function SituacaoFinanceiraPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [payments, setPayments] = useState<SocioPayment[] | null>(null);

  useEffect(() => {
    financeiroService.getMensalidades(year).then(setPayments);
  }, [year]);

  const totalPago = payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

  return (
    <SocioShell eyebrow="Financeiro" title="Minha Situação Financeira">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="font-display text-sm font-semibold text-slate-700">Resumo de {year}</p>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          >
            {[year, year - 1, year - 2].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="font-display text-lg font-bold text-navy-600">{formatBRL(totalPago)}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">Pago no ano</p>
          </div>
          <div>
            <p className="font-display text-lg font-bold text-teal-600">{payments?.length ?? 0}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">Lançamentos</p>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Histórico mensal</p>

        {!payments ? (
          <div className="flex justify-center py-8">
            <LoaderCircle className="h-6 w-6 animate-spin text-navy-600" />
          </div>
        ) : payments.length === 0 ? (
          <EmptyState icon={Wallet} title="Nenhum lançamento ainda" description="Assim que seu primeiro pagamento de mensalidade for registrado, ele vai aparecer aqui." />
        ) : (
          payments.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
              <div>
                <p className="font-display text-sm font-semibold text-slate-800">{formatMonthLabel(payment.referenceMonth)}</p>
                <p className="text-xs text-slate-500">
                  Pago em {formatDateBR(payment.paidAt)} · {payment.paymentMethod === 'PIX' ? 'Pix' : 'Dinheiro'}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-sm font-semibold text-slate-800">{formatBRL(payment.amount)}</p>
                <span className="mt-0.5 inline-block rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700">Em dia</span>
              </div>
            </div>
          ))
        )}

        <Link href="/pagar" className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700">
          Pagar mês corrente
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </SocioShell>
  );
}
