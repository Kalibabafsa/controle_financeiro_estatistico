import { z } from 'zod';

export const createMensalidadeSchema = z.object({
  socioId: z.string().uuid(),
  referenceMonth: z.coerce.date(),
  amount: z.coerce.number().positive('Valor deve ser positivo.').optional(),
  paymentMethod: z.enum(['PIX', 'DIN']),
  paidAt: z.coerce.date(),
});
export type CreateMensalidadeInput = z.infer<typeof createMensalidadeSchema>;

export const listMensalidadesQuerySchema = z.object({
  socioId: z.string().uuid().optional(),
  month: z.coerce.date().optional(),
});
export type ListMensalidadesQuery = z.infer<typeof listMensalidadesQuerySchema>;

export const meMensalidadesQuerySchema = z.object({
  year: z.coerce.number().int().optional(),
});

export const createPagamentoConvidadoSchema = z.object({
  convidadoId: z.string().uuid(),
  babaDoDiaId: z.string().uuid().optional(),
  matchDate: z.coerce.date(),
  amount: z.coerce.number().positive('Valor deve ser positivo.').optional(),
  paymentMethod: z.enum(['PIX', 'DIN']),
  paidAt: z.coerce.date(),
});
export type CreatePagamentoConvidadoInput = z.infer<typeof createPagamentoConvidadoSchema>;

export const listPagamentosConvidadosQuerySchema = z.object({
  convidadoId: z.string().uuid().optional(),
  month: z.coerce.date().optional(),
});
export type ListPagamentosConvidadosQuery = z.infer<typeof listPagamentosConvidadosQuerySchema>;

export const monthQuerySchema = z.object({
  month: z.coerce.date().optional(),
});

export const createDespesaSchema = z.object({
  categoryId: z.string().uuid(),
  weekStart: z.coerce.date(),
  weekEnd: z.coerce.date(),
  amount: z.coerce.number().positive('Valor deve ser positivo.'),
  description: z.string().max(500).optional(),
});
export type CreateDespesaInput = z.infer<typeof createDespesaSchema>;

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Nome obrigatório.'),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z.object({
  name: z.string().min(2).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export const createOtherRevenueSchema = z.object({
  categoryId: z.string().uuid(),
  referenceMonth: z.coerce.date(),
  amount: z.coerce.number().positive('Valor deve ser positivo.'),
  description: z.string().max(500).optional(),
});
export type CreateOtherRevenueInput = z.infer<typeof createOtherRevenueSchema>;
