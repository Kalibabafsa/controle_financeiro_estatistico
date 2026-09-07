import { z } from 'zod';

export const createConvidadoSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório.'),
  phone: z.string().min(8).max(20).optional(),
  invitedById: z.string().uuid().optional(),
});
export type CreateConvidadoInput = z.infer<typeof createConvidadoSchema>;

export const updateConvidadoSchema = createConvidadoSchema.partial();
export type UpdateConvidadoInput = z.infer<typeof updateConvidadoSchema>;

export const listConvidadosQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
export type ListConvidadosQuery = z.infer<typeof listConvidadosQuerySchema>;
