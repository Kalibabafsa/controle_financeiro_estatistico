import { apiClient } from '@/lib/api-client';
import type { SystemConfig } from './types';

export const configService = {
  get: () => apiClient.get<SystemConfig>('/config'),
  updateValoresPadrao: (input: { defaultMonthlyFee: number; defaultGuestFee: number }) =>
    apiClient.patch<SystemConfig>('/config/valores-padrao', input),
  updateTemporada: (input: { currentSeason: number }) => apiClient.patch<SystemConfig>('/config/temporada', input),
  updatePix: (input: { pixKey: string; pixBeneficiaryName: string; pixBankName: string; pixCity: string }) =>
    apiClient.patch<SystemConfig>('/config/pix', input),
};
