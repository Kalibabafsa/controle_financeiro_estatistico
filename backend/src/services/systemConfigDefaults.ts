import { systemConfigRepository } from '../repositories/systemConfig.repository';

// Valor padrão usado quando o Pix é solicitado sem `amount` explícito
// (ex.: tela "Pagar Mensalidade" antes de o sócio informar valor customizado).
export async function systemConfigDefaultAmount(): Promise<number> {
  const config = await systemConfigRepository.get();
  return Number(config.defaultMonthlyFee);
}
