import { babasRepository } from '../repositories/babas.repository';
import { ConflictError, NotFoundError } from '../errors/domain-errors';
import { auditService } from './audit.service';
import type { CreateBabaInput, UpdateBabaInput } from '../schemas/babas.schemas';

export const babasService = {
  async list(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([babasRepository.findMany(skip, pageSize), babasRepository.count()]);
    return { data, total, page, pageSize };
  },

  async getById(id: string) {
    const baba = await babasRepository.findById(id);
    if (!baba) throw new NotFoundError('Baba do dia', id);
    return baba;
  },

  async create(input: CreateBabaInput, actorUserId: string) {
    const existing = await babasRepository.findByDate(input.date);
    if (existing) throw new ConflictError('Já existe um baba registrado para esta data.');

    const baba = await babasRepository.create({
      date: input.date,
      time: input.time,
      location: input.location,
      createdBy: actorUserId,
    });

    await auditService.log({ actorUserId, action: 'baba.create', entityType: 'BabaDoDia', entityId: baba.id });
    return baba;
  },

  async update(id: string, input: UpdateBabaInput) {
    const baba = await babasRepository.findById(id);
    if (!baba) throw new NotFoundError('Baba do dia', id);
    return babasRepository.update(id, input);
  },
};
