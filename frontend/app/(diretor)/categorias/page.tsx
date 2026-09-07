'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Eye, EyeOff, Info, LoaderCircle } from 'lucide-react';
import { DiretorShell } from '@/components/layout/DiretorShell';
import { Alert } from '@/components/ui/Alert';
import { categoriasService } from '@/features/financeiro/despesas-services';
import type { ExpenseCategory, RevenueCategory } from '@/features/financeiro/despesas-types';
import { ApiError } from '@/lib/api-client';

type Tab = 'despesa' | 'receita';

// Tradução de prototipo/categorias.html (RF15).
export default function CategoriasPage() {
  const [tab, setTab] = useState<Tab>('despesa');
  const [despesas, setDespesas] = useState<ExpenseCategory[] | null>(null);
  const [receitas, setReceitas] = useState<RevenueCategory[] | null>(null);
  const [novoNome, setNovoNome] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  function load() {
    categoriasService.listDespesas().then(setDespesas);
    categoriasService.listReceitas().then(setReceitas);
  }

  useEffect(load, []);

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!novoNome.trim()) return;

    try {
      if (tab === 'despesa') await categoriasService.createDespesa(novoNome.trim());
      else await categoriasService.createReceita(novoNome.trim());
      setNovoNome('');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível adicionar a categoria.');
    }
  }

  async function toggleActive(category: ExpenseCategory | RevenueCategory, isExpense: boolean) {
    try {
      if (isExpense) await categoriasService.updateDespesa(category.id, { isActive: !category.isActive });
      else await categoriasService.updateReceita(category.id, { isActive: !category.isActive });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível atualizar a categoria.');
    }
  }

  async function confirmRename(isExpense: boolean) {
    if (!renamingId || !renameValue.trim()) return;
    try {
      if (isExpense) await categoriasService.updateDespesa(renamingId, { name: renameValue.trim() });
      else await categoriasService.updateReceita(renamingId, { name: renameValue.trim() });
      setRenamingId(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível renomear a categoria.');
    }
  }

  return (
    <DiretorShell eyebrow="Financeiro" title="Gestão de Categorias">
      <div className="mx-auto max-w-2xl">
        {error && <div className="mb-4"><Alert type="error" title="Não foi possível concluir" description={error} /></div>}

        <div className="flex gap-2 rounded-full bg-slate-100 p-1">
          <button onClick={() => setTab('despesa')} className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${tab === 'despesa' ? 'bg-navy-600 text-white' : 'text-slate-500'}`}>
            Categorias de Despesa
          </button>
          <button onClick={() => setTab('receita')} className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${tab === 'receita' ? 'bg-navy-600 text-white' : 'text-slate-500'}`}>
            Categorias de Receita
          </button>
        </div>

        <form onSubmit={handleAdd} className="mt-4 flex items-center gap-2">
          <input
            type="text"
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            placeholder={`Nome da nova categoria de ${tab}...`}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          />
          <button type="submit" className="flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-navy-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-700">
            <Plus className="h-4 w-4" />
            Adicionar
          </button>
        </form>

        <div className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm">
          {tab === 'despesa' ? (
            !despesas ? (
              <div className="flex justify-center py-8"><LoaderCircle className="h-6 w-6 animate-spin text-navy-600" /></div>
            ) : (
              despesas.map((c) => (
                <div key={c.id} className={`flex items-center justify-between px-5 py-3 ${!c.isActive ? 'opacity-60' : ''}`}>
                  {renamingId === c.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => confirmRename(true)}
                      onKeyDown={(e) => e.key === 'Enter' && confirmRename(true)}
                      className="rounded-lg border border-teal-400 px-2 py-1 text-sm"
                    />
                  ) : (
                    <span className={`text-sm font-medium ${c.isActive ? 'text-slate-800' : 'text-slate-500 line-through'}`}>{c.name}</span>
                  )}
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.isActive ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>
                      {c.isActive ? 'Ativa' : 'Inativa'}
                    </span>
                    <button onClick={() => { setRenamingId(c.id); setRenameValue(c.name); }} className="text-slate-400 hover:text-navy-600" title="Editar">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => toggleActive(c, true)} className="text-slate-400 hover:text-red-500" title={c.isActive ? 'Inativar' : 'Reativar'}>
                      {c.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ))
            )
          ) : !receitas ? (
            <div className="flex justify-center py-8"><LoaderCircle className="h-6 w-6 animate-spin text-navy-600" /></div>
          ) : (
            receitas.map((c) => (
              <div key={c.id} className={`flex items-center justify-between px-5 py-3 ${!c.isActive ? 'opacity-60' : ''}`}>
                <div>
                  {renamingId === c.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => confirmRename(false)}
                      onKeyDown={(e) => e.key === 'Enter' && confirmRename(false)}
                      className="rounded-lg border border-teal-400 px-2 py-1 text-sm"
                    />
                  ) : (
                    <span className={`text-sm font-medium ${c.isActive ? 'text-slate-800' : 'text-slate-500 line-through'}`}>{c.name}</span>
                  )}
                  {c.isSystem && <p className="text-[11px] text-slate-400">Categoria do sistema — não pode ser inativada</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.isActive ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>
                    {c.isActive ? 'Ativa' : 'Inativa'}
                  </span>
                  {!c.isSystem && (
                    <>
                      <button onClick={() => { setRenamingId(c.id); setRenameValue(c.name); }} className="text-slate-400 hover:text-navy-600" title="Editar">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => toggleActive(c, false)} className="text-slate-400 hover:text-red-500" title={c.isActive ? 'Inativar' : 'Reativar'}>
                        {c.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
          <Info className="h-3.5 w-3.5" />
          Categorias inativadas somem das opções de novos lançamentos, mas lançamentos antigos continuam preservados.
        </p>
      </div>
    </DiretorShell>
  );
}
