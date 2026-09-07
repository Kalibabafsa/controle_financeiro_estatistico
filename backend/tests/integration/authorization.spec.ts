import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { startTestServer, type TestServer } from '../helpers/testServer';
import { authHeader, diretorToken, socioToken } from '../helpers/tokens';

// Estes testes exercitam o pipeline real (Express -> authMiddleware -> requireRole/
// requireOwnerOrDirector -> controller) via HTTP de verdade (fetch contra `createApp()`
// escutando em uma porta efêmera) — não chamam controllers isolados. As camadas de
// service são mockadas (lógica de negócio já coberta pelos testes unitários); o alvo
// aqui é autorização por papel, ownership (IDOR) e vazamento de dado sensível (RSP2/RSP3/A1).

vi.mock('../../src/services/socios.service', () => ({
  sociosService: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    getStatusHistory: vi.fn(),
  },
}));
vi.mock('../../src/services/inadimplencia.service', () => ({
  inadimplenciaService: { getInadimplentes: vi.fn(), getResumo: vi.fn() },
}));
vi.mock('../../src/services/me.service', () => ({
  meService: {
    getMe: vi.fn(),
    getPerfil: vi.fn(),
    updatePerfil: vi.fn(),
    getSituacao: vi.fn(),
    getProximoBaba: vi.fn(),
  },
}));
vi.mock('../../src/services/mensalidades.service', () => ({
  mensalidadesService: { meHistory: vi.fn(), list: vi.fn(), create: vi.fn() },
}));
vi.mock('../../src/services/gameEvents.service', () => ({
  gameEventsService: { findByBabaId: vi.fn(), create: vi.fn(), delete: vi.fn() },
}));
vi.mock('../../src/services/prestacoes.service', () => ({
  prestacoesService: { list: vi.fn(), preview: vi.fn(), generate: vi.fn(), getPdfUrl: vi.fn() },
}));
vi.mock('../../src/services/pix.service', () => ({
  pixService: { getPayload: vi.fn() },
}));

import { sociosService } from '../../src/services/socios.service';
import { inadimplenciaService } from '../../src/services/inadimplencia.service';
import { meService } from '../../src/services/me.service';
import { gameEventsService } from '../../src/services/gameEvents.service';
import { prestacoesService } from '../../src/services/prestacoes.service';
import { pixService } from '../../src/services/pix.service';

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
});

afterAll(async () => {
  await server.close();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Autorização — sem token', () => {
  it('nega acesso (401) a rota protegida sem header Authorization', async () => {
    const res = await fetch(`${server.baseUrl}/api/socios/algum-id`);
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('nega acesso (401) com token Bearer inválido/adulterado', async () => {
    const res = await fetch(`${server.baseUrl}/api/socios/algum-id`, {
      headers: { Authorization: 'Bearer token-invalido-forjado' },
    });
    expect(res.status).toBe(401);
  });
});

describe('RSP1/RSP3 — controle de acesso por papel (RBAC)', () => {
  it('US14 — sócio comum recebe 403 ao tentar acessar Gestão de Inadimplência (exclusiva do diretor)', async () => {
    const token = socioToken('socio-A');
    const res = await fetch(`${server.baseUrl}/api/inadimplencia`, { headers: authHeader(token) });
    expect(res.status).toBe(403);
    expect(inadimplenciaService.getInadimplentes).not.toHaveBeenCalled();
  });

  it('diretor acessa normalmente a Gestão de Inadimplência', async () => {
    vi.mocked(inadimplenciaService.getInadimplentes).mockResolvedValue([{ id: 's1', name: 'Ana' }] as never);
    const res = await fetch(`${server.baseUrl}/api/inadimplencia`, { headers: authHeader(diretorToken()) });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: 's1', name: 'Ana' }]);
  });

  it('sócio comum recebe 403 ao tentar listar todos os sócios (GET /socios, exclusiva do diretor)', async () => {
    const res = await fetch(`${server.baseUrl}/api/socios`, { headers: authHeader(socioToken('socio-A')) });
    expect(res.status).toBe(403);
  });

  it('sócio comum recebe 403 ao tentar criar/editar sócio (RF4, exclusivo do diretor)', async () => {
    const res = await fetch(`${server.baseUrl}/api/socios`, {
      method: 'POST',
      headers: { ...authHeader(socioToken('socio-A')), 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Novo Sócio' }),
    });
    expect(res.status).toBe(403);
    expect(sociosService.create).not.toHaveBeenCalled();
  });

  it('sócio comum recebe 403 ao tentar mudar o status (A/DM/I) de um sócio — inclusive o próprio (RF5/RF6 são ação do diretor)', async () => {
    const res = await fetch(`${server.baseUrl}/api/socios/socio-A/status`, {
      method: 'PATCH',
      headers: { ...authHeader(socioToken('socio-A')), 'Content-Type': 'application/json' },
      body: JSON.stringify({ referenceMonth: '2026-08-01', status: 'DM' }),
    });
    expect(res.status).toBe(403);
  });
});

