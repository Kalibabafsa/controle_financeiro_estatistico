import { z } from 'zod';

// :month sempre no formato "YYYY-MM" na URL (ex.: 2026-08).
export const monthParamSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Formato esperado: YYYY-MM'),
});

export function parseMonthParam(month: string): Date {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthNumber - 1, 1));
}

export const generatePrestacaoSchema = z.object({
  referenceMonth: z.coerce.date(),
});
