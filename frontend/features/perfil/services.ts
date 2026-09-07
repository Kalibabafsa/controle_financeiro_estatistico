import { apiClient } from '@/lib/api-client';
import type { MeuPerfil } from './types';
import type { SocioStatusRecord } from '@/features/socios/types';

export const perfilService = {
  get: () => apiClient.get<MeuPerfil>('/me/perfil'),
  update: (input: { phone?: string; email?: string }) => apiClient.patch<MeuPerfil>('/me/perfil', input),
  getStatusHistory: (socioId: string) => apiClient.get<SocioStatusRecord[]>(`/socios/${socioId}/status-history`),
};