describe('RSP1 — IDOR: sócio A não pode acessar dados individuais de sócio B via manipulação de :id', () => {
  it('GET /socios/:id — sócio A recebe 403 ao tentar ler o perfil financeiro/cadastral de sócio B', async () => {
    const res = await fetch(`${server.baseUrl}/api/socios/socio-B`, {
      headers: authHeader(socioToken('socio-A')),
    });
    expect(res.status).toBe(403);
    expect(sociosService.getById).not.toHaveBeenCalled();
  });

  it('GET /socios/:id/status-history — sócio A recebe 403 ao tentar ler o histórico de status de sócio B', async () => {
    const res = await fetch(`${server.baseUrl}/api/socios/socio-B/status-history`, {
      headers: authHeader(socioToken('socio-A')),
    });
    expect(res.status).toBe(403);
    expect(sociosService.getStatusHistory).not.toHaveBeenCalled();
  });

  it('GET /socios/:id — sócio A consegue acessar o PRÓPRIO id normalmente (dono do recurso)', async () => {
    vi.mocked(sociosService.getById).mockResolvedValue({ id: 'socio-A', name: 'Ana', currentStatus: 'A' } as never);
    const res = await fetch(`${server.baseUrl}/api/socios/socio-A`, { headers: authHeader(socioToken('socio-A')) });
    expect(res.status).toBe(200);
    // isDirector=false repassado ao service (RSP2 — observação DM nunca serializada p/ não-diretor).
    expect(sociosService.getById).toHaveBeenCalledWith('socio-A', false);
  });

  it('GET /socios/:id — diretor pode acessar o perfil de qualquer sócio (isDirector=true repassado ao service)', async () => {
    vi.mocked(sociosService.getById).mockResolvedValue({ id: 'socio-B', name: 'Bruno' } as never);
    const res = await fetch(`${server.baseUrl}/api/socios/socio-B`, { headers: authHeader(diretorToken()) });
    expect(res.status).toBe(200);
    expect(sociosService.getById).toHaveBeenCalledWith('socio-B', true);
  });
});

describe('ADR-08 — rotas /me/* resolvem o dono sempre a partir do JWT, nunca de :id na URL', () => {
  it('GET /me/situacao nunca aceita socioId pela query/body — usa sempre req.user.socioId do próprio token', async () => {
    vi.mocked(meService.getSituacao).mockResolvedValue({ status: 'A', emDia: true } as never);

    // Sócio A tenta, via query string, "se passar" por outro sócio — deve ser ignorado.
    const res = await fetch(`${server.baseUrl}/api/me/situacao?socioId=socio-B`, {
      headers: authHeader(socioToken('socio-A')),
    });

    expect(res.status).toBe(200);
    expect(meService.getSituacao).toHaveBeenCalledWith('socio-A'); // nunca 'socio-B'
  });

  it('rotas /me/* exigem token de sócio (diretor sem socioId vinculado recebe 403 de domínio)', async () => {
    const res = await fetch(`${server.baseUrl}/api/me/situacao`, { headers: authHeader(diretorToken()) });
    expect(res.status).toBe(403);
  });
});

