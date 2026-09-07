import { apiClient } from '@/lib/api-client';
import type { Expense, ExpenseCategory, RevenueCategory } from './despesas-types';

export const despesasService = {
  listByMonth: (month?: string) =>
    apiClient.get<{ data: Expense[]; total: string }>(`/despesas${month ? `?month=${month}` : ''}`),

  create: (formData: FormData) => apiClient.post<Expense>('/despesas', formData),

  getAnexoUrl: (id: string) => apiClient.get<{ url: string }>(`/despesas/${id}/anexo`),
};

export const categoriasService = {
  listDespesas: () => apiClient.get<ExpenseCategory[]>('/categorias/despesas'),
  createDespesa: (name: string) => apiClient.post<ExpenseCategory>('/categorias/despesas', { name }),
  updateDespesa: (id: string, input: Partial<{ name: string; isActive: boolean }>) =>
    apiClient.patch<ExpenseCategory>(`/categorias/despesas/${id}`, input),

  listReceitas: () => apiClient.get<RevenueCategory[]>('/categorias/receitas'),
  createReceita: (name: string) => apiClient.post<RevenueCategory>('/categorias/receitas', { name }),
  updateReceita: (id: string, input: Partial<{ name: string; isActive: boolean }>) =>
    apiClient.patch<RevenueCategory>(`/categorias/receitas/${id}`, input),
};
