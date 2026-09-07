import { ManualPixGateway } from '../lib/pix/ManualPixGateway';
import { InterPixGateway } from '../lib/pix/InterPixGateway';
import { systemConfigRepository } from '../repositories/systemConfig.repository';
import type { PixGateway } from '../lib/pix/PixGateway';
import { env } from '../lib/env';
import { systemConfigDefaultAmount } from './systemConfigDefaults';

const manualGateway = new ManualPixGateway();
const interGateway = new InterPixGateway();

async function resolveGateway(): Promise<PixGateway> {
  const config = await systemConfigRepository.get();
  // ADR-05 — troca de implementação só aqui; nenhuma mudança de controller/schema necessária.
  if (env.PIX_INTEGRATION_MODE === 'inter' && config.interIntegrationEnabled) {
    return interGateway;
  }
  return manualGateway;
}

export const pixService = {
  async getPayload(amount?: number, referenceMonth?: Date) {
    const gateway = await resolveGateway();
    const resolvedAmount = amount ?? (await systemConfigDefaultAmount());
    return gateway.generatePayload(resolvedAmount, referenceMonth);
  },
};
