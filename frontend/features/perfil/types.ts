export interface MeuPerfil {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  memberSince: string | null;
  currentStatus: 'A' | 'DM' | 'I';
}
