import { sociosRepository } from '../repositories/socios.repository';
import { socioPaymentsRepository } from '../repositories/socioPayments.repository';
import { socioStatusService } from './socioStatus.service';
import { systemConfigRepository } from '../repositories/systemConfig.repository';
import { toReferenceMonth } from '../lib/date';

// RF12/RNF8 — inadimplência nunca é campo booleano: é sempre derivada da ausência
// de lançamento de pagamento no mês, cruzada com o status mensal (DM não é cobrado por padrão).
async function resolveMonthSituation(month: Date) {
  const referenceMonth = toReferenceMonth(month);
  const [socios, payments] = await Promise.all([
    sociosRepository.findAllActiveIds(),
    socioPaymentsRepository.findByMonth(referenceMonth),
  ]);

  const paidSocioIds = new Set(payments.map((p) => p.socioId));

  const situations = await Promise.all(
    socios.map(async (socio) => ({
      socio,
      status: await socioStatusService.getStatusForMonth(socio.id, referenceMonth),
      hasPayment: paidSocioIds.has(socio.id),
    }))
  );

  return { referenceMonth, situations };
}

function diasEmAberto(referenceMonth: Date): number {
  const diffMs = Date.now() - referenceMonth.getTime();
  return Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)));
}

export const inadimplenciaService = {
  // GET /inadimplencia (exclusiva do DIRETOR) — retorna telefone, valor devido (valor padrão
  // de mensalidade configurado) e dias em aberto, além de id/name, para a tela "Gestão de
  // Inadimplência" (fidelidade ao protótipo, code-review.md 🟡 #7). Como a rota é restrita ao
  // diretor — que já enxerga telefone/valor de qualquer sócio por outras rotas —, isso não é
  // uma quebra de RSP3 (dado financeiro pessoal continua restrito ao próprio sócio e ao diretor).
  async getInadimplentes(month: Date) {
    const [{ referenceMonth, situations }, config] = await Promise.all([
      resolveMonthSituation(month),
      systemConfigRepository.get(),
    ]);

    const dias = diasEmAberto(referenceMonth);
    const amount = Number(config.defaultMonthlyFee);

    return situations
      .filter((s) => s.status === 'A' && !s.hasPayment)
      .map((s) => ({
        id: s.socio.id,
        name: s.socio.name,
        phone: s.socio.phone ?? null,
        amount,
        diasEmAberto: dias,
      }));
  },

  async getResumo(month: Date) {
    const { situations } = await resolveMonthSituation(month);
    const ativos = situations.filter((s) => s.status !== 'I');
    const cobraveis = situations.filter((s) => s.status === 'A');
    const inadimplentes = cobraveis.filter((s) => !s.hasPayment);

    return {
      sociosAtivos: ativos.length,
      sociosCobraveis: cobraveis.length,
      inadimplentesCount: inadimplentes.length,
      percentualInadimplencia: cobraveis.length > 0 ? inadimplentes.length / cobraveis.length : 0,
    };
  },
};
