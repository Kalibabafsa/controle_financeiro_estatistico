'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Shuffle, RotateCw, Check, CheckCircle, LoaderCircle } from 'lucide-react';
import { DiretorShell } from '@/components/layout/DiretorShell';
import { Alert } from '@/components/ui/Alert';
import { babaService } from '@/features/baba/services';
import type { BabaDetail } from '@/features/baba/types';
import { ApiError } from '@/lib/api-client';
import { formatDateBR, initials } from '@/lib/format';

interface TeamPlayer {
  presencaId: string;
  name: string;
  position: 'GOLEIRO' | 'LINHA';
}

// Tradução de prototipo/sorteio-times.html (US10/RF27).
export default function SorteioTimesPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [baba, setBaba] = useState<BabaDetail | null>(null);
  const [teams, setTeams] = useState<Record<number, TeamPlayer[]> | null>(null);
  const [sorting, setSorting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const detail = await babaService.getBaba(params.id);
    setBaba(detail);
    if (detail.teams.length > 0) {
      const mapped: Record<number, TeamPlayer[]> = {};
      for (const team of detail.teams) {
        mapped[team.number] = team.members.map((m) => ({
          presencaId: m.presenca.id,
          name: m.presenca.socio?.name ?? m.presenca.convidado?.name ?? 'Participante',
          position: m.presenca.position,
        }));
      }
      setTeams(mapped);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleSortear() {
    setError(null);
    setSorting(true);
    try {
      await babaService.sortear(params.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível sortear os times.');
    } finally {
      setSorting(false);
    }
  }

  function moveToTeam(presencaId: string, fromTeam: number, toTeam: number) {
    if (!teams || fromTeam === toTeam) return;
    setTeams((prev) => {
      if (!prev) return prev;
      const player = prev[fromTeam].find((p) => p.presencaId === presencaId);
      if (!player) return prev;
      return {
        ...prev,
        [fromTeam]: prev[fromTeam].filter((p) => p.presencaId !== presencaId),
        [toTeam]: [...prev[toTeam], player],
      };
    });
  }

  async function handleSalvarTimes() {
    if (!teams) return;
    setError(null);
    setSaving(true);
    try {
      const payload = Object.entries(teams).map(([number, players]) => ({
        number: Number(number),
        presencaIds: players.map((p) => p.presencaId),
      }));
      await babaService.setTimes(params.id, payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar os times.');
    } finally {
      setSaving(false);
    }
  }

  if (!baba) {
    return (
      <DiretorShell eyebrow="Futebol" title="Sorteio de Times">
        <div className="flex justify-center py-16"><LoaderCircle className="h-8 w-8 animate-spin text-navy-600" /></div>
      </DiretorShell>
    );
  }

  const presentes = baba.presencas.length;
  const goleiros = baba.presencas.filter((p) => p.position === 'GOLEIRO').length;

  return (
    <DiretorShell eyebrow="Futebol" title="Sorteio de Times">
      <div className="mx-auto max-w-5xl">
        <button onClick={() => router.push(`/baba-dia?id=${baba.id}`)} className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-navy-600">
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar para Baba do Dia
        </button>

        {error && <div className="mb-4"><Alert type="error" title="Não foi possível concluir" description={error} /></div>}
        {saved && <div className="mb-4"><Alert type="success" title="Times salvos com sucesso." /></div>}

        {!teams ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-navy-50 text-navy-600">
              <Shuffle className="h-8 w-8" />
            </div>
            <p className="mt-4 font-display text-lg font-bold text-slate-800">{formatDateBR(baba.date)}</p>
            <p className="mt-1 text-sm text-slate-500">{presentes} jogadores presentes · {goleiros} goleiros · prontos para o sorteio</p>
            <button onClick={handleSortear} disabled={sorting || presentes === 0} className="mt-6 inline-flex items-center gap-2 rounded-full bg-navy-600 px-8 py-3 font-display text-sm font-semibold text-white hover:bg-navy-700 disabled:opacity-70">
              {sorting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Shuffle className="h-4 w-4" />}
              Sortear Times
            </button>
            <p className="mt-3 text-xs text-slate-400">Distribui automaticamente em 4 times (1 goleiro + 6 de linha cada), respeitando suspensões.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-1 text-sm text-slate-600">
                <CheckCircle className="h-4 w-4 text-teal-600" /> Times sorteados! Use os seletores para ajustar manualmente, se necessário.
              </p>
              <div className="flex gap-2">
                <button onClick={handleSortear} disabled={sorting} className="flex items-center gap-1.5 rounded-full border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  <RotateCw className="h-3.5 w-3.5" /> Sortear novamente
                </button>
                <button onClick={handleSalvarTimes} disabled={saving} className="flex items-center gap-1.5 rounded-full bg-navy-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-navy-700 disabled:opacity-70">
                  {saving ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Salvar times
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((teamNumber) => (
                <div key={teamNumber} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${teamNumber % 2 === 0 ? 'bg-teal-600' : 'bg-navy-600'}`}>{teamNumber}</span>
                    <p className="font-display text-sm font-semibold text-slate-800">Time {teamNumber}</p>
                  </div>
                  <div className="space-y-2">
                    {(teams[teamNumber] ?? []).map((player) => (
                      <div key={player.presencaId} className="flex items-center gap-2 rounded-xl border border-slate-100 px-2.5 py-2">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 font-display text-[10px] font-bold text-slate-500">
                          {initials(player.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-slate-800">{player.name}</p>
                          <p className="text-[10px] text-slate-400">{player.position === 'GOLEIRO' ? 'Goleiro' : 'Linha'}</p>
                        </div>
                        <select
                          value={teamNumber}
                          onChange={(e) => moveToTeam(player.presencaId, teamNumber, Number(e.target.value))}
                          className="rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-[11px] text-slate-500 focus:border-teal-500 focus:outline-none"
                        >
                          {[1, 2, 3, 4].map((n) => (
                            <option key={n} value={n}>Time {n}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </DiretorShell>
  );
}
