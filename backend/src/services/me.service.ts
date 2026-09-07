import { usersRepository } from '../repositories/users.repository';
import { sociosRepository } from '../repositories/socios.repository';
import { socioPaymentsRepository } from '../repositories/socioPayments.repository';
import { socioStatusService } from './socioStatus.service';
import { babasRepository } from '../repositories/babas.repository';
import { suspensionService } from './suspension.service';
import { auditService } from './audit.service';
import { NotFoundError, ConflictError } from '../errors/domain-errors';
import { currentReferenceMonth } from '../lib/date';
import type { UpdateMeuPerfilInput } from '../schemas/me.schemas';

export const meService = {
  async getMe(userId: string) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new NotFoundError('Usuário', userId);

    return {
      id: user.id,
      role: user.role,
      socio: user.socio
        ? { id: user.socio.id, name: user.socio.name, email: user.socio.email, phone: user.socio.phone }
        : null,
    };
  },

  async getPerfil(socioId: string) {
    const socio = await sociosRepository.findById(socioId);
    if (!socio) throw new NotFoundError('Sócio', socioId);
    const currentStatus = await socioStatusService.getStatusForMonth(socioId, currentReferenceMonth());
    return { ...socio, currentStatus };
  },

  async updatePerfil(socioId: string, input: UpdateMeuPerfilInput, actorUserId: string) {
    const socio = await sociosRepository.findById(socioId);
    if (!socio) throw new NotFoundError('Sócio', socioId);

    if (input.email) {
      const existing = await sociosRepository.findByEmail(input.email);
      if (existing && existing.id !== socioId) {
        throw new ConflictError('Já existe um sócio cadastrado com este e-mail.');
      }
    }

    const updated = await sociosRepository.update(socioId, { phone: input.phone, email: input.email });

    await auditService.log({ actorUserId, action: 'perfil.update', entityType: 'Socio', entityId: socioId });

    return updated;
  },

  async getSituacao(socioId: string) {
    const referenceMonth = currentReferenceMonth();
    const [status, payment] = await Promise.all([
      socioStatusService.getStatusForMonth(socioId, referenceMonth),
      socioPaymentsRepository.findBySocioAndMonth(socioId, referenceMonth),
    ]);

    // DM não é cobrado por padrão (RF6) — não aparece como inadimplente mesmo sem lançamento.
    const emDia = status !== 'A' || Boolean(payment);

    return {
      referenceMonth,
      status,
      emDia,
      payment: payment ?? null,
    };
  },

  async getProximoBaba(socioId: string) {
    const proximoBaba = await babasRepository.findNextFrom(new Date());
    if (!proximoBaba) {
      return { proximoBaba: null, apto: true };
    }

    const suspenso = await suspensionService.isSuspended({ socioId }, proximoBaba.date);

    return { proximoBaba, apto: !suspenso };
  },
};
