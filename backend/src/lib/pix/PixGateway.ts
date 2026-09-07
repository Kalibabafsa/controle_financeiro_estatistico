// Interface abstrata de gateway Pix — ver ADR-05 (docs/planning/architecture.md).
// A implementação ativa no MVP é ManualPixGateway; InterPixGateway fica pronta
// para plugar quando a integração com o Banco Inter for viabilizada.
export interface PixPayloadResult {
  emvPayload: string;
  pixKey: string;
}

export interface PixGateway {
  generatePayload(amount: number, referenceMonth?: Date): Promise<PixPayloadResult>;
}
