// Template HTML do PDF de Prestação de Contas — reusa a identidade sóbria do sistema
// (navy/teal, Poppins/Inter), NÃO a capa ilustrada do relatório físico antigo (ADR-06,
// decisão registrada em docs/design-system.md).
export interface PrestacaoContasSnapshot {
  referenceMonth: string; // "Agosto/2026"
  socioRevenue: string;
  guestRevenue: string;
  otherRevenue: string;
  revenueTotal: string;
  expensesByCategory: { category: string; total: string }[];
  expenseTotal: string;
  monthBalance: string;
  cumulativeBalance: string;
  generatedAt: string;
}

export function renderPrestacaoContasHtml(data: PrestacaoContasSnapshot): string {
  const expenseRows = data.expensesByCategory
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;">${item.category}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;text-align:right;">${item.total}</td>
        </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<style>
  body { font-family: 'Inter', Arial, sans-serif; color: #0A2540; margin: 0; padding: 32px; }
  h1 { font-family: 'Poppins', Arial, sans-serif; color: #0A2540; font-size: 20px; margin-bottom: 4px; }
  .subtitle { color: #64748B; font-size: 13px; margin-bottom: 24px; }
  .header { border-bottom: 3px solid #1AA79E; padding-bottom: 16px; margin-bottom: 24px; }
  .wordmark { font-family: 'Poppins', Arial, sans-serif; font-weight: 700; font-size: 14px; color: #1AA79E; letter-spacing: 1px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { text-align: left; background: #F8FAFC; font-size: 11px; text-transform: uppercase; color: #94A3B8; padding: 8px 12px; }
  .total-row td { font-weight: 700; border-top: 2px solid #0A2540; }
  .balance-card { background: linear-gradient(135deg, #0A2540, #1AA79E); color: white; border-radius: 16px; padding: 20px; margin-top: 24px; }
  .balance-label { font-size: 12px; opacity: 0.85; }
  .balance-value { font-family: 'Poppins', Arial, sans-serif; font-size: 28px; font-weight: 700; }
  .footer { margin-top: 32px; font-size: 10px; color: #94A3B8; }
</style>
</head>
<body>
  <div class="header">
    <div class="wordmark">KALI BABA</div>
    <h1>Prestação de Contas</h1>
    <div class="subtitle">Período de referência: ${data.referenceMonth} · Gerado em ${data.generatedAt}</div>
  </div>

  <table>
    <thead><tr><th>Receitas</th><th style="text-align:right;">Valor</th></tr></thead>
    <tbody>
      <tr><td style="padding:8px 12px;">Mensalidades de sócios</td><td style="padding:8px 12px;text-align:right;">${data.socioRevenue}</td></tr>
      <tr><td style="padding:8px 12px;">Convidados</td><td style="padding:8px 12px;text-align:right;">${data.guestRevenue}</td></tr>
      <tr><td style="padding:8px 12px;">Outras receitas</td><td style="padding:8px 12px;text-align:right;">${data.otherRevenue}</td></tr>
      <tr class="total-row"><td style="padding:8px 12px;">Total de receitas</td><td style="padding:8px 12px;text-align:right;">${data.revenueTotal}</td></tr>
    </tbody>
  </table>

  <table>
    <thead><tr><th>Despesas por categoria</th><th style="text-align:right;">Valor</th></tr></thead>
    <tbody>
      ${expenseRows}
      <tr class="total-row"><td style="padding:8px 12px;">Total de despesas</td><td style="padding:8px 12px;text-align:right;">${data.expenseTotal}</td></tr>
    </tbody>
  </table>

  <div class="balance-card">
    <div class="balance-label">Saldo do mês</div>
    <div class="balance-value">${data.monthBalance}</div>
    <div class="balance-label" style="margin-top:12px;">Saldo acumulado</div>
    <div class="balance-value">${data.cumulativeBalance}</div>
  </div>

  <div class="footer">Sistema Kalibaba — relatório gerado automaticamente, sem edição manual.</div>
</body>
</html>`;
}
