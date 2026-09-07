'use client';

import { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { SocioShell } from '@/components/layout/SocioShell';
import { EmptyState } from '@/components/ui/EmptyState';
import { babaService } from '@/features/baba/services';
import type { ArtilheiroRow, CartaoRankingRow, PresencaRankingRow } from '@/features/baba/types';
import { useAuth } from '@/lib/auth/AuthContext';
import { initials } from '@/lib/format';
import { Trophy } from 'lucide-react';

type Tab = 'artilheiros' | 'cartoes' | 'presenca';

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'artilheiros', label: '⚽ Artilheiros' },
  { key: 'cartoes', label: '🟨 Cartões' },
  { key: 'presenca', label: '📅 Presença' },
];

// Tradução de prototipo/rankings.html.
export default function RankingsPage() {
  const { user } = useAuth();
  const [season, setSeason] = useState(new Date().getFullYear());
  const [tab, setTab] = useState<Tab>('artilheiros');
  const [artilheiros, setArtilheiros] = useState<ArtilheiroRow[] | null>(null);
  const [cartoes, setCartoes] = useState<CartaoRankingRow[] | null>(null);
  const [presenca, setPresenca] = useState<PresencaRankingRow[] | null>(null);

  useEffect(() => {
    setArtilheiros(null);
    setCartoes(null);
    setPresenca(null);
    if (tab === 'artilheiros') babaService.getRankingArtilheiros(season).then(setArtilheiros);
    if (tab === 'cartoes') babaService.getRankingCartoes(season).then(setCartoes);
    if (tab === 'presenca') babaService.getRankingPresenca(season).then(setPresenca);
  }, [tab, season]);

  const meuSocioId = user?.socio?.id;

  return (
    <SocioShell eyebrow="Futebol" title="Rankings / Estatísticas">
      <div className="mb-4 flex items-center justify-end">
        <select
          value={season}
          onChange={(e) => setSeason(Number(e.target.value))}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        >
          {[season, season - 1, season - 2].map((y) => (
            <option key={y} value={y}>Temporada {y}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 rounded-full bg-slate-100 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold transition ${
              tab === t.key ? 'bg-navy-600 text-white' : 'text-slate-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === 'artilheiros' &&
          (!artilheiros ? (
            <Loading />
          ) : artilheiros.length === 0 ? (
            <Empty />
          ) : (
            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm">
              {artilheiros.map((row, index) => (
                <div
                  key={row.socioId}
                  className={`flex items-center gap-3 px-4 py-3 ${row.socioId === meuSocioId ? 'bg-teal-50/60' : ''}`}
                >
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                    {index + 1}
                  </span>
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-navy-100 font-display text-xs font-bold text-navy-600">
                    {initials(row.name)}
                  </div>
                  <p className={`flex-1 text-sm ${row.socioId === meuSocioId ? 'font-semibold text-teal-700' : 'font-medium text-slate-800'}`}>
                    {row.name} {row.socioId === meuSocioId && <span className="ml-1 rounded-full bg-teal-100 px-1.5 py-0.5 text-[10px] font-semibold">Você</span>}
                  </p>
                  <p className="font-display text-sm font-bold text-navy-600">{row.value} gols</p>
                </div>
              ))}
            </div>
          ))}

        {tab === 'cartoes' &&
          (!cartoes ? (
            <Loading />
          ) : cartoes.length === 0 ? (
            <Empty />
          ) : (
            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 px-4 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <p className="flex-1">Jogador</p>
                <p className="w-8 text-center">🟨</p>
                <p className="w-8 text-center">🟦</p>
                <p className="w-8 text-center">🟥</p>
              </div>
              {cartoes.map((row) => (
                <div key={row.socioId} className={`flex items-center gap-2 px-4 py-3 ${row.socioId === meuSocioId ? 'bg-teal-50/60' : ''}`}>
                  <div className="flex flex-1 items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 font-display text-xs font-bold text-slate-500">
                      {initials(row.name)}
                    </div>
                    <p className={`text-sm ${row.socioId === meuSocioId ? 'font-semibold text-teal-700' : 'font-medium text-slate-800'}`}>{row.name}</p>
                  </div>
                  <p className="w-8 text-center text-sm font-semibold text-slate-700">{row.amarelo}</p>
                  <p className="w-8 text-center text-sm font-semibold text-slate-700">{row.azul}</p>
                  <p className="w-8 text-center text-sm font-bold text-red-600">{row.vermelho}</p>
                </div>
              ))}
            </div>
          ))}

        {tab === 'presenca' &&
          (!presenca ? (
            <Loading />
          ) : presenca.length === 0 ? (
            <Empty />
          ) : (
            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm">
              {presenca.map((row) => (
                <div key={row.socioId} className={`px-4 py-3 ${row.socioId === meuSocioId ? 'bg-teal-50/60' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 font-display text-xs font-bold text-slate-500">
                      {initials(row.name)}
                    </div>
                    <p className={`flex-1 text-sm ${row.socioId === meuSocioId ? 'font-semibold text-teal-700' : 'font-medium text-slate-800'}`}>{row.name}</p>
                    <p className="font-display text-sm font-bold text-navy-600">{(row.percentual * 100).toFixed(0)}%</p>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-teal-500" style={{ width: `${row.percentual * 100}%` }} />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">{row.value} de {row.totalBabas} babas</p>
                </div>
              ))}
            </div>
          ))}
      </div>
    </SocioShell>
  );
}

function Loading() {
  return (
    <div className="flex justify-center py-8">
      <LoaderCircle className="h-6 w-6 animate-spin text-navy-600" />
    </div>
  );
}

function Empty() {
  return <EmptyState icon={Trophy} title="Sem dados nesta temporada" description="Assim que houver babas registrados, o ranking aparece aqui." />;
}
