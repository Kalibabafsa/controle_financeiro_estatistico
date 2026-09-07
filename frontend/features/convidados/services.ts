import { apiClient } from '@/lib/api-client';
import type { Convidado, PaginatedResponse } from './types';

export const convidadosService = {
  list: (params: { search?: string; page?: number; pageSize?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.page) query.set('page', String(params.page));
    if (params.pageSize) query.set('pageSize', String(params.pageSize));
    const qs = query.toString();
    return apiClient.get<PaginatedResponse<Convidado>>(`/convidados${qs ? `?${qs}` : ''}`);
  },
  getById: (id: string) => apiClient.get<Convidado>(`/convidados/${id}`),
  create: (input: { name: string; phone?: string; invitedById?: string }) =>
    apiClient.post<Convidado>('/convidados', input),
  update: (id: string, input: Partial<{ name: string; phone: string; invitedById: string }>) =>
    apiClient.patch<Convidado>(`/convidados/${id}`, input),
  removeContact: (id: string) => apiClient.post(`/convidados/${id}/remover-contato`),
};
