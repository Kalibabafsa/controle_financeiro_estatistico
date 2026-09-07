export function formatBRL(value: number | string): string {
  const numeric = typeof value === 'string' ? Number(value) : value;
  return numeric.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatMonthLabel(date: Date): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  return `${months[date.getUTCMonth()]}/${date.getUTCFullYear()}`;
}
