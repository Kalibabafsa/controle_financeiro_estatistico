'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, Shuffle, LoaderCircle } from 'lucide-react';
import { DiretorShell } from '@/components/layout/DiretorShell';
import { Alert } from '@/components/ui/Alert';
import { babaService } from '@/features/baba/services';
import { sociosService } from '@/features/socios/services';
import { convidadosService } from '@/features/convidados/services';
import type { BabaDetail } from '@/features/baba/types';
import type { PresencaFormItem } from '@/features/baba/presenca-schemas';
import { ApiError } from '@/lib/api-client';
import { formatDateBR, initials } from '@/lib/format';

// Tradução de prototipo/baba-dia.html (US10/RF25/RF26/RF30).
export default function BabaDiaPage() {
  return (
    <Suspense fallback={null}>
      <BabaDiaContent />
    </Suspense>
  );
}

function BabaDiaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('id');

  const [babas, setBabas] = useState<BabaDetail[] | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('08:00');
  const [location, setLocation] = useState('Quadra da Associação Kalibaba');

  const [baba, setBaba] = useState<BabaDetail | null>(null);
  const [roster, setRoster] = useState<PresencaFormItem[]>([]);
  const [search, setSearch] = useState('');
  const [novoConvidadoNome, setNovoConvidadoNome] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    babaService.listBabas(1).then((r) => setBabas(r.data));
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setBaba(null);
      return;
    }
    (async () => {
      const [detail, sociosResult] = await Promise.all([
        babaService.getBaba(selectedId),
        sociosService.list({ pageSize: 100 }),
      ]);
      setBaba(detail);

      const presentIds = new Set(detail.presencas.map((p) => p.socioId ?? p.convidadoId));
      const socioRows: PresencaFormItem[] = sociosResult.data
        .filter((s) => s.currentStatus !== 'I')
        .map((s) => ({
          key: `SOCIO:${s.id}`,
          type: 'SOCIO',
          id: s.id,
          name: s.name,
          position: detail.presencas.find((p) => p.socioId === s.id)?.position ?? s.defaultPosition,
          present: presentIds.has(s.id),
        }));
      const convidadoRows: PresencaFormItem[] = detail.presencas
        .filter((p) => p.participantType === 'CONVIDADO' && p.convidado)
        .map((p) => ({
          key: `CONVIDADO:${p.convidadoId}`,
          type: 'CONVIDADO',
          id: p.convidadoId!,
          name: p.convidado!.name,
          position: p.position,
          present: true,
        }));
      setRoster([...socioRows, ...convidadoRows]);
    })();
  }, [selectedId]);

  const filteredRoster = useMemo(
    () => roster.filter((r) => r.name.toLowerCase().includes(search.toLowerCase())),
    [roster, search]
  );

  const presentesCount = roster.filter((r) => r.present).length;
  const goleirosCount = roster.filter((r) => r.present && r.position === 'GOLEIRO').length;

  async function handleCreateBaba(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!date) {
      setError('Informe a data do baba.');
      return;
    }
    try {
      const novo = await babaService.createBaba({ date, time: time || undefined, location: location || undefined });
      const r = await babaService.listBabas(1);
      setBabas(r.data);
      router.push(`/baba-dia?id=${novo.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível criar o baba.');
    }
  }

  function updateRow(key: string, patch: Partial<PresencaFormItem>) {
    setRoster((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  async function handleAddConvidado() {
    if (!novoConvidadoNome.trim()) return;
    const convidado = await convidadosService.create({ name: novoConvidadoNome.trim() });
    setRoster((prev) => [
      ...prev,
      { key: `CONVIDADO:${convidado.id}`, type: 'CONVIDADO', id: convidado.id, name: convidado.name, position: 'LINHA', present: true },
    ]);
    setNovoConvidadoNome('');
  }

  async function handleSavePresenca() {
    if (!baba) return;
    setError(null);
    setSaving(true);
    try {
      const participants = roster
        .filter((r) => r.present)
        .map((r) => ({
          type: r.type,
          socioId: r.type === 'SOCIO' ? r.id : undefined,
          convidadoId: r.type === 'CONVIDADO' ? r.id : undefined,
          position: r.position,
        }));
      await babaService.setPresenca(baba.id, participants);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar a presença.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <DiretorShell eyebrow="Futebol" title="Baba do Dia">
      <div className="mx-auto max-w-4xl">
        {success && <div className="mb-4"><Alert type="success" title="Presença salva com sucesso." /></div>}
        {error && <div className="mb-4"><Alert type="error" title="Não foi possível concluir" description={error} /></div>}

        {!selectedId ? (
          <>
            <form onSubmit={handleCreateBaba} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="font-display text-sm font-semibold text-slate-700">Novo baba do dia</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="data" className="mb-1.5 block text-sm font-medium text-slate-700">Data (domingo)</label>
                  <input id="data" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
                </div>
                <div>
                  <label htmlFor="horario" className="mb-1.5 block text-sm font-medium text-slate-700">Horário</label>
                  <input id="horario" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
                </div>
                <div>
                  <label htmlFor="local" className="mb-1.5 block text-sm font-medium text-slate-700">Local</label>
                  <input id="local" type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
                </div>
              </div>
              <button type="submit" className="mt-4 flex items-center gap-2 rounded-full bg-navy-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-700">
                <Plus className="h-4 w-4" /> Criar baba
              </button>
            </form>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <p className="font-display text-sm font-semibold text-slate-700">Babas recentes</p>
              </div>
              <div className="divide-y divide-slate-100">
                {!babas ? (
                  <div className="flex justify-center py-6"><LoaderCircle className="h-5 w-5 animate-spin text-navy-600" /></div>
                ) : babas.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-slate-400">Nenhum baba registrado ainda.</p>
                ) : (
                  babas.map((b) => (
                    <button key={b.id} onClick={() => router.push(`/baba-dia?id=${b.id}`)} className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-slate-50">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{formatDateBR(b.date)}</p>
                        <p className="text-xs text-slate-400">{b.time ?? '—'} · {b.location ?? 'Local a definir'}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        ) : !baba ? (
          <div className="flex justify-center py-16"><LoaderCircle className="h-8 w-8 animate-spin text-navy-600" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                <p className="font-display text-xl font-bold text-navy-600">{presentesCount}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">Presentes</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                <p className="font-display text-xl font-bold text-teal-600">{goleirosCount}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">Goleiros presentes</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <p className="font-display text-sm font-semibold text-slate-700">Lista de presença — {formatDateBR(baba.date)}</p>
                <div className="relative mt-3">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Search className="h-4 w-4" />
                  </span>
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar sócio ou convidado..." className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredRoster.map((row) => (
                  <div key={row.key} className={`flex items-center gap-3 px-5 py-3 ${row.type === 'CONVIDADO' ? 'bg-sun-50/30' : ''}`}>
                    <input
                      type="checkbox"
                      checked={row.present}
                      onChange={(e) => updateRow(row.key, { present: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500/40"
                    />
                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-display text-xs font-bold ${row.type === 'CONVIDADO' ? 'bg-sun-50 text-sun-500' : 'bg-navy-100 text-navy-600'}`}>
                      {initials(row.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{row.name}</p>
                      <p className="text-xs text-slate-400">{row.type === 'SOCIO' ? 'Sócio' : 'Convidado'}</p>
                    </div>
                    <select
                      value={row.position}
                      onChange={(e) => updateRow(row.key, { position: e.target.value as 'GOLEIRO' | 'LINHA' })}
                      className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                    >
                      <option value="LINHA">Linha</option>
                      <option value="GOLEIRO">Goleiro</option>
                    </select>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Adicionar convidado ao baba de hoje</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={novoConvidadoNome}
                    onChange={(e) => setNovoConvidadoNome(e.target.value)}
                    placeholder="Nome do convidado"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  />
                  <button type="button" onClick={handleAddConvidado} className="flex flex-shrink-0 items-center justify-center gap-1.5 rounded-xl bg-navy-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-700">
                    <Plus className="h-4 w-4" /> Adicionar
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={handleSavePresenca} disabled={saving} className="flex items-center justify-center rounded-full border border-slate-300 px-6 py-2.5 font-display text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-70">
                {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Salvar presença'}
              </button>
              <Link href={`/baba-dia/${baba.id}/sorteio`} className="flex items-center justify-center gap-2 rounded-full bg-navy-600 px-6 py-2.5 font-display text-sm font-semibold text-white hover:bg-navy-700">
                <Shuffle className="h-4 w-4" />
                Ir para Sorteio de Times
              </Link>
            </div>
          </>
        )}
      </div>
    </DiretorShell>
  );
}
