'use client';

import { useEffect, useState } from 'react';
import { Check, Upload, Paperclip, LoaderCircle } from 'lucide-react';
import { DiretorShell } from '@/components/layout/DiretorShell';
import { Alert } from '@/components/ui/Alert';
import { despesasService, categoriasService } from '@/features/financeiro/despesas-services';
import type { Expense, ExpenseCategory } from '@/features/financeiro/despesas-types';
import { ApiError } from '@/lib/api-client';
import { formatBRL, formatDateBR, formatMonthLabel } from '@/lib/format';

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

// Tradução de prototipo/despesas.html (US6).
export default function DespesasPage() {
  const [categorias, setCategorias] = useState<ExpenseCategory[]>([]);
  const [expenses, setExpenses] = useState<{ data: Expense[]; total: string } | null>(null);
  const [weekStart, setWeekStart] = useState(todayInputValue());
  const [weekEnd, setWeekEnd] = useState(todayInputValue());
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    categoriasService.listDespesas().then((cats) => {
      const ativas = cats.filter((c) => c.isActive);
      setCategorias(ativas);
      if (ativas.length > 0) setCategoryId(ativas[0].id);
    });
    refreshExpenses();
  }, []);

  function refreshExpenses() {
    despesasService.listByMonth().then(setExpenses);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!categoryId || !amount) {
      setError('Preencha categoria e valor da despesa.');
      return;
    }

    const formData = new FormData();
    formData.set('categoryId', categoryId);
    formData.set('weekStart', weekStart);
    formData.set('weekEnd', weekEnd);
    formData.set('amount', amount.replace(',', '.'));
    if (description) formData.set('description', description);
    if (file) formData.set('attachment', file);

    setSaving(true);
    try {
      await despesasService.create(formData);
      setSuccess(true);
      setAmount('');
      setDescription('');
      setFile(null);
      refreshExpenses();
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível lançar a despesa.');
    } finally {
      setSaving(false);
    }
  }

  const total = expenses ? Number(expenses.total) : 0;

  return (
    <DiretorShell eyebrow="Financeiro" title="Gestão de Despesas">
      <div className="mx-auto max-w-4xl">
        {success && <div className="mb-4"><Alert type="success" title="Despesa lançada com sucesso." /></div>}
        {error && <div className="mb-4"><Alert type="error" title="Não foi possível lançar" description={error} /></div>}

        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-display text-sm font-semibold text-slate-700">Lançar nova despesa</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="weekStart" className="mb-1.5 block text-sm font-medium text-slate-700">Semana — início</label>
              <input id="weekStart" type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
            </div>
            <div>
              <label htmlFor="weekEnd" className="mb-1.5 block text-sm font-medium text-slate-700">Semana — fim</label>
              <input id="weekEnd" type="date" value={weekEnd} onChange={(e) => setWeekEnd(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
            </div>
            <div>
              <label htmlFor="categoria" className="mb-1.5 block text-sm font-medium text-slate-700">Categoria</label>
              <select id="categoria" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30">
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="valor" className="mb-1.5 block text-sm font-medium text-slate-700">Valor</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm text-slate-400">R$</span>
                <input id="valor" type="text" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="descricao" className="mb-1.5 block text-sm font-medium text-slate-700">Descrição <span className="font-normal text-slate-400">(opcional)</span></label>
              <input id="descricao" type="text" placeholder="Ex.: aluguel referente à semana" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Comprovante <span className="font-normal text-slate-400">(opcional)</span></label>
            <label htmlFor="anexo" className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center hover:border-teal-400 hover:bg-teal-50/40">
              <Upload className="h-6 w-6 text-slate-400" />
              <p className="text-sm text-slate-500"><span className="font-semibold text-teal-600">Clique para anexar</span> ou arraste o arquivo aqui</p>
              <p className="text-xs text-slate-400">PDF, JPG ou PNG — até 5MB</p>
              <input id="anexo" type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
            {file && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-teal-600">
                <Paperclip className="h-3.5 w-3.5" /> {file.name}
              </p>
            )}
          </div>

          <button type="submit" disabled={saving} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-navy-600 py-3 font-display text-sm font-semibold text-white hover:bg-navy-700 disabled:opacity-70 sm:w-auto sm:px-8">
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Lançar despesa
          </button>
        </form>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="font-display text-sm font-semibold text-slate-700">Despesas de {formatMonthLabel(new Date())}</p>
          </div>

          {!expenses ? (
            <div className="flex justify-center py-8"><LoaderCircle className="h-6 w-6 animate-spin text-navy-600" /></div>
          ) : expenses.data.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-400">Nenhuma despesa lançada neste mês ainda.</p>
          ) : (
            <>
              <table className="hidden w-full text-left text-sm lg:table">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-5 py-3">Semana</th>
                    <th className="px-5 py-3">Categoria</th>
                    <th className="px-5 py-3">Comprovante</th>
                    <th className="px-5 py-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.data.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 text-slate-600">{formatDateBR(e.weekStart)} – {formatDateBR(e.weekEnd)}</td>
                      <td className="px-5 py-3"><span className="rounded-full bg-navy-50 px-2.5 py-0.5 text-xs font-semibold text-navy-600">{e.category.name}</span></td>
                      <td className="px-5 py-3">
                        {e.attachmentPath ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600"><Paperclip className="h-3.5 w-3.5" /> Anexado</span>
                        ) : (
                          <span className="text-xs text-slate-400">Sem comprovante</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-slate-800">{formatBRL(e.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-50">
                    <td colSpan={3} className="px-5 py-3 text-right text-sm font-semibold text-slate-600">Total do mês</td>
                    <td className="px-5 py-3 text-right font-display font-bold text-slate-800">{formatBRL(total)}</td>
                  </tr>
                </tfoot>
              </table>

              <div className="divide-y divide-slate-100 lg:hidden">
                {expenses.data.map((e) => (
                  <div key={e.id} className="px-5 py-3">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-navy-50 px-2.5 py-0.5 text-xs font-semibold text-navy-600">{e.category.name}</span>
                      <span className="font-medium text-slate-800">{formatBRL(e.amount)}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{formatDateBR(e.weekStart)} – {formatDateBR(e.weekEnd)}</p>
                  </div>
                ))}
                <div className="flex items-center justify-between bg-slate-50 px-5 py-3">
                  <p className="text-sm font-semibold text-slate-600">Total do mês</p>
                  <p className="font-display font-bold text-slate-800">{formatBRL(total)}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DiretorShell>
  );
}
