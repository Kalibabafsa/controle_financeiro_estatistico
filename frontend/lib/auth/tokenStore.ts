// Guarda o access token só em memória (nunca em localStorage/sessionStorage) —
// ADR-01: reduz superfície de XSS-para-roubo-de-token. É perdido no refresh de
// página, quando o AuthProvider chama /auth/refresh de novo para restaurar a sessão.
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}
