import { getAccessToken, setAccessToken } from './auth/tokenStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333/api';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipAuthRetry?: boolean;
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) return false;
    const data = (await response.json()) as { accessToken: string };
    setAccessToken(data.accessToken);
    return true;
  } catch {
    return false;
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipAuthRetry, headers, ...rest } = options;
  const isFormData = body instanceof FormData;

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
  });

  // Access token expirado — tenta renovar uma vez via refresh cookie e repete a chamada original.
  if (response.status === 401 && !skipAuthRetry && path !== '/auth/refresh' && path !== '/auth/login') {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return request<T>(path, { ...options, skipAuthRetry: true });
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json') ? await response.json() : undefined;

  if (!response.ok) {
    const errorInfo = data?.error ?? { code: 'UNKNOWN_ERROR', message: 'Erro inesperado.' };
    throw new ApiError(response.status, errorInfo.code, errorInfo.message);
  }

  return data as T;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'DELETE' }),
};

export { refreshAccessToken };
