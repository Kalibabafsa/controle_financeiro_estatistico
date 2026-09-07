import crypto from 'node:crypto';
import { usersRepository } from '../repositories/users.repository';
import { passwordResetTokensRepository } from '../repositories/passwordResetTokens.repository';
import { comparePassword, hashPassword } from '../lib/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt';
import { UnauthorizedError } from '../errors/domain-errors';
import { sendPasswordResetEmail } from '../lib/email';
import { env } from '../lib/env';
import type { LoginInput, ResetPasswordInput } from '../schemas/auth.schemas';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export const authService = {
  async login(input: LoginInput) {
    const user = await usersRepository.findByEmail(input.email);

    // Mensagem genérica em ambos os casos — sem enumeração de usuário (docs/seguranca.md item 2).
    if (!user || !user.isActive) {
      throw new UnauthorizedError('E-mail ou senha inválidos.');
    }

    const passwordMatches = await comparePassword(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedError('E-mail ou senha inválidos.');
    }

    await usersRepository.updateLastLogin(user.id);

    const accessToken = signAccessToken({ sub: user.id, role: user.role, socioId: user.socioId });
    const refreshToken = signRefreshToken({ sub: user.id });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        role: user.role,
        name: user.socio?.name ?? user.email,
      },
    };
  },

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) {
      throw new UnauthorizedError('Sessão expirada. Faça login novamente.');
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Sessão expirada. Faça login novamente.');
    }

    const user = await usersRepository.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Sessão expirada. Faça login novamente.');
    }

    const accessToken = signAccessToken({ sub: user.id, role: user.role, socioId: user.socioId });
    const newRefreshToken = signRefreshToken({ sub: user.id });

    return { accessToken, refreshToken: newRefreshToken };
  },

  async forgotPassword(email: string): Promise<void> {
    const user = await usersRepository.findByEmail(email);

    // Sempre retorna sucesso ao chamador (controller responde 202), sem revelar se o e-mail existe.
    if (!user) {
      return;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await passwordResetTokensRepository.create(user.id, tokenHash, expiresAt);

    const resetLink = `${env.FRONTEND_URL}/recuperar-senha?token=${rawToken}`;
    await sendPasswordResetEmail(user.email, resetLink);
  },

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const tokenHash = hashToken(input.token);
    const resetToken = await passwordResetTokensRepository.findValidByHash(tokenHash);

    if (!resetToken) {
      throw new UnauthorizedError('Token de redefinição inválido ou expirado.');
    }

    const passwordHash = await hashPassword(input.newPassword);
    await usersRepository.updatePasswordHash(resetToken.userId, passwordHash);
    await passwordResetTokensRepository.markUsed(resetToken.id);
  },
};
