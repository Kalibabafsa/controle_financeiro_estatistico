import { z } from 'zod';

export const createSocioSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório.'),
  email: z.string().email('E-mail inválido.').optional(),
  phone: z.string().min(8).max(20).optional(),
  memberSince: z.coerce.date().optional(),
  defaultPosition: z.enum(['GOLEIRO', 'LINHA']).default('LINHA'),
});
export type CreateSocioInput = z.infer<typeof createSocioSchema>;

export const updateSocioSchema = createSocioSchema.partial();
export type UpdateSocioInput = z.infer<typeof updateSocioSchema>;

export const listSociosQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['A', 'DM', 'I']).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
export type ListSociosQuery = z.infer<typeof listSociosQuerySchema>;

export const updateSocioStatusSchema = z.object({
  referenceMonth: z.coerce.date(),
  status: z.enum(['A', 'DM', 'I']),
  observation: z.string().max(500).optional(),
});
export type UpdateSocioStatusInput = z.infer<typeof updateSocioStatusSchema>;
