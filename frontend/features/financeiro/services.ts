import { apiClient } from '@/lib/api-client';
import type {
  DashboardFinanceiroResponse,
  GuestPayment,
  InadimplenteItem,
  PixPayloadResponse,
  SituacaoGeralResponse,
  SituacaoResponse,
  SocioPayment,
} from './types';

export const financeiroService = {
  getSituacao: () => apiClient.get<SituacaoResponse>('/me/situacao'),
  getMensalidades: (year?: number) =>
    apiClient.get<SocioPayment[]>(`/me/mensalidades${year ? `?year=${year}` : ''}`),
  getSituacaoGeral: () => apiClient.get<SituacaoGeralResponse>('/situacao-geral'),
  getPixPayload: (amount?: number) =>
    apiClient.get<PixPayloadResponse>(`/pix/payload${amount ? `?amount=${amount}` : ''}`),

  getDashboard: (month?: string) =>
    apiClient.get<DashboardFinanceiroResponse>(`/dashboard/financeiro${month ? `?month=${month}` : ''}`),
  getInadimplencia: (month?: string) =>
    apiClient.get<InadimplenteItem[]>(`/inadimplencia${month ? `?month=${month}` : ''}`),

  listMensalidades: (params: { socioId?: string; month?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.socioId) query.set('socioId', params.socioId);
    if (params.month) query.set('month', params.month);
    const qs = query.toString();
    return apiClient.get<SocioPayment[]>(`/mensalidades${qs ? `?${qs}` : ''}`);
  },
  createMensalidade: (input: {
    socioId: string;
    referenceMonth: string;
    amount?: number;
    paymentMethod: 'PIX' | 'DIN';
    paidAt: string;
  }) => apiClient.post<SocioPayment>('/mensalidades', input),

  listPagamentosConvidados: (params: { convidadoId?: string; month?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.convidadoId) query.set('convidadoId', params.convidadoId);
    if (params.month) query.set('month', params.month);
    const qs = query.toString();
    return apiClient.get<GuestPayment[]>(`/pagamentos-convidados${qs ? `?${qs}` : ''}`);
  },
  createPagamentoConvidado: (input: {
    convidadoId: string;
    matchDate: string;
    amount?: number;
    paymentMethod: 'PIX' | 'DIN';
    paidAt: string;
  }) => apiClient.post<GuestPayment>('/pagamentos-convidados', input),
};
