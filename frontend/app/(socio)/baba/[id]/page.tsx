'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { SocioShell } from '@/components/layout/SocioShell';
import { babaService } from '@/features/baba/services';
import type { BabaDetail } from '@/features/baba/types';
import { formatDateBR } from '@/lib/format';

const CARD_COLOR: Record<string, string> = {
  CARTAO_AMARELO: 'bg-yellow-400',
  CARTAO_AZUL: 'bg-blue-500',
  CARTAO_VERMELHO: 'bg-red-600',
};
const CARD_LABEL: Record<string, string> = {
  CARTAO_AMARELO: 'Cartão amarelo',
  CARTAO_AZUL: 'Cartão azul',
  CARTAO_VERMELHO: 'Cartão vermelho',
};

function participantName(p: { socio?: { name: string } | null; convidado?: { name: string } | null }) {
  return p.socio?.name ?? p.convidado?.name ?? 'Participante';
}

// Tradução de prototipo/detalhe-baba.html.
export default function DetalheBabaPage() {
  const params = useParams<{ id: string }>();
  const [baba, setBaba] = useState<BabaDetail | null>(null);

  useEffect(() => {
    babaService.getBaba(params.id).then(setBaba);
  }, [params.id]);

  if (!baba) {
    return (
      <SocioShell eyebrow="Futebol" title="Detalhe do Baba">
        <div className="flex justify-center py-16">
          <LoaderCircle className="h-8 w-8 animate-spin text-navy-600" />
        </div>
      </SocioShell>
    );
  }

  const gols = baba.events.filter((e) => e.type === 'GOL');
  const cartoes = baba.events.filter((e) => e.type !== 'GOL');

  const golsPorJogador = new Map<string, { name: string; count: number; team?: number }>();
  for (const evento of gols) {
    const name = participantName(evento.presenca);
    const current = golsPorJogador.get(evento.presenca.id) ?? { name, count: 0 };
    current.count += 1;
    golsPorJogador.set(evento.presenca.id, current);
  }

  return (
    <SocioShell eyebrow="Futebol" title={`Domingo, ${formatDateBR(baba.date)}`}>
      <p className="mb-5 text-sm text-slate-500">{baba.presencas.length} presentes · {baba.teams.length} times</p>

      <section>
        <p className="mb-3 font-display text-sm font-semibold text-slate-500">Times sorteados</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {baba.teams.map((team) => (
            <div key={team.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-600 text-xs font-bold text-white">{team.number}</span>
                <p className="font-display text-sm font-semibold text-slate-800">Time {team.number}</p>
              </div>
              <ul className="space-y-1.5 text-sm text-slate-600">
                {team.members.map((member) => (
                  <li key={member.presenca.id} className="flex items-center gap-2">
                    {member.presenca.position === 'GOLEIRO' && (
                      <span className="rounded-full bg-sun-50 px-1.5 py-0.5 text-[10px] font-semibold text-sun-500">GOL</span>
                    )}
                    {participantName(member.presenca)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <p className="mb-3 font-display text-sm font-semibold text-slate-500">Gols do dia</p>
        {golsPorJogador.size === 0 ? (
          <p className="text-sm text-slate-400">Nenhum gol registrado neste baba.</p>
        ) : (
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm">
            {Array.from(golsPorJogador.values())
              .sort((a, b) => b.count - a.count)
              .map((row) => (
                <div key={row.name} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">⚽</span>
                    <p className="text-sm font-medium text-slate-800">{row.name}</p>
                  </div>
                  <span className="font-display text-sm font-bold text-navy-600">{row.count} {row.count === 1 ? 'gol' : 'gols'}</span>
                </div>
              ))}
          </div>
        )}
      </section>

      <section className="mt-6">
        <p className="mb-3 font-display text-sm font-semibold text-slate-500">Cartões do dia</p>
        {cartoes.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum cartão neste baba.</p>
        ) : (
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm">
            {cartoes.map((evento) => (
              <div key={evento.id} className="flex items-center gap-2.5 px-4 py-3">
                <span className={`h-4 w-3 flex-shrink-0 rounded-sm ${CARD_COLOR[evento.type]}`} />
                <div>
                  <p className="text-sm font-medium text-slate-800">{participantName(evento.presenca)}</p>
                  <p className="text-xs text-slate-500">
                    {CARD_LABEL[evento.type]}
                    {evento.type === 'CARTAO_VERMELHO' && ' · suspenso no próximo baba'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </SocioShell>
  );
}
