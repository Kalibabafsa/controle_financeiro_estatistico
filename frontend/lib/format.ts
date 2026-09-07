// Helpers de formatação pt-BR — moeda e data. Mantidos puros para facilitar teste (QA).
export function formatBRL(value: number | string): string {
  const numeric = typeof value === 'string' ? Number(value) : value;
  return numeric.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDateBR(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export function formatMonthLabel(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  return `${months[date.getUTCMonth()]}/${date.getUTCFullYear()}`;
}

// Retorna o mês corrente no formato "YYYY-MM-01" (referenceMonth aceito pela API).
export function currentMonthInputValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}
