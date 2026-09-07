// Monta o payload BR Code / EMV estático do Pix a partir dos dados cadastrais
// da associação (chave, beneficiário, cidade) — sem chamar serviço de terceiros.
// Referência: manual de padrões Pix do Bacen (BR Code EMV QRCPS-MPM).
function tlv(id: string, value: string): string {
  const length = value.length.toString().padStart(2, '0');
  return `${id}${length}${value}`;
}

function crc16ccitt(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Limite real do manual de padrões Pix do Bacen para Merchant Name (tag 59): 25 caracteres.
// Reaproveitada também para Merchant City (tag 60) — o dev original assumiu o mesmo limite
// para simplificar; não é o achado reportado pelo QA (não mexer aqui sem necessidade).
const MERCHANT_FIELD_MAX_LENGTH = 25;

// TLV genérico (id de 2 dígitos + tamanho de 2 dígitos) suporta até 99 caracteres de valor —
// não há limite de 25 no manual do Bacen para o campo de descrição (02, dentro do Merchant
// Account Information template, campo 26). Bug reportado pelo QA (docs/planning/qa-report.md
// #4): reaproveitar `normalize()` (pensada para nome/cidade) também para a descrição truncava
// silenciosamente "Mensalidade Kalibaba 8/2026" em "MENSALIDADE KALIBABA 8/20", perdendo os
// últimos dígitos do ano.
const TLV_VALUE_MAX_LENGTH = 99;

function stripAccentsAndUppercase(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase();
}

function normalize(text: string): string {
  return stripAccentsAndUppercase(text).slice(0, MERCHANT_FIELD_MAX_LENGTH);
}

function normalizeDescription(text: string): string {
  return stripAccentsAndUppercase(text).slice(0, TLV_VALUE_MAX_LENGTH);
}

export interface EmvInput {
  pixKey: string;
  beneficiaryName: string;
  city: string;
  amount?: number;
  description?: string;
  txId?: string;
}

export function buildEmvPayload(input: EmvInput): string {
  const merchantAccountInfo = tlv('00', 'br.gov.bcb.pix') + tlv('01', input.pixKey) +
    (input.description ? tlv('02', normalizeDescription(input.description)) : '');

  const amountStr = input.amount !== undefined ? input.amount.toFixed(2) : undefined;

  const additionalData = tlv('05', input.txId ?? '***');

  const withoutCrc =
    tlv('00', '01') +
    tlv('01', '11') + // "11" = payload estático (chave fixa, sem valor dinâmico único)
    tlv('26', merchantAccountInfo) +
    tlv('52', '0000') +
    tlv('53', '986') + // BRL
    (amountStr ? tlv('54', amountStr) : '') +
    tlv('58', 'BR') +
    tlv('59', normalize(input.beneficiaryName)) +
    tlv('60', normalize(input.city)) +
    tlv('62', additionalData) +
    '6304';

  return withoutCrc + crc16ccitt(withoutCrc);
}
