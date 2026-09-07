'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert, Unlock, CheckCircle, LoaderCircle } from 'lucide-react';
import { DiretorShell } from '@/components/layout/DiretorShell';
import { Alert } from '@/components/ui/Alert';
import { babaService } from '@/features/baba/services';
import type { SuspensionItem } from '@/features/baba/types';
import { ApiError } from '@/lib/api-client';
import { formatDateBR, initials } from '@/lib/format';

function participantName(s: SuspensionItem) {
  return s.socio?.name ?? s.convidado?.name ?? 'Participante';
}

// Tradução de prototipo/suspensoes.html (US11/RF30).
export default function SuspensoesPage() {
  const [ativas, setAtivas] = useState<SuspensionItem[] | null>(null);
  const [historico, setHistorico] = useState<SuspensionItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    babaService.getSuspensoes().then((r) => {
      setAtivas(r.ativas);
      setHistorico(r.historico.filter((h) => h.liftedAt !== null || !r.ativas.some((a) => a.id === h.id)));
    });
  }

  useEffect(load, []);

  async function handleLiberar(id: string) {
    setError(null);
    try {
      await babaService.liberarSuspensao(id, 'Override manual do diretor');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível liberar a suspensão.');
    }
  }

  return (
    <DiretorShell eyebrow="Futebol" title="Suspensões Ativas">
      <div className="mx-auto max-w-3xl">
        {error && <div className="mb-4"><Alert type="error" title="Não foi possível concluir" description={error} /></div>}

        <div className="rounded-2xl bg-gradient-to-br from-navy-600 to-teal-600 p-5 text-white shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-50">Suspensões</p>
          </div>
          <p className="mt-2 font-display text-xl font-bold">{ativas?.length ?? 0} jogador(es) suspenso(s)</p>
          <p className="mt-1 text-sm text-teal-50/90">Bloqueados por cartão vermelho até liberação ou próximo baba.</p>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="font-display text-sm font-semibold text-slate-700">Suspensões ativas</p>
          </div>
          <div className="divide-y divide-slate-100">
            {!ativas ? (
              <div className="flex justify-center py-6"><LoaderCircle className="h-5 w-5 animate-spin text-navy-600" /></div>
            ) : ativas.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <CheckCircle className="mx-auto h-8 w-8 text-teal-500" />
                <p className="mt-2 text-sm font-medium text-slate-600">Nenhum jogador suspenso no momento.</p>
              </div>
            ) : (
              ativas.map((s) => (
                <div key={s.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-50 font-display text-xs font-bold text-red-500">
                      {initials(participantName(s))}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{participantName(s)}</p>
                      <p className="text-xs text-slate-500">Cartão vermelho no baba de {formatDateBR(s.originEvent.babaDoDia.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600">Suspenso</span>
                    <button onClick={() => handleLiberar(s.id)} className="flex items-center gap-1.5 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-navy-400 hover:text-navy-600">
                      <Unlock className="h-3.5 w-3.5" />
                      Remover suspensão
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
          &quot;Remover suspensão&quot; é um override manual do diretor (RF30) — o jogador volta a poder ser escalado imediatamente.
        </p>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="font-display text-sm font-semibold text-slate-700">Histórico de suspensões</p>
          </div>
          <div className="divide-y divide-slate-100">
            {!historico ? (
              <div className="flex justify-center py-6"><LoaderCircle className="h-5 w-5 animate-spin text-navy-600" /></div>
            ) : historico.length === 0 ? (
              <p className="px-5 py-4 text-sm text-slate-400">Nenhum histórico ainda.</p>
            ) : (
              historico.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{participantName(s)}</p>
                    <p className="text-xs text-slate-500">
                      Cartão vermelho em {formatDateBR(s.originEvent.babaDoDia.date)} · suspenso em {formatDateBR(s.effectiveDate)}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                    {s.liftedAt ? 'Liberada' : 'Cumprida'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DiretorShell>
  );
}
