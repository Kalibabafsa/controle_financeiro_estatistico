import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { startTestServer, type TestServer } from '../helpers/testServer';

vi.mock('../../src/repositories/users.repository', () => ({
  usersRepository: {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    updateLastLogin: vi.fn(),
    updatePasswordHash: vi.fn(),
  },
}));
vi.mock('../../src/repositories/passwordResetTokens.repository', () => ({
  passwordResetTokensRepository: {
    create: vi.fn(),
    findValidByHash: vi.fn(),
    markUsed: vi.fn(),
  },
}));

import { usersRepository } from '../../src/repositories/users.repository';
import { passwordResetTokensRepository } from '../../src/repositories/passwordResetTokens.repository';

let server: TestServer;
let passwordHash: string;

beforeAll(async () => {
  server = await startTestServer();
  passwordHash = await bcrypt.hash('SenhaForte123', 12);
});

afterAll(async () => {
  await server.close();
});

beforeEach(() => {
  vi.clearAllMocks();
});

const socioUser = {
  id: 'user-1',
  email: 'socio@kalibaba.com',
  passwordHash: '',
  role: 'SOCIO' as const,
  socioId: 'socio-1',
  isActive: true,
  socio: { id: 'socio-1', name: 'Sócio Teste' },
};

describe('US1 — Login por papel', () => {
  it('Given sócio cadastrado com senha válida, When faz login, Then recebe accessToken e dados do próprio papel (SOCIO)', async () => {
    vi.mocked(usersRepository.findByEmail).mockResolvedValue({ ...socioUser, passwordHash } as never);

    const res = await fetch(`${server.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: socioUser.email, password: 'SenhaForte123' }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { accessToken: string; user: { role: string; name: string } };
    expect(body.accessToken).toBeTruthy();
    expect(body.user.role).toBe('SOCIO');
    expect(body.user.name).toBe('Sócio Teste');
  });

  it('Given diretor com credenciais válidas, When faz login, Then recebe papel DIRETOR (o front deve rotear ao Dashboard Financeiro)', async () => {
    vi.mocked(usersRepository.findByEmail).mockResolvedValue({
      id: 'user-diretor',
      email: 'diretor@kalibaba.com',
      passwordHash,
      role: 'DIRETOR',
      socioId: null,
      isActive: true,
      socio: null,
    } as never);

    const res = await fetch(`${server.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'diretor@kalibaba.com', password: 'SenhaForte123' }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { user: { role: string } };
    expect(body.user.role).toBe('DIRETOR');
  });

  it('Given senha incorreta, When tenta logar, Then vê mensagem de erro genérica (401, sem enumeração de usuário)', async () => {
    vi.mocked(usersRepository.findByEmail).mockResolvedValue({ ...socioUser, passwordHash } as never);

    const res = await fetch(`${server.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: socioUser.email, password: 'senha-errada' }),
    });

    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { message: string } };
    expect(body.error.message).toBe('E-mail ou senha inválidos.');
  });

  it('e-mail inexistente recebe a MESMA mensagem genérica que senha incorreta (não revela se o e-mail existe)', async () => {
    vi.mocked(usersRepository.findByEmail).mockResolvedValue(null);

    const res = await fetch(`${server.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nao-existe@kalibaba.com', password: 'qualquer-coisa' }),
    });

    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { message: string } };
    expect(body.error.message).toBe('E-mail ou senha inválidos.');
  });

  it('usuário desativado (isActive=false) não consegue logar mesmo com senha correta', async () => {
    vi.mocked(usersRepository.findByEmail).mockResolvedValue({ ...socioUser, passwordHash, isActive: false } as never);

    const res = await fetch(`${server.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: socioUser.email, password: 'SenhaForte123' }),
    });

    expect(res.status).toBe(401);
  });

  it('payload inválido (e-mail mal formatado) é rejeitado pelo Zod com 422, antes de chegar ao service', async () => {
    const res = await fetch(`${server.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nao-e-um-email', password: 'x' }),
    });

    expect(res.status).toBe(422);
    expect(usersRepository.findByEmail).not.toHaveBeenCalled();
  });

  it('define o cookie de refresh como HttpOnly e SameSite=Lax em ambiente não-produção (correção de segurança validada)', async () => {
    vi.mocked(usersRepository.findByEmail).mockResolvedValue({ ...socioUser, passwordHash } as never);

    const res = await fetch(`${server.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: socioUser.email, password: 'SenhaForte123' }),
    });

    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie.toLowerCase()).toContain('samesite=lax');
  });
});

describe('POST /auth/refresh', () => {
  it('sem cookie de refresh, retorna 401 com mensagem de sessão expirada', async () => {
    const res = await fetch(`${server.baseUrl}/api/auth/refresh`, { method: 'POST' });
    expect(res.status).toBe(401);
  });

  it('com cookie de refresh adulterado/inválido, retorna 401', async () => {
    const res = await fetch(`${server.baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: 'kalibaba_refresh=token-forjado' },
    });
    expect(res.status).toBe(401);
  });
});

describe('RF2 — recuperação de senha (sem enumeração de usuário)', () => {
  it('POST /auth/forgot-password sempre responde 202, mesmo para e-mail inexistente', async () => {
    vi.mocked(usersRepository.findByEmail).mockResolvedValue(null);

    const res = await fetch(`${server.baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ninguem@kalibaba.com' }),
    });

    expect(res.status).toBe(202);
    expect(passwordResetTokensRepository.create).not.toHaveBeenCalled();
  });

  it('POST /auth/reset-password com token inválido/expirado retorna 401, sem alterar senha', async () => {
    vi.mocked(passwordResetTokensRepository.findValidByHash).mockResolvedValue(null);

    const res = await fetch(`${server.baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'token-invalido', newPassword: 'NovaSenhaForte123' }),
    });

    expect(res.status).toBe(401);
    expect(usersRepository.updatePasswordHash).not.toHaveBeenCalled();
  });
});
