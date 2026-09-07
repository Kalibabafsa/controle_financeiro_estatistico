import { z } from 'zod';

export const createBabaSchema = z.object({
  date: z.coerce.date(),
  time: z.string().max(10).optional(),
  location: z.string().max(200).optional(),
});
export type CreateBabaInput = z.infer<typeof createBabaSchema>;

export const updateBabaSchema = z.object({
  time: z.string().max(10).optional(),
  location: z.string().max(200).optional(),
});
export type UpdateBabaInput = z.infer<typeof updateBabaSchema>;

export const listBabasQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

const participantSchema = z.object({
  type: z.enum(['SOCIO', 'CONVIDADO']),
  socioId: z.string().uuid().optional(),
  convidadoId: z.string().uuid().optional(),
  position: z.enum(['GOLEIRO', 'LINHA']),
});

export const setPresencaSchema = z.object({
  participants: z.array(participantSchema).min(1),
});
export type SetPresencaInput = z.infer<typeof setPresencaSchema>;

export const setTimesSchema = z.object({
  teams: z
    .array(
      z.object({
        number: z.number().int().min(1).max(4),
        presencaIds: z.array(z.string().uuid()),
      })
    )
    .min(1)
    .max(4),
});
export type SetTimesInput = z.infer<typeof setTimesSchema>;

export const createGameEventSchema = z.object({
  presencaId: z.string().uuid(),
  teamId: z.string().uuid().optional(),
  type: z.enum(['GOL', 'CARTAO_AMARELO', 'CARTAO_AZUL', 'CARTAO_VERMELHO']),
});
export type CreateGameEventInput = z.infer<typeof createGameEventSchema>;

export const liberarSuspensaoSchema = z.object({
  reason: z.string().max(300).optional(),
});
export type LiberarSuspensaoInput = z.infer<typeof liberarSuspensaoSchema>;

export const rankingsQuerySchema = z.object({
  season: z.coerce.number().int().default(new Date().getFullYear()),
  type: z.enum(['artilheiros', 'cartoes', 'presenca']).default('artilheiros'),
});
export type RankingsQuery = z.infer<typeof rankingsQuerySchema>;
