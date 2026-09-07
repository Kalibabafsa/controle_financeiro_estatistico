'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, AlertTriangle, ChevronRight, LoaderCircle } from 'lucide-react';
import { SocioShell } from '@/components/layout/SocioShell';
import { EmptyState } from '@/components/ui/EmptyState';
import { babaService } from '@/features/baba/services';
import type { BabaDetail, ProximoBabaResponse } from '@/features/baba/types';
import { formatDateBR } from '@/lib/format';
import { Calendar } from 'lucide-react';

// Tradução de prototipo/proximo-baba.html.
export default function ProximoBabaPage() {
  const [proximo, setProximo] = useState<ProximoBabaResponse | null>(null);
  const [historico, setHistorico] = useState<BabaDetail[] | null>(null);

  useEffect(() => {
    babaService.getProximoBaba().then(setProximo);
    babaService.listBabas(1).then((r) => setHistorico(r.data));
  }, []);

  return (
    <SocioShell eyebrow="Futebol" title="Próximo Baba / Calendário">
      {!proximo ? (
        <div className="flex justify-center py-16">
          <LoaderCircle className="h-8 w-8 animate-spin text-navy-600" />
        </div>
      ) : proximo.proximoBaba ? (
        proximo.apto ? (
          <div className="rounded-2xl bg-gradient-to-br from-navy-600 to-teal-600 p-6 text-center text-white shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-2xl">⚽</div>
            <p className="mt-3 font-display text-2xl font-bold">{formatDateBR(proximo.proximoBaba.date)}</p>
            <p className="mt-1 text-sm text-teal-50/90">{proximo.proximoBaba.time ?? '—'} · {proximo.proximoBaba.location ?? 'Local a definir'}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold">
              <CheckCircle className="h-3.5 w-3.5" />
              Apto para jogar
            </span>
          </div>
        ) : (
          <>
            <div className="rounded-2xl bg-gradient-to-br from-red-500 to-red-600 p-6 text-center text-white shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-2xl">🟥</div>
              <p className="mt-3 font-display text-2xl font-bold">{formatDateBR(proximo.proximoBaba.date)}</p>
              <p className="mt-1 text-sm text-red-50/90">{proximo.proximoBaba.time ?? '—'} · {proximo.proximoBaba.location ?? 'Local a definir'}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold">
                <AlertTriangle className="h-3.5 w-3.5" />
                Suspenso
              </span>
            </div>
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Suspensão automática por cartão vermelho</p>
                <p className="mt-0.5 text-red-600/90">
                  Você está suspenso para este domingo por um cartão vermelho recebido no baba anterior.
                </p>
              </div>
            </div>
          </>
        )
      ) : (
        <EmptyState icon={Calendar} title="Nenhum baba agendado" description="Assim que o diretor criar o próximo baba do dia, ele aparece aqui." />
      )}

      <div className="mt-6">
        <p className="mb-3 font-display text-sm font-semibold text-slate-500">Baba anteriores</p>
        {!historico ? (
          <div className="flex justify-center py-8">
            <LoaderCircle className="h-6 w-6 animate-spin text-navy-600" />
          </div>
        ) : historico.length === 0 ? (
          <EmptyState icon={Calendar} title="Nenhum baba registrado ainda" />
        ) : (
          <div className="space-y-3">
            {historico.map((baba) => (
              <Link
                key={baba.id}
                href={`/baba/${baba.id}`}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition hover:border-teal-300 hover:shadow-md"
              >
                <div>
                  <p className="font-display text-sm font-semibold text-slate-800">{formatDateBR(baba.date)}</p>
                  <p className="text-xs text-slate-500">{baba.presencas?.length ?? 0} presentes</p>
                </div>
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-400" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </SocioShell>
  );
}