describe('A1 (security-report.md, Alto) — vazamento de PII em GET /babas/:id/eventos', () => {
  it('[BUG conhecido] sócio autenticado NÃO deveria receber e-mail/telefone de outros sócios/convidados ao consultar gols/cartões de um baba', async () => {
    // Fixture equivalente ao que `gameEventsRepository.findByBabaId` retorna hoje, com
    // `include: { socio: true, convidado: true }` completo (security-report.md A1) — o
    // controller repassa isso ao cliente sem nenhum serializer que remova email/phone.
    vi.mocked(gameEventsService.findByBabaId).mockResolvedValue([
      {
        id: 'evt-1',
        type: 'GOL',
        presenca: {
          id: 'presenca-1',
          socio: { id: 'socio-B', name: 'Bruno', email: 'bruno@example.com', phone: '11999990000' },
          convidado: null,
        },
      },
    ] as never);

    const res = await fetch(`${server.baseUrl}/api/babas/baba-1/eventos`, {
      headers: authHeader(socioToken('socio-A')), // sócio comum, não é o diretor nem o dono do dado
    });

    expect(res.status).toBe(200);
    const bodyText = JSON.stringify(await res.json());

    // Este teste falha HOJE de propósito — reproduz o achado 🟠 Alto A1 do security-report.md
    // para o dev-senior corrigir (trocar `include` por `select` mínimo) antes do /deploy.
    expect(bodyText).not.toContain('bruno@example.com');
    expect(bodyText).not.toContain('11999990000');
  });

  it('diretor pode ver os detalhes completos de eventos (isso não é uma violação de autorização — ele já tem acesso a e-mail/telefone por outras rotas)', async () => {
    vi.mocked(gameEventsService.findByBabaId).mockResolvedValue([{ id: 'evt-1', type: 'GOL' }] as never);
    const res = await fetch(`${server.baseUrl}/api/babas/baba-1/eventos`, { headers: authHeader(diretorToken()) });
    expect(res.status).toBe(200);
  });
});

describe('US9 — sócio consulta a Prestação de Contas de meses anteriores (rota deliberadamente aberta aos 2 papéis)', () => {
  it('GET /prestacoes (lista de meses) é acessível ao sócio comum, não só ao diretor', async () => {
    vi.mocked(prestacoesService.list).mockResolvedValue([{ id: 'r1', referenceMonth: '2026-07-01' }] as never);
    const res = await fetch(`${server.baseUrl}/api/prestacoes`, { headers: authHeader(socioToken('socio-A')) });
    expect(res.status).toBe(200);
  });

  it('GET /prestacoes/:month/pdf (baixar PDF de um mês) é acessível ao sócio comum', async () => {
    vi.mocked(prestacoesService.getPdfUrl).mockResolvedValue('https://signed-url.example.com/relatorio.pdf');
    const res = await fetch(`${server.baseUrl}/api/prestacoes/2026-07/pdf`, { headers: authHeader(socioToken('socio-A')) });
    expect(res.status).toBe(200);
  });

  it('GET /prestacoes/:month/preview (rascunho antes de gerar) é EXCLUSIVO do diretor — sócio recebe 403', async () => {
    const res = await fetch(`${server.baseUrl}/api/prestacoes/2026-07/preview`, { headers: authHeader(socioToken('socio-A')) });
    expect(res.status).toBe(403);
    expect(prestacoesService.preview).not.toHaveBeenCalled();
  });

  it('POST /prestacoes (gerar o PDF) é EXCLUSIVO do diretor — sócio recebe 403', async () => {
    const res = await fetch(`${server.baseUrl}/api/prestacoes`, {
      method: 'POST',
      headers: { ...authHeader(socioToken('socio-A')), 'Content-Type': 'application/json' },
      body: JSON.stringify({ referenceMonth: '2026-07-01' }),
    });
    expect(res.status).toBe(403);
    expect(prestacoesService.generate).not.toHaveBeenCalled();
  });
});

describe('US3 — sócio consegue ver o payload Pix (QR/copia-e-cola) para pagar a mensalidade', () => {
  it('GET /pix/payload é acessível a qualquer usuário autenticado (sócio inclusive)', async () => {
    vi.mocked(pixService.getPayload).mockResolvedValue({ emvPayload: '000201...6304ABCD', pixKey: 'associacao@pix.com' } as never);
    const res = await fetch(`${server.baseUrl}/api/pix/payload`, { headers: authHeader(socioToken('socio-A')) });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { emvPayload: string };
    expect(body.emvPayload).toContain('6304ABCD');
  });
});
