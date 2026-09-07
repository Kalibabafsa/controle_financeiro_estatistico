'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, ShieldAlert, Trash2, LoaderCircle } from 'lucide-react';
import { DiretorShell } from '@/components/layout/DiretorShell';
import { Alert } from '@/components/ui/Alert';
import { babaService } from '@/features/baba/services';
import type { BabaDetail, GameEvent } from '@/features/baba/types';
import { ApiError } from '@/lib/api-client';
import { formatDateBR } from '@/lib/format';

type EventoTipo = 'GOL' | 'CARTAO_AMARELO' | 'CARTAO_AZUL' | 'CARTAO_VERMELHO';

const TIPO_OPTIONS: Array<{ value: EventoTipo; label: string; icon: React.ReactNode }> = [
  { value: 'GOL', label: 'Gol', icon: <span className="text-lg">⚽</span> },
  { value: 'CARTAO_AMARELO', label: 'Amarelo', icon: <span className="h-4 w-3 rounded-sm bg-yellow-400" /> },
  { value: 'CARTAO_AZUL', label: 'Azul', icon: <span className="h-4 w-3 rounded-sm bg-blue-500" /> },
  { value: 'CARTAO_VERMELHO', label: 'Vermelho', icon: <span className="h-4 w-3 rounded-sm bg-red-600" /> },
];

function participantName(p: { socio?: { name: string } | null; convidado?: { name: string } | null }) {
  return p.socio?.name ?? p.convidado?.name ?? 'Participante';
}

// Tradução de prototipo/gols-cartoes.html (US11/US12/RF28/RF29/RF30/RF31).
export default function GolsCartoesPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [baba, setBaba] = useState<BabaDetail | null>(null);
  const [presencaId, setPresencaId] = useState('');
  const [tipo, setTipo] = useState<EventoTipo>('GOL');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const detail = await babaService.getBaba(params.id);
    setBaba(detail);
    if (detail.presencas.length > 0 && !presencaId) setPresencaId(detail.presencas[0].id);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const teamsById = new Map<string, number>();
  baba?.teams.forEach((t) => t.members.forEach((m) => teamsById.set(m.presenca.id, t.number)));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!presencaId) {
      setError('Selecione um jogador.');
      return;
    }
    setSaving(true);
    try {
      const teamId = baba?.teams.find((t) => t.members.some((m) => m.presenca.id === presencaId))?.id;
      await babaService.createEvento(params.id, { presencaId, teamId, type: tipo });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível registrar o evento.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(eventId: string) {
    try {
      await babaService.deleteEvento(eventId);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível remover o evento.');
    }
  }

  if (!baba) {
    return (
      <DiretorShell eyebrow="Futebol" title="Registro de Gols e Cartões">
        <div className="flex justify-center py-16"><LoaderCircle className="h-8 w-8 animate-spin text-navy-600" /></div>
      </DiretorShell>
    );
  }

  return (
    <DiretorShell eyebrow="Futebol" title="Registro de Gols e Cartões">
      <div className="mx-auto max-w-3xl">
        <button onClick={() => router.push(`/baba-dia/${baba.id}/sorteio`)} className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-navy-600">
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar para Sorteio de Times
        </button>

        <p className="mb-4 text-sm text-slate-500">{formatDateBR(baba.date)} · registre os eventos conforme acontecem na partida.</p>

        {error && <div className="mb-4"><Alert type="error" title="Não foi possível registrar" description={error} /></div>}

        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-display text-sm font-semibold text-slate-700">Registrar evento</p>

          <div className="mt-4">
            <label htmlFor="jogador" className="mb-1.5 block text-sm font-medium text-slate-700">Jogador</label>
            <select id="jogador" value={presencaId} onChange={(e) => setPresencaId(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30">
              {baba.presencas.map((p) => (
                <option key={p.id} value={p.id}>
                  {participantName(p)}{teamsById.has(p.id) ? ` — Time ${teamsById.get(p.id)}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <p className="mb-1.5 block text-sm font-medium text-slate-700">Tipo de evento</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TIPO_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setTipo(opt.value)}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-3 text-center ${tipo === opt.value ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-white'}`}
                >
                  {opt.icon}
                  <span className={`mt-0.5 text-xs font-semibold ${tipo === opt.value ? 'text-teal-700' : 'text-slate-500'}`}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {tipo === 'CARTAO_VERMELHO' && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <p>Cartão vermelho gera <strong>suspensão automática</strong> para o próximo baba. O jogador ficará bloqueado na lista de presença até lá, salvo override manual em Suspensões.</p>
            </div>
          )}

          <button type="submit" disabled={saving} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-navy-600 py-3 font-display text-sm font-semibold text-white hover:bg-navy-700 disabled:opacity-70 sm:w-auto sm:px-8">
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Registrar evento
          </button>
        </form>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="font-display text-sm font-semibold text-slate-700">Eventos do baba de hoje</p>
          </div>
          <div className="divide-y divide-slate-100">
            {baba.events.length === 0 ? (
              <p className="px-5 py-4 text-sm text-slate-400">Nenhum evento registrado ainda.</p>
            ) : (
              baba.events.map((event: GameEvent) => (
                <div key={event.id} className={`flex items-center gap-3 px-5 py-3 ${event.type === 'CARTAO_VERMELHO' ? 'bg-red-50/60' : ''}`}>
                  {event.type === 'GOL' ? (
                    <span className="text-lg">⚽</span>
                  ) : (
                    <span className={`h-4 w-3 flex-shrink-0 rounded-sm ${event.type === 'CARTAO_AMARELO' ? 'bg-yellow-400' : event.type === 'CARTAO_AZUL' ? 'bg-blue-500' : 'bg-red-600'}`} />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{participantName(event.presenca)}</p>
                    <p className={`text-xs ${event.type === 'CARTAO_VERMELHO' ? 'text-red-500' : 'text-slate-400'}`}>
                      {teamsById.has(event.presenca.id) ? `Time ${teamsById.get(event.presenca.id)} · ` : ''}
                      {event.type === 'GOL' ? 'Gol' : event.type === 'CARTAO_AMARELO' ? 'Cartão amarelo' : event.type === 'CARTAO_AZUL' ? 'Cartão azul' : 'Cartão vermelho · suspenso no próximo baba'}
                    </p>
                  </div>
                  <button onClick={() => handleRemove(event.id)} className="text-slate-300 hover:text-red-500" title="Remover">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DiretorShell>
  );
}
