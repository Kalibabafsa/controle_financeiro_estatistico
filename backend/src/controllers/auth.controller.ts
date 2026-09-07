import type { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { forgotPasswordSchema, loginSchema, resetPasswordSchema } from '../schemas/auth.schemas';
import { env } from '../lib/env';
import { parseDurationToMs } from '../lib/parseDuration';

const REFRESH_COOKIE_NAME = 'kalibaba_refresh';

// Cookie HttpOnly/Secure/SameSite=None (corrigido em /seguranca — ver docs/planning/security-report.md).
// Front (Vercel) e back (Render) são domínios registráveis diferentes, logo toda chamada
// fetch('/api/auth/refresh', { credentials: 'include' }) é cross-site. SameSite=Strict (valor
// original do ADR-01) bloqueia o envio do cookie em qualquer requisição cross-site — inclusive
// fetch same-app — então o refresh nunca chegaria ao backend em produção (deslogava a cada 15min).
// SameSite=None exige Secure; em dev (http://localhost) usamos Lax pois o browser rejeita
// None sem HTTPS. Não reabre CSRF relevante: toda rota de mutação de negócio usa o access token
// no header Authorization (não o cookie); o cookie só é lido por POST /auth/refresh, que não
// muda estado de negócio, e o CORS restrito (credentials: true + origin explícita, nunca "*")
// impede que um site atacante leia a resposta mesmo que consiga disparar o POST.
function setRefreshCookie(res: Response, refreshToken: string): void {
  const isProduction = env.NODE_ENV === 'production';
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/api/auth',
    maxAge: parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN),
  });
}

export const authController = {
  async login(req: Request, res: Response): Promise<void> {
    const input = loginSchema.parse(req.body);
    const { accessToken, refreshToken, user } = await authService.login(input);
    setRefreshCookie(res, refreshToken);
    res.status(200).json({ accessToken, user });
  },

  async refresh(req: Request, res: Response): Promise<void> {
    const currentRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    const { accessToken, refreshToken } = await authService.refresh(currentRefreshToken);
    setRefreshCookie(res, refreshToken);
    res.status(200).json({ accessToken });
  },

  async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
    res.status(204).send();
  },

  async forgotPassword(req: Request, res: Response): Promise<void> {
    const input = forgotPasswordSchema.parse(req.body);
    await authService.forgotPassword(input.email);
    // Sempre 202, mesmo se o e-mail não existir — evita enumeração de usuários.
    res.status(202).json({ message: 'Se o e-mail existir, um link de redefinição foi enviado.' });
  },

  async resetPassword(req: Request, res: Response): Promise<void> {
    const input = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(input);
    res.status(204).send();
  },
};
