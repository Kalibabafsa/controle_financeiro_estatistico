import { systemConfigRepository } from '../repositories/systemConfig.repository';
import { auditService } from './audit.service';
import type { UpdatePixConfigInput, UpdateTemporadaInput, UpdateValoresPadraoInput } from '../schemas/config.schemas';

export const configService = {
  get() {
    return systemConfigRepository.get();
  },

  async updateValoresPadrao(input: UpdateValoresPadraoInput, actorUserId: string) {
    const config = await systemConfigRepository.update({
      defaultMonthlyFee: input.defaultMonthlyFee,
      defaultGuestFee: input.defaultGuestFee,
      updatedBy: actorUserId,
    });
    await auditService.log({ actorUserId, action: 'config.valores_padrao.update', entityType: 'SystemConfig' });
    return config;
  },

  async updateTemporada(input: UpdateTemporadaInput, actorUserId: string) {
    const config = await systemConfigRepository.update({ currentSeason: input.currentSeason, updatedBy: actorUserId });
    await auditService.log({ actorUserId, action: 'config.temporada.update', entityType: 'SystemConfig' });
    return config;
  },

  async updatePix(input: UpdatePixConfigInput, actorUserId: string) {
    const config = await systemConfigRepository.update({ ...input, updatedBy: actorUserId });
    await auditService.log({ actorUserId, action: 'config.pix.update', entityType: 'SystemConfig' });
    return config;
  },
};
