// Helpers de data — todo "mês de referência" no domínio é normalizado para o
// dia 1 às 00:00 UTC, evitando bugs de fuso horário na comparação/unicidade.

export function toReferenceMonth(input: Date | string): Date {
  const date = typeof input === 'string' ? new Date(input) : input;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
}

export function addMonths(date: Date, months: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1, 0, 0, 0, 0));
}

export function currentReferenceMonth(): Date {
  return toReferenceMonth(new Date());
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth();
}
