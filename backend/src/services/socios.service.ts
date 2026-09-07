import { sociosRepository, socioStatusRepository } from '../repositories/socios.repository';
import { socioStatusService } from './socioStatus.service';
import { auditService } from './audit.service';
import { NotFoundError, ConflictError } from '../errors/domain-errors';
import { currentReferenceMonth, toReferenceMonth } from '../lib/date';
import type { CreateSocioInput, ListSociosQuery, UpdateSocioInput, UpdateSocioStatusInput } from '../schemas/socios.schemas';

export const sociosService = {
  async list(query: ListSociosQuery) {
    const where = {
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' as const } }
        : {}),
    };

    const skip = (query.page - 1) * query.pageSize;
    const [rawData, total] = await Promise.all([
      sociosRepository.findMany(where, skip, query.pageSize),
      sociosRepository.count(where),
    ]);

    const month = currentReferenceMonth();
    const data = await Promise.all(
      rawData.map(async (socio) => ({
        ...socio,
        currentStatus: await socioStatusService.getStatusForMonth(socio.id, month),
      }))
    );

    const filtered = query.status ? data.filter((s) => s.currentStatus === query.status) : data;

    return { data: filtered, total, page: query.page, pageSize: query.pageSize };
  },

  async getById(id: string, includeObservation: boolean) {
    const socio = await sociosRepository.findById(id);
    if (!socio) throw new NotFoundError('Sócio', id);

    const currentStatus = await socioStatusService.getStatusForMonth(id, currentReferenceMonth());
    const latestStatusRecord = await socioStatusRepository.findMostRecentUpTo(id, currentReferenceMonth());

    return {
      ...socio,
      currentStatus,
      observation: includeObservation ? latestStatusRecord?.observation ?? null : undefined,
    };
  },

  async create(input: CreateSocioInput) {
    if (input.email) {
      const existing = await sociosRepository.findByEmail(input.email);
      if (existing) throw new ConflictError('Já existe um sócio cadastrado com este e-mail.');
    }

    return sociosRepository.create({
      name: input.name,
      email: input.email,
      phone: input.phone,
      memberSince: input.memberSince,
      defaultPosition: input.defaultPosition,
    });
  },

  async update(id: string, input: UpdateSocioInput) {
    const socio = await sociosRepository.findById(id);
    if (!socio) throw new NotFoundError('Sócio', id);

    return sociosRepository.update(id, input);
  },

  async updateStatus(id: string, input: UpdateSocioStatusInput, actorUserId: string) {
    const socio = await sociosRepository.findById(id);
    if (!socio) throw new NotFoundError('Sócio', id);

    const referenceMonth = toReferenceMonth(input.referenceMonth);
    const observation = input.status === 'DM' ? input.observation : undefined;

    const record = await socioStatusRepository.upsert(id, referenceMonth, input.status, observation, actorUserId);

    await auditService.log({
      actorUserId,
      action: 'socio.status.update',
      entityType: 'Socio',
      entityId: id,
      metadata: { referenceMonth: referenceMonth.toISOString(), status: input.status },
    });

    return record;
  },

  async getStatusHistory(id: string, includeObservation: boolean) {
    const socio = await sociosRepository.findById(id);
    if (!socio) throw new NotFoundError('Sócio', id);

    const history = await socioStatusRepository.findHistory(id);
    return history.map((record) => ({
      ...record,
      observation: includeObservation ? record.observation : undefined,
    }));
  },
};
