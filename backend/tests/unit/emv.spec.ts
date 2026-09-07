import { describe, expect, it } from 'vitest';
import { buildEmvPayload } from '../../src/lib/pix/emv';

// Oracle independente do CRC16/CCITT-FALSE (poly 0x1021, init 0xFFFF, sem xorout),
// conforme manual de padrões do Pix do Bacen — implementado de novo aqui (não importado
// do código de produção) para servir de verificação cruzada real, não uma tautologia.
function referenceCrc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

describe('buildEmvPayload (BR Code / Pix EMV)', () => {
  const baseInput = {
    pixKey: 'associacao-kalibaba@pix.com',
    beneficiaryName: 'Associacao Kalibaba',
    city: 'Sao Paulo',
  };

  it('inicia com o Payload Format Indicator (00) e Point of Initiation (01=11, estático)', () => {
    const payload = buildEmvPayload(baseInput);
    expect(payload.startsWith('000201')).toBe(true);
    expect(payload).toContain('010211');
  });

  it('inclui a chave Pix e o GUI do BCB dentro do Merchant Account Information (campo 26)', () => {
    const payload = buildEmvPayload(baseInput);
    expect(payload).toContain('br.gov.bcb.pix');
    expect(payload).toContain(baseInput.pixKey);
  });

  it('omite o campo de valor (54) quando amount não é informado (payload estático sem valor)', () => {
    const payload = buildEmvPayload(baseInput);
    // Campo 54 (valor) não deve aparecer como tag isolada no payload.
    expect(/54\d{2}\d+\.\d{2}/.test(payload)).toBe(false);
  });

  it('inclui o campo de valor (54) formatado com 2 casas decimais quando amount é informado', () => {
    const payload = buildEmvPayload({ ...baseInput, amount: 110 });
    expect(payload).toContain('5406110.00');
  });

  it('formata corretamente valores com centavos', () => {
    const payload = buildEmvPayload({ ...baseInput, amount: 30.5 });
    expect(payload).toContain('540530.50');
  });

  it('normaliza nome do beneficiário e cidade (maiúsculas, sem acento, truncado a 25 chars)', () => {
    const payload = buildEmvPayload({
      ...baseInput,
      beneficiaryName: 'associação kalíbaba futebol clube muito longo mesmo',
      city: 'São Paulo',
    });
    expect(payload).toContain('ASSOCIACAO KALIBABA FUTE'); // 25 chars, sem acento
    expect(payload).not.toMatch(/[ÁÃÇÉÍÓÚ]/);
    expect(payload).toContain('SAO PAULO');
  });

  it('inclui descrição (campo 02 dentro do merchant account info) só quando informada, normalizada como o resto do payload', () => {
    const withDescription = buildEmvPayload({ ...baseInput, description: 'Mensalidade agosto' });
    const withoutDescription = buildEmvPayload(baseInput);
    expect(withDescription).toContain('MENSALIDADE AGOSTO');
    expect(withoutDescription).not.toContain('MENSALIDADE');
  });

  // BUG encontrado pelo QA (não bloqueante, ver docs/planning/qa-report.md): a função `normalize()`
  // de emv.ts é reaproveitada tanto para o nome do beneficiário/cidade (campos 59/60, limite real
  // de 25 chars no BR Code) quanto para a descrição (campo 02, dentro do 26) — mas o campo de
  // descrição não tem esse limite de 25 no manual do Bacen. Para descrições de mensalidade com ano
  // de 4 dígitos ("Mensalidade Kalibaba 8/2026", 27 chars), os 2 últimos dígitos do ano são cortados
  // silenciosamente, o sócio veria "8/20" em vez de "8/2026" no app do banco ao pagar. Este teste
  // documenta o comportamento correto esperado e falha hoje, reproduzindo o bug.
  it('[BUG conhecido] não deveria truncar a descrição de mensalidade em 25 caracteres, perdendo o ano completo', () => {
    const payload = buildEmvPayload({ ...baseInput, description: 'Mensalidade Kalibaba 8/2026' });
    expect(payload).toContain('MENSALIDADE KALIBABA 8/2026');
  });

  it('usa txId padrão "***" (payload genérico, não específico de uma cobrança) quando não informado', () => {
    const payload = buildEmvPayload(baseInput);
    expect(payload).toContain('0503***');
  });

  it('termina com o campo 63 (CRC16) cujo valor bate com um cálculo independente de CRC16-CCITT', () => {
    const payload = buildEmvPayload(baseInput);
    expect(payload.endsWith('6304' + payload.slice(-4))).toBe(true);

    const withoutCrcValue = payload.slice(0, -4);
    const declaredCrc = payload.slice(-4);
    const expectedCrc = referenceCrc16(withoutCrcValue);

    expect(declaredCrc).toBe(expectedCrc);
  });

  it('produz payloads diferentes para valores diferentes (não é uma string estática fixa)', () => {
    const p1 = buildEmvPayload({ ...baseInput, amount: 110 });
    const p2 = buildEmvPayload({ ...baseInput, amount: 30 });
    expect(p1).not.toBe(p2);
  });
});
