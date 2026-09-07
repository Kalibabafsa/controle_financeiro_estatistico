import { auditLogRepository } from '../repositories/auditLog.repository';

interface AuditInput {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

// RNF5/RSP9 — toda escrita relevante (financeira, status, futebol) registra quem/quando/o quê,
// com dado mínimo (nunca duplica PII no metadata).
export const auditService = {
  async log(input: AuditInput): Promise<void> {
    await auditLogRepository.create({
      actorUserId: input.actorUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata as never,
    });
  },
};
