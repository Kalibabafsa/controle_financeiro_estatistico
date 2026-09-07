import { z } from 'zod';

export const socioFormSchema = z.object({
  name: z.string().min(2, 'Informe o nome completo.'),
  email: z.string().email('E-mail inválido.').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  memberSince: z.string().optional().or(z.literal('')),
  defaultPosition: z.enum(['GOLEIRO', 'LINHA']),
});
export type SocioFormValues = z.infer<typeof socioFormSchema>;

export const statusFormSchema = z.object({
  status: z.enum(['A', 'DM', 'I']),
  observation: z.string().max(500).optional(),
});
export type StatusFormValues = z.infer<typeof statusFormSchema>;
