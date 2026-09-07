'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, AlertTriangle, Calendar, ChevronRight, ArrowRight, Trophy, FileText, User, LoaderCircle } from 'lucide-react';
import { SocioShell } from '@/components/layout/SocioShell';
import { useAuth } from '@/lib/auth/AuthContext';
import { financeiroService } from '@/features/financeiro/services';
import { babaService } from '@/features/baba/services';
import type { SituacaoResponse, SituacaoGeralResponse } from '@/features/financeiro/types';
import type { ProximoBabaResponse } from '@/features/baba/types';
import { formatDateBR, formatMonthLabel } from '@/lib/format';

// Tradução 1:1 de prototipo/home-socio.html.
export default function InicioSocioPage() {
  const { user } = useAuth();
  const [situacao, setSituacao] = useState<SituacaoResponse | null>(null);
  const [situacaoGeral, setSituacaoGeral] = useState<SituacaoGeralResponse | null>(null);
  const [proximoBaba, setProximoBaba] = useState<ProximoBabaResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [s, sg, pb] = await Promise.all([
        financeiroService.getSituacao(),
        financeiroService.getSituacaoGeral(),
        babaService.getProximoBaba(),
      ]);
      setSituacao(s);
      setSituacaoGeral(sg);
      setProximoBaba(pb);
      setLoading(false);
    })();
  }, []);

  const firstName = user?.socio?.name?.split(' ')[0] ?? 'Sócio';

  if (loading) {
    return (
      <SocioShell eyebrow="Início" title={`Olá, ${firstName} 👋`}>
        <div className="flex justify-center py-16">
          <LoaderCircle className="h-8 w-8 animate-spin text-navy-600" />
        </div>
      </SocioShell>
    );
  }

  return (
    <SocioShell eyebrow="Início" title={`Olá, ${firstName} 👋`}>
      {situacao?.emDia ? (
        <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 p-5 text-white shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6" />
            <p className="font-display text-xs font-semibold uppercase tracking-wide text-teal-50">Situação financeira</p>
          </div>
          <p className="mt-3 font-display text-2xl font-bold">Você está em dia!</p>
          <p className="mt-1 text-sm text-teal-50/90">
            {situacao.payment
              ? `Mensalidade de ${formatMonthLabel(situacao.referenceMonth)} paga em ${formatDateBR(situacao.payment.paidAt)}.`
              : `Sem cobrança pendente em ${formatMonthLabel(situacao.referenceMonth)}.`}
          </p>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-teal-50/80">Mês de referência: {formatMonthLabel(situacao.referenceMonth)}</p>
            <Link href="/financeiro" className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/25">
              Ver histórico
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-gradient-to-br from-red-500 to-red-600 p-5 text-white shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            <p className="font-display text-xs font-semibold uppercase tracking-wide text-red-50">Situação financeira</p>
          </div>
          <p className="mt-3 font-display text-2xl font-bold">Você está inadimplente</p>
          <p className="mt-1 text-sm text-red-50/90">
            Não identificamos o pagamento da mensalidade de {situacao ? formatMonthLabel(situacao.referenceMonth) : '-'}.
          </p>
          <Link href="/pagar" className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-white py-2.5 font-display text-sm font-semibold text-red-600 hover:bg-red-50">
            Pagar agora via Pix
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-navy-600">
            <Calendar className="h-5 w-5" />
            <p className="font-display text-sm font-semibold">Próximo baba</p>
          </div>
          {proximoBaba?.proximoBaba && (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                proximoBaba.apto ? 'bg-teal-50 text-teal-700' : 'bg-red-50 text-red-600'
              }`}
            >
              {proximoBaba.apto ? 'Apto para jogar' : 'Suspenso (cartão vermelho)'}
            </span>
          )}
        </div>
        {proximoBaba?.proximoBaba ? (
          <>
            <p className="mt-3 font-display text-xl font-bold text-slate-800">
              {formatDateBR(proximoBaba.proximoBaba.date)}
            </p>
            <p className="text-sm text-slate-500">
              {proximoBaba.proximoBaba.time ?? '—'} · {proximoBaba.proximoBaba.location ?? 'Local a definir'}
            </p>
            <Link href="/proximo-baba" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-teal-600 hover:text-teal-700">
              Ver detalhes
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </>
        ) : (
          <p className="mt-3 text-sm text-slate-500">Nenhum baba agendado no momento.</p>
        )}
      </div>

      <div className="mt-6">
        <p className="mb-3 font-display text-sm font-semibold text-slate-500">Acesso rápido</p>
        <div className="grid grid-cols-3 gap-3">
          <Link href="/rankings" className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm transition hover:border-teal-300 hover:shadow-md">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sun-50 text-sun-500">
              <Trophy className="h-5 w-5" />
            </span>
            <span className="text-xs font-medium text-slate-600">Rankings</span>
          </Link>
          <Link href="/prestacao-contas" className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm transition hover:border-teal-300 hover:shadow-md">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-50 text-navy-600">
              <FileText className="h-5 w-5" />
            </span>
            <span className="text-xs font-medium text-slate-600">Prestação</span>
          </Link>
          <Link href="/perfil" className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm transition hover:border-teal-300 hover:shadow-md">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-teal-600">
              <User className="h-5 w-5" />
            </span>
            <span className="text-xs font-medium text-slate-600">Perfil</span>
          </Link>
        </div>
      </div>

      {situacaoGeral && (
        <div className="mt-6">
          <p className="mb-3 font-display text-sm font-semibold text-slate-500">Resumo da associação</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
              <p className="font-display text-xl font-bold text-navy-600">{situacaoGeral.sociosAtivos}</p>
              <p className="mt-1 text-[11px] text-slate-500">Sócios ativos</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
              <p className="font-display text-xl font-bold text-teal-600">
                {(100 - situacaoGeral.percentualInadimplencia * 100).toFixed(0)}%
              </p>
              <p className="mt-1 text-[11px] text-slate-500">Adimplência</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
              <p className="font-display text-xl font-bold text-red-500">
                {(situacaoGeral.percentualInadimplencia * 100).toFixed(0)}%
              </p>
              <p className="mt-1 text-[11px] text-slate-500">Inadimplência</p>
            </div>
          </div>
        </div>
      )}
    </SocioShell>
  );
}
