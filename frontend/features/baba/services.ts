import { apiClient } from '@/lib/api-client';
import type { ArtilheiroRow, BabaDetail, CartaoRankingRow, PresencaRankingRow, ProximoBabaResponse, SuspensionItem } from './types';

export const babaService = {
  getProximoBaba: () => apiClient.get<ProximoBabaResponse>('/me/proximo-baba'),
  listBabas: (page = 1) => apiClient.get<{ data: BabaDetail[]; total: number }>(`/babas?page=${page}`),
  getBaba: (id: string) => apiClient.get<BabaDetail>(`/babas/${id}`),
  createBaba: (input: { date: string; time?: string; location?: string }) =>
    apiClient.post<BabaDetail>('/babas', input),
  setPresenca: (
    id: string,
    participants: Array<{ type: 'SOCIO' | 'CONVIDADO'; socioId?: string; convidadoId?: string; position: 'GOLEIRO' | 'LINHA' }>
  ) => apiClient.put(`/babas/${id}/presenca`, { participants }),
  sortear: (id: string) => apiClient.post(`/babas/${id}/sorteio`, {}),
  setTimes: (id: string, teams: Array<{ number: number; presencaIds: string[] }>) =>
    apiClient.put(`/babas/${id}/times`, { teams }),
  getEventos: (id: string) => apiClient.get<BabaDetail['events']>(`/babas/${id}/eventos`),
  createEvento: (id: string, input: { presencaId: string; teamId?: string; type: string }) =>
    apiClient.post(`/babas/${id}/eventos`, input),
  deleteEvento: (eventId: string) => apiClient.delete(`/eventos/${eventId}`),

  getRankingArtilheiros: (season: number) =>
    apiClient.get<ArtilheiroRow[]>(`/rankings?season=${season}&type=artilheiros`),
  getRankingCartoes: (season: number) =>
    apiClient.get<CartaoRankingRow[]>(`/rankings?season=${season}&type=cartoes`),
  getRankingPresenca: (season: number) =>
    apiClient.get<PresencaRankingRow[]>(`/rankings?season=${season}&type=presenca`),

  getSuspensoes: () => apiClient.get<{ ativas: SuspensionItem[]; historico: SuspensionItem[] }>('/suspensoes'),
  liberarSuspensao: (id: string, reason?: string) => apiClient.post(`/suspensoes/${id}/liberar`, { reason }),
};
