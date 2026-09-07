import crypto from 'node:crypto';
import { expensesRepository } from '../repositories/expenses.repository';
import { expenseCategoriesRepository } from '../repositories/expenseCategories.repository';
import { supabaseStorage } from '../lib/supabaseStorage';
import { balanceService } from './balance.service';
import { auditService } from './audit.service';
import { NotFoundError } from '../errors/domain-errors';
import { toReferenceMonth } from '../lib/date';
import { env } from '../lib/env';
import type { CreateDespesaInput } from '../schemas/financeiro.schemas';

interface AttachmentFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

export const despesasService = {
  async listByMonth(month: Date) {
    const referenceMonth = toReferenceMonth(month);
    const [expenses, total] = await Promise.all([
      expensesRepository.findByMonth(referenceMonth),
      expensesRepository.sumByMonth(referenceMonth),
    ]);
    return { data: expenses, total };
  },

  async create(input: CreateDespesaInput, actorUserId: string, attachment?: AttachmentFile) {
    const category = await expenseCategoriesRepository.findById(input.categoryId);
    if (!category) throw new NotFoundError('Categoria de despesa', input.categoryId);

    let attachmentPath: string | undefined;
    if (attachment) {
      const fileName = `${crypto.randomUUID()}-${attachment.originalname}`;
      attachmentPath = await supabaseStorage.upload(
        env.SUPABASE_STORAGE_BUCKET_COMPROVANTES,
        fileName,
        attachment.buffer,
        attachment.mimetype
      );
    }

    const expense = await expensesRepository.create({
      category: { connect: { id: input.categoryId } },
      weekStart: input.weekStart,
      weekEnd: input.weekEnd,
      amount: input.amount,
      description: input.description,
      attachmentPath,
      registeredBy: actorUserId,
    });

    await balanceService.recalculateFrom(toReferenceMonth(input.weekStart));

    await auditService.log({
      actorUserId,
      action: 'despesa.create',
      entityType: 'Expense',
      entityId: expense.id,
      metadata: { categoryId: input.categoryId, amount: input.amount },
    });

    return expense;
  },

  async getAttachmentSignedUrl(id: string) {
    const expense = await expensesRepository.findById(id);
    if (!expense) throw new NotFoundError('Despesa', id);
    if (!expense.attachmentPath) throw new NotFoundError('Anexo da despesa');

    return supabaseStorage.getSignedUrl(env.SUPABASE_STORAGE_BUCKET_COMPROVANTES, expense.attachmentPath);
  },
};
