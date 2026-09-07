export interface PrestacaoContas {
  id: string;
  referenceMonth: string;
  pdfPath: string;
  generatedAt: string;
  snapshot: PrestacaoPreview;
}

export interface PrestacaoPreview {
  referenceMonth: string;
  socioRevenue: number;
  guestRevenue: number;
  otherRevenue: number;
  revenueTotal: number;
  expensesByCategory: Array<{ category: string; total: number }>;
  expenseTotal: number;
  monthBalance: number;
  cumulativeBalance: number;
}
