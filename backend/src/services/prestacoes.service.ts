import { prestacoesRepository } from '../repositories/prestacoes.repository';
import { socioPaymentsRepository } from '../repositories/socioPayments.repository';
import { guestPaymentsRepository } from '../repositories/guestPayments.repository';
import { otherRevenuesRepository } from '../repositories/revenueCategories.repository';
import { expensesRepository } from '../repositories/expenses.repository';
import { monthlyClosingBalanceRepository } from '../repositories/monthlyClosingBalance.repository';
import { supabaseStorage } from '../lib/supabaseStorage';
import { renderPrestacaoContasHtml } from '../lib/pdf/prestacaoContasTemplate';
import { generatePdfFromHtml } from '../lib/pdf/generatePdf';
import { formatBRL, formatMonthLabel } from '../lib/format';
import { auditService } from './audit.service';
import { ConflictError, NotFoundError } from '../errors/domain-errors';
import { toReferenceMonth } from '../lib/date';
import { env } from '../lib/env';

async function buildSnapshot(referenceMonth: Date) {
  const [socioRevenue, guestRevenue, otherRevenue, expenses, closing] = await Promise.all([
    socioPaymentsRepository.sumByMonth(referenceMonth),
    guestPaymentsRepository.sumByMonth(referenceMonth),
    otherRevenuesRepository.sumByMonth(referenceMonth),
    expensesRepository.findByMonth(referenceMonth),
    monthlyClosingBalanceRepository.findByMonth(referenceMonth),
  ]);

  const expensesByCategoryMap = new Map<string, number>();
  for (const expense of expenses) {
    const current = expensesByCategoryMap.get(expense.category.name) ?? 0;
    expensesByCategoryMap.set(expense.category.name, current + Number(expense.amount));
  }
  const expensesByCategory = Array.from(expensesByCategoryMap.entries()).map(([category, total]) => ({
    category,
    total,
  }));

  const revenueTotal = Number(socioRevenue) + Number(guestRevenue) + Number(otherRevenue);
  const expenseTotal = expensesByCategory.reduce((sum, item) => sum + item.total, 0);
  const monthBalance = closing ? Number(closing.monthBalance) : revenueTotal - expenseTotal;
  const cumulativeBalance = closing ? Number(closing.cumulativeBalance) : monthBalance;

  return {
    referenceMonth,
    socioRevenue: Number(socioRevenue),
    guestRevenue: Number(guestRevenue),
    otherRevenue: Number(otherRevenue),
    revenueTotal,
    expensesByCategory,
    expenseTotal,
    monthBalance,
    cumulativeBalance,
  };
}

export const prestacoesService = {
  list() {
    return prestacoesRepository.findAll();
  },

  async preview(month: Date) {
    return buildSnapshot(toReferenceMonth(month));
  },

  async generate(month: Date, actorUserId: string) {
    const referenceMonth = toReferenceMonth(month);

    const existing = await prestacoesRepository.findByMonth(referenceMonth);
    if (existing) {
      throw new ConflictError('A prestação de contas deste mês já foi gerada.');
    }

    const snapshot = await buildSnapshot(referenceMonth);

    const html = renderPrestacaoContasHtml({
      referenceMonth: formatMonthLabel(referenceMonth),
      socioRevenue: formatBRL(snapshot.socioRevenue),
      guestRevenue: formatBRL(snapshot.guestRevenue),
      otherRevenue: formatBRL(snapshot.otherRevenue),
      revenueTotal: formatBRL(snapshot.revenueTotal),
      expensesByCategory: snapshot.expensesByCategory.map((item) => ({
        category: item.category,
        total: formatBRL(item.total),
      })),
      expenseTotal: formatBRL(snapshot.expenseTotal),
      monthBalance: formatBRL(snapshot.monthBalance),
      cumulativeBalance: formatBRL(snapshot.cumulativeBalance),
      generatedAt: new Date().toLocaleDateString('pt-BR'),
    });

    const pdfBuffer = await generatePdfFromHtml(html);
    const pdfPath = `prestacao-${referenceMonth.getUTCFullYear()}-${String(referenceMonth.getUTCMonth() + 1).padStart(2, '0')}.pdf`;

    await supabaseStorage.upload(env.SUPABASE_STORAGE_BUCKET_RELATORIOS, pdfPath, pdfBuffer, 'application/pdf');

    const report = await prestacoesRepository.create({
      referenceMonth,
      pdfPath,
      snapshot: snapshot as never,
      generatedBy: actorUserId,
    });

    await auditService.log({
      actorUserId,
      action: 'prestacao_contas.generate',
      entityType: 'AccountabilityReport',
      entityId: report.id,
      metadata: { referenceMonth: referenceMonth.toISOString() },
    });

    return report;
  },

  async getPdfUrl(month: Date) {
    const referenceMonth = toReferenceMonth(month);
    const report = await prestacoesRepository.findByMonth(referenceMonth);
    if (!report) throw new NotFoundError('Prestação de contas deste mês');

    return supabaseStorage.getSignedUrl(env.SUPABASE_STORAGE_BUCKET_RELATORIOS, report.pdfPath);
  },
};
