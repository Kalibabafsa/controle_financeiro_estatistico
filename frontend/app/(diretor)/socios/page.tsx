'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, UserPlus, Pencil, ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react';
import { DiretorShell } from '@/components/layout/DiretorShell';
import { EmptyState } from '@/components/ui/EmptyState';
import { sociosService } from '@/features/socios/services';
import type { Socio } from '@/features/socios/types';
import { initials, formatMonthLabel } from '@/lib/format';
import { Users } from 'lucide-react';

const STATUS_BADGE: Record<Socio['currentStatus'], string> = {
  A: 'bg-teal-50 text-teal-700',
  DM: 'bg-sun-50 text-sun-500',
  I: 'bg-slate-100 text-slate-500',
};
const STATUS_LABEL: Record<Socio['currentStatus'], string> = { A: 'Ativo', DM: 'DM', I: 'Inativo' };
const PAGE_SIZE = 20;

// Tradução de prototipo/socios-lista.html.
export default function SociosListaPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{ data: Socio[]; total: number } | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      sociosService.list({ search: search || undefined, status: status || undefined, page }).then(setResult);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, status, page]);

  const totalPages = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;

  return (
    <DiretorShell eyebrow="Associados" title="Gestão de Sócios">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/socios/novo" className="flex items-center justify-center gap-2 rounded-full bg-navy-600 px-4 py-2.5 font-display text-sm font-semibold text-white hover:bg-navy-700 sm:ml-auto">
          <UserPlus className="h-4 w-4" />
          Novo Sócio
        </Link>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-600 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        >
          <option value="">Todos os status</option>
          <option value="A">Ativo</option>
          <option value="DM">DM</option>
          <option value="I">Inativo</option>
        </select>
      </div>

      {!result ? (
        <div className="flex justify-center py-16"><LoaderCircle className="h-8 w-8 animate-spin text-navy-600" /></div>
      ) : result.data.length === 0 ? (
        <div className="mt-4"><EmptyState icon={Users} title="Nenhum sócio encontrado" description="Ajuste os filtros ou cadastre um novo sócio." /></div>
      ) : (
        <>
          <div className="mt-4 hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3">Sócio</th>
                  <th className="px-5 py-3">Contato</th>
                  <th className="px-5 py-3">Sócio desde</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.data.map((socio) => (
                  <tr key={socio.id} className="hover:bg-slate-50">
                    <td className="flex items-center gap-3 px-5 py-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-100 font-display text-xs font-bold text-navy-600">
                        {initials(socio.name)}
                      </div>
                      <span className="font-medium text-slate-800">{socio.name}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{socio.phone ?? '—'}</td>
                    <td className="px-5 py-3 text-slate-500">{socio.memberSince ? formatMonthLabel(socio.memberSince) : '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[socio.currentStatus]}`}>
                        {STATUS_LABEL[socio.currentStatus]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/socios/${socio.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700">
                        <Pencil className="h-3.5 w-3.5" /> Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 space-y-3 lg:hidden">
            {result.data.map((socio) => (
              <Link key={socio.id} href={`/socios/${socio.id}`} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-navy-100 font-display text-sm font-bold text-navy-600">
                  {initials(socio.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-800">{socio.name}</p>
                  <p className="text-xs text-slate-500">{socio.phone ?? 'sem telefone'}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[socio.currentStatus]}`}>
                  {STATUS_LABEL[socio.currentStatus]}
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
            <p>Mostrando {result.data.length} de {result.total} sócios</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-400 hover:border-navy-400 hover:text-navy-600 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-600 font-semibold text-white">{page}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:border-navy-400 hover:text-navy-600 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </DiretorShell>
  );
}
