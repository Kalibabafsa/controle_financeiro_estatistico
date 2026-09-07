import { z } from 'zod';

export const updateValoresPadraoSchema = z.object({
  defaultMonthlyFee: z.coerce.number().positive(),
  defaultGuestFee: z.coerce.number().positive(),
});
export type UpdateValoresPadraoInput = z.infer<typeof updateValoresPadraoSchema>;

export const updateTemporadaSchema = z.object({
  currentSeason: z.coerce.number().int().min(2000).max(2100),
});
export type UpdateTemporadaInput = z.infer<typeof updateTemporadaSchema>;

export const updatePixConfigSchema = z.object({
  pixKey: z.string().min(1),
  pixBeneficiaryName: z.string().min(1),
  pixBankName: z.string().min(1),
  pixCity: z.string().min(1),
});
export type UpdatePixConfigInput = z.infer<typeof updatePixConfigSchema>;

export const pixPayloadQuerySchema = z.object({
  amount: z.coerce.number().positive().optional(),
  referenceMonth: z.coerce.date().optional(),
});
