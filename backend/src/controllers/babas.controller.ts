import type { Request, Response } from 'express';
import { babasService } from '../services/babas.service';
import { presencaService } from '../services/presenca.service';
import { sorteioService } from '../services/sorteio.service';
import { gameEventsService } from '../services/gameEvents.service';
import {
  createBabaSchema,
  createGameEventSchema,
  listBabasQuerySchema,
  setPresencaSchema,
  setTimesSchema,
  updateBabaSchema,
} from '../schemas/babas.schemas';

interface SafeParticipant {
  id: string;
  name: string;
}

interface RawParticipantLike {
  id?: unknown;
  name?: unknown;
  email?: unknown;
  phone?: unknown;
}

function toSafeParticipant(raw: RawParticipantLike | null | undefined): SafeParticipant | null {
  if (!raw) return null;
  return { id: String(raw.id ?? ''), name: String(raw.name ?? '') };
}

// Defesa em profundidade (security-report.md A1): mesmo que o repository/service devolva
// um dia um objeto com email/telefone (over-fetch por engano), a resposta ao cliente de
// GET /babas/:id/eventos — rota aberta a qualquer sócio autenticado, não só ao diretor —
// nunca deve incluir esses campos. Serializer explícito, não depende de "lembrar" de
// selecionar os campos certos em toda a cadeia.
function sanitizeEventoParaResposta(event: Record<string, unknown>): Record<string, unknown> {
  const presenca = event.presenca as Record<string, unknown> | undefined;
  if (!presenca) return event;

  return {
    ...event,
    presenca: {
      ...presenca,
      socio: toSafeParticipant(presenca.socio as RawParticipantLike | null),
      convidado: toSafeParticipant(presenca.convidado as RawParticipantLike | null),
    },
  };
}

export const babasController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = listBabasQuerySchema.parse(req.query);
    res.status(200).json(await babasService.list(query.page, query.pageSize));
  },

  async getById(req: Request, res: Response): Promise<void> {
    res.status(200).json(await babasService.getById(req.params.id));
  },

  async create(req: Request, res: Response): Promise<void> {
    const input = createBabaSchema.parse(req.body);
    res.status(201).json(await babasService.create(input, req.user!.sub));
  },

  async update(req: Request, res: Response): Promise<void> {
    const input = updateBabaSchema.parse(req.body);
    res.status(200).json(await babasService.update(req.params.id, input));
  },

  async setPresenca(req: Request, res: Response): Promise<void> {
    const input = setPresencaSchema.parse(req.body);
    res.status(200).json(await presencaService.setPresenca(req.params.id, input, req.user!.sub));
  },

  async sortear(req: Request, res: Response): Promise<void> {
    res.status(200).json(await sorteioService.sortear(req.params.id));
  },

  async setTimes(req: Request, res: Response): Promise<void> {
    const input = setTimesSchema.parse(req.body);
    res.status(200).json(await sorteioService.saveManual(req.params.id, input));
  },

  async listEventos(req: Request, res: Response): Promise<void> {
    const events = await gameEventsService.findByBabaId(req.params.id);
    res.status(200).json(events.map((event) => sanitizeEventoParaResposta(event as Record<string, unknown>)));
  },

  async createEvento(req: Request, res: Response): Promise<void> {
    const input = createGameEventSchema.parse(req.body);
    res.status(201).json(await gameEventsService.create(req.params.id, input, req.user!.sub));
  },
};
