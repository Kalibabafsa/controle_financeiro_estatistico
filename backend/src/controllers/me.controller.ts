import type { Request, Response } from 'express';
import { meService } from '../services/me.service';
import { updateMeuPerfilSchema } from '../schemas/me.schemas';
import { meMensalidadesQuerySchema } from '../schemas/financeiro.schemas';
import { mensalidadesService } from '../services/mensalidades.service';
import { ForbiddenError } from '../errors/domain-errors';

function requireSocioId(req: Request): string {
  if (!req.user?.socioId) {
    throw new ForbiddenError('Esta rota é exclusiva para usuários do tipo sócio.');
  }
  return req.user.socioId;
}

export const meController = {
  async getMe(req: Request, res: Response): Promise<void> {
    res.status(200).json(await meService.getMe(req.user!.sub));
  },

  async getPerfil(req: Request, res: Response): Promise<void> {
    res.status(200).json(await meService.getPerfil(requireSocioId(req)));
  },

  async updatePerfil(req: Request, res: Response): Promise<void> {
    const input = updateMeuPerfilSchema.parse(req.body);
    res.status(200).json(await meService.updatePerfil(requireSocioId(req), input, req.user!.sub));
  },

  async getMensalidades(req: Request, res: Response): Promise<void> {
    const query = meMensalidadesQuerySchema.parse(req.query);
    res.status(200).json(await mensalidadesService.meHistory(requireSocioId(req), query.year));
  },

  async getSituacao(req: Request, res: Response): Promise<void> {
    res.status(200).json(await meService.getSituacao(requireSocioId(req)));
  },

  async getProximoBaba(req: Request, res: Response): Promise<void> {
    res.status(200).json(await meService.getProximoBaba(requireSocioId(req)));
  },
};
