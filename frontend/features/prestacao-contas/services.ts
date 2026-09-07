import { apiClient } from '@/lib/api-client';
import type { PrestacaoContas, PrestacaoPreview } from './types';

export const prestacaoContasService = {
  list: () => apiClient.get<PrestacaoContas[]>('/prestacoes'),
  preview: (month: string) => apiClient.get<PrestacaoPreview>(`/prestacoes/${month}/preview`),
  generate: (referenceMonth: string) => apiClient.post<PrestacaoContas>('/prestacoes', { referenceMonth }),
  getPdfUrl: (month: string) => apiClient.get<{ url: string }>(`/prestacoes/${month}/pdf`),
};
