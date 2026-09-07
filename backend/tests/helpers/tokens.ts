import { signAccessToken } from '../../src/lib/jwt';

export function diretorToken(userId = 'user-diretor-1'): string {
  return signAccessToken({ sub: userId, role: 'DIRETOR', socioId: null });
}

export function socioToken(socioId: string, userId?: string): string {
  return signAccessToken({ sub: userId ?? `user-${socioId}`, role: 'SOCIO', socioId });
}

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}
