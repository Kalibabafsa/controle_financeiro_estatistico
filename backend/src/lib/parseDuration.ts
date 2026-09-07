// Parser simples de duração no formato usado pelo jsonwebtoken ("15m", "7d", "1h").
// Evita depender de uma lib externa só para converter para milissegundos (uso no maxAge do cookie).
const UNIT_TO_MS: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

export function parseDurationToMs(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim());
  if (!match) {
    return 7 * UNIT_TO_MS.d; // fallback seguro: 7 dias
  }
  const [, amount, unit] = match;
  return Number(amount) * UNIT_TO_MS[unit];
}
