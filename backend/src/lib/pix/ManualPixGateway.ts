import type { PixGateway, PixPayloadResult } from './PixGateway';
import { buildEmvPayload } from './emv';
import { systemConfigRepository } from '../../repositories/systemConfig.repository';
import { AppError } from '../../errors/AppError';

// Implementação ativa no MVP (ADR-05): monta o payload EMV estático a partir do SystemConfig,
// sem chamar API de terceiros. A confirmação do pagamento continua sempre manual (RF24).
export class ManualPixGateway implements PixGateway {
  async generatePayload(amount: number, referenceMonth?: Date): Promise<PixPayloadResult> {
    const config = await systemConfigRepository.get();

    if (!config.pixKey || !config.pixBeneficiaryName || !config.pixCity) {
      throw new AppError('Dados do Pix da associação ainda não configurados.', 409, 'PIX_NOT_CONFIGURED');
    }

    const emvPayload = buildEmvPayload({
      pixKey: config.pixKey,
      beneficiaryName: config.pixBeneficiaryName,
      city: config.pixCity,
      amount,
      description: referenceMonth ? `Mensalidade Kalibaba ${referenceMonth.getUTCMonth() + 1}/${referenceMonth.getUTCFullYear()}` : undefined,
    });

    return { emvPayload, pixKey: config.pixKey };
  }
}
