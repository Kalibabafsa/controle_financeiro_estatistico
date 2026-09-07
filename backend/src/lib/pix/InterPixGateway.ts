import type { PixGateway, PixPayloadResult } from './PixGateway';
import { AppError } from '../../errors/AppError';

// Stub para integração futura com a API Pix do Banco Inter (ADR-05) — desativado
// até a associação confirmar viabilidade de conta PJ com API habilitada.
// Quando ativado: implementar cobrança dinâmica via API do Inter (client_id/secret/mTLS,
// nunca versionados) e validar assinatura do webhook antes de qualquer escrita.
export class InterPixGateway implements PixGateway {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async generatePayload(_amount: number, _referenceMonth?: Date): Promise<PixPayloadResult> {
    throw new AppError(
      'Integração automática com o Banco Inter ainda não está disponível.',
      501,
      'INTER_INTEGRATION_NOT_IMPLEMENTED'
    );
  }
}
