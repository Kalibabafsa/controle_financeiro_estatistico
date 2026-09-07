import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApp } from '../../src/app';

export interface TestServer {
  baseUrl: string;
  close: () => Promise<void>;
}

// Sobe a aplicação Express real (mesmo `createApp()` usado em produção) em uma porta
// efêmera, para testes de integração via HTTP real (fetch), exercitando o pipeline
// completo de middlewares (helmet, cors, rate limit, auth, requireRole, ownership,
// error handler) — não apenas os controllers isolados.
export async function startTestServer(): Promise<TestServer> {
  const app = createApp();
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const { port } = server.address() as AddressInfo;

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}

export async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  return text ? JSON.parse(text) : undefined;
}
