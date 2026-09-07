import { z } from 'zod';

export const updateMeuPerfilSchema = z.object({
  phone: z.string().min(8).max(20).optional(),
  email: z.string().email('E-mail inválido.').optional(),
});
export type UpdateMeuPerfilInput = z.infer<typeof updateMeuPerfilSchema>;
