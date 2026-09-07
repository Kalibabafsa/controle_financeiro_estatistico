import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse, Socio, SocioStatusRecord } from './types';

export const sociosService = {
  list: (params: { search?: string; status?: string; page?: number; pageSize?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.status) query.set('status', params.status);
    if (params.page) query.set('page', String(params.page));
    if (params.pageSize) query.set('pageSize', String(params.pageSize));
    const qs = query.toString();
    return apiClient.get<PaginatedResponse<Socio>>(`/socios${qs ? `?${qs}` : ''}`);
  },
  getById: (id: string) => apiClient.get<Socio>(`/socios/${id}`),
  create: (input: { name: string; email?: string; phone?: string; defaultPosition?: 'GOLEIRO' | 'LINHA' }) =>
    apiClient.post<Socio>('/socios', input),
  update: (id: string, input: Partial<{ name: string; email: string; phone: string; defaultPosition: 'GOLEIRO' | 'LINHA' }>) =>
    apiClient.patch<Socio>(`/socios/${id}`, input),
  updateStatus: (id: string, input: { referenceMonth: string; status: 'A' | 'DM' | 'I'; observation?: string }) =>
    apiClient.patch<SocioStatusRecord>(`/socios/${id}/status`, input),
  getStatusHistory: (id: string) => apiClient.get<SocioStatusRecord[]>(`/socios/${id}/status-history`),
};
