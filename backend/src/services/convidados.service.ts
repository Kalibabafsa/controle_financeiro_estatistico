import { convidadosRepository } from '../repositories/convidados.repository';
import { auditService } from './audit.service';
import { NotFoundError } from '../errors/domain-errors';
import type { CreateConvidadoInput, ListConvidadosQuery, UpdateConvidadoInput } from '../schemas/convidados.schemas';

export const convidadosService = {
  async list(query: ListConvidadosQuery) {
    const where = query.search ? { name: { contains: query.search, mode: 'insensitive' as const } } : {};
    const skip = (query.page - 1) * query.pageSize;

    const [data, total] = await Promise.all([
      convidadosRepository.findMany(where, skip, query.pageSize),
      convidadosRepository.count(where),
    ]);

    return { data, total, page: query.page, pageSize: query.pageSize };
  },

  async getById(id: string) {
    const convidado = await convidadosRepository.findById(id);
    if (!convidado) throw new NotFoundError('Convidado', id);
    return convidado;
  },

  create(input: CreateConvidadoInput) {
    return convidadosRepository.create({
      name: input.name,
      phone: input.phone,
      invitedBy: input.invitedById ? { connect: { id: input.invitedById } } : undefined,
    });
  },

  async update(id: string, input: UpdateConvidadoInput) {
    const convidado = await convidadosRepository.findById(id);
    if (!convidado) throw new NotFoundError('Convidado', id);

    return convidadosRepository.update(id, {
      name: input.name,
      phone: input.phone,
      invitedBy: input.invitedById ? { connect: { id: input.invitedById } } : undefined,
    });
  },

  async removeContact(id: string, actorUserId: string) {
    const convidado = await convidadosRepository.findById(id);
    if (!convidado) throw new NotFoundError('Convidado', id);

    await convidadosRepository.anonymizeContact(id);

    // RSP6/RSP7 — LGPD: preserva o vínculo financeiro (pagamentos), anonimiza apenas contato.
    await auditService.log({
      actorUserId,
      action: 'convidado.contato.remover',
      entityType: 'Convidado',
      entityId: id,
    });
  },
};
