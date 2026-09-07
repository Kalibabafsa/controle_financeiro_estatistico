import { prisma } from '../lib/prisma';
import type { Prisma } from '@prisma/client';

export const suspensionsRepository = {
  create(data: Prisma.SuspensionCreateInput) {
    return prisma.suspension.create({ data });
  },

  findByOriginEventId(originEventId: string) {
    return prisma.suspension.findUnique({ where: { originEventId } });
  },

  deleteByOriginEventId(originEventId: string) {
    return prisma.suspension.deleteMany({ where: { originEventId } });
  },

  findActiveForParticipant(babaDoDiaId: string, socioId?: string, convidadoId?: string) {
    return prisma.suspension.findFirst({
      where: {
        liftedAt: null,
        socioId: socioId ?? undefined,
        convidadoId: convidadoId ?? undefined,
        originEvent: { babaDoDiaId },
      },
    });
  },

  findAllActive() {
    return prisma.suspension.findMany({
      where: { liftedAt: null },
      include: {
        socio: { select: { id: true, name: true } },
        convidado: { select: { id: true, name: true } },
        originEvent: { include: { babaDoDia: true } },
      },
      orderBy: { effectiveDate: 'desc' },
    });
  },

  findAll() {
    return prisma.suspension.findMany({
      include: {
        socio: { select: { id: true, name: true } },
        convidado: { select: { id: true, name: true } },
        originEvent: { include: { babaDoDia: true } },
      },
      orderBy: { effectiveDate: 'desc' },
    });
  },

  findById(id: string) {
    return prisma.suspension.findUnique({ where: { id } });
  },

  lift(id: string, liftedBy: string, liftReason?: string) {
    return prisma.suspension.update({
      where: { id },
      data: { liftedAt: new Date(), liftedBy, liftReason },
    });
  },
};
