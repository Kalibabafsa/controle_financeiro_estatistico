export interface SocioPayment {
  id: string;
  socioId: string;
  referenceMonth: string;
  amount: string;
  paymentMethod: 'PIX' | 'DIN';
  paidAt: string;
  createdAt: string;
  socio?: { id: string; name: string };
}

export interface SituacaoResponse {
  referenceMonth: string;
  status: 'A' | 'DM' | 'I';
  emDia: boolean;
  payment: SocioPayment | null;
}

export interface SituacaoGeralResponse {
  sociosAtivos: number;
  percentualInadimplencia: number;
}

export interface PixPayloadResponse {
  emvPayload: string;
  pixKey: string;
}

export interface DashboardFinanceiroResponse {
  referenceMonth: string;
  socioRevenue: string;
  guestRevenue: string;
  otherRevenue: string;
  revenueTotal: string;
  expenseTotal: string;
  monthBalance: string;
  cumulativeBalance: string;
  percentualInadimplencia: number;
  sociosAtivos: number;
  series: Array<{
    referenceMonth: string;
    revenueTotal: string;
    expenseTotal: string;
    monthBalance: string;
    cumulativeBalance: string;
  }>;
}

export interface InadimplenteItem {
  id: string;
  name: string;
  phone?: string | null;
  amount?: number;
  diasEmAberto?: number;
}

export interface GuestPayment {
  id: string;
  convidadoId: string;
  matchDate: string;
  amount: string;
  paymentMethod: 'PIX' | 'DIN';
  paidAt: string;
  convidado?: { id: string; name: string };
}
