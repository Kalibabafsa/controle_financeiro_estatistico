import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Buckets privados — nunca públicos (ADR-07/RSP5). O front nunca recebe a
// SUPABASE_SERVICE_ROLE_KEY; todo acesso passa por este módulo, só no backend.
const supabase =
  env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

export const supabaseStorage = {
  isConfigured(): boolean {
    return supabase !== null;
  },

  async upload(bucket: string, path: string, buffer: Buffer, contentType: string): Promise<string> {
    if (!supabase) {
      // Ambiente de desenvolvimento sem Supabase configurado — não bloqueia o fluxo,
      // mas deixa claro que o arquivo não foi persistido de fato.
      // eslint-disable-next-line no-console
      console.warn(`[supabaseStorage:dev] Upload simulado (SUPABASE_URL não configurado): ${bucket}/${path}`);
      return path;
    }

    const { error } = await supabase.storage.from(bucket).upload(path, buffer, { contentType, upsert: true });
    if (error) {
      throw new Error(`Falha ao enviar arquivo para o storage: ${error.message}`);
    }
    return path;
  },

  async getSignedUrl(bucket: string, path: string, expiresInSeconds = 300): Promise<string> {
    if (!supabase) {
      return `about:blank#storage-nao-configurado(${bucket}/${path})`;
    }

    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
    if (error || !data) {
      throw new Error(`Falha ao gerar URL assinada: ${error?.message ?? 'desconhecido'}`);
    }
    return data.signedUrl;
  },
};
