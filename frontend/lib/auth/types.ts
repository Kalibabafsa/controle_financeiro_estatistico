export type Role = 'DIRETOR' | 'SOCIO';

export interface MeResponse {
  id: string;
  role: Role;
  socio: { id: string; name: string; email: string | null; phone: string | null } | null;
}

export interface LoginResponse {
  accessToken: string;
  user: { id: string; role: Role; name: string };
}
