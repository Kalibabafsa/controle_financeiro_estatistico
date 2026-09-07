'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, UserPlus, Pencil, ChevronLeft, ChevronRight, LoaderCircle, UserPlus as UserPlusIcon } from 'lucide-react';
import { DiretorShell } from '@/components/layout/DiretorShell';
import { EmptyState } from '@/components/ui/EmptyState';
import { convidadosService } from '@/features/convidados/services';
import type { Convidado } from '@/features/convidados/types';
import { initials } from '@/lib/format';

const PAGE_SIZE = 20;

// Tradução de prototipo/convidados-lista.html.
export default function ConvidadosListaPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{ data: Convidado[]; total: number } | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      convidadosService.list({ search: search || undefined, page }).then(setResult);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, page]);

  const totalPages = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;

  return (
    <DiretorShell eyebrow="Associados" title="Gestão de Convidados">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/convidados/novo" className="flex items-center justify-center gap-2 rounded-full bg-navy-600 px-4 py-2.5 font-display text-sm font-semibold text-white hover:bg-navy-700 sm:ml-auto">
          <UserPlus className="h-4 w-4" />
          Novo Convidado
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
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
      </div>

      {!result ? (
        <div className="flex justify-center py-16"><LoaderCircle className="h-8 w-8 animate-spin text-navy-600" /></div>
      ) : result.data.length === 0 ? (
        <div className="mt-4"><EmptyState icon={UserPlusIcon} title="Nenhum convidado encontrado" /></div>
      ) : (
        <>
          <div className="mt-4 hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3">Convidado</th>
                  <th className="px-5 py-3">Telefone</th>
                  <th className="px-5 py-3">Convidado por</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.data.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="flex items-center gap-3 px-5 py-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sun-50 font-display text-xs font-bold text-sun-500">
                        {initials(c.name)}
                      </div>
                      <span className="font-medium text-slate-800">{c.name}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{c.phone ?? '—'}</td>
                    <td className="px-5 py-3 text-slate-500">{c.invitedBy?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/convidados/${c.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700">
                        <Pencil className="h-3.5 w-3.5" /> Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 space-y-3 lg:hidden">
            {result.data.map((c) => (
              <Link key={c.id} href={`/convidados/${c.id}`} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-sun-50 font-display text-sm font-bold text-sun-500">
                  {initials(c.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-800">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.invitedBy ? `Convidado por ${c.invitedBy.name}` : 'Sem indicação'}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
            <p>Mostrando {result.data.length} de {result.total} convidados</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-400 hover:border-navy-400 hover:text-navy-600 disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-600 font-semibold text-white">{page}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:border-navy-400 hover:text-navy-600 disabled:opacity-40">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </DiretorShell>
  );
}
