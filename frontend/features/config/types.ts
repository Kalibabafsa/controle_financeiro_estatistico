export interface SystemConfig {
  defaultMonthlyFee: string;
  defaultGuestFee: string;
  currentSeason: number;
  pixKey: string | null;
  pixBeneficiaryName: string | null;
  pixBankName: string | null;
  pixCity: string | null;
  interIntegrationEnabled: boolean;
}
