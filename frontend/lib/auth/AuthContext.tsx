'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiClient } from '../api-client';
import { refreshAccessToken } from '../api-client';
import { setAccessToken } from './tokenStore';
import type { LoginResponse, MeResponse } from './types';

interface AuthContextValue {
  user: MeResponse | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<MeResponse>;
  logout: () => Promise<void>;
  refetchMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// O front nunca decide autorização sozinho (docs/seguranca.md item 3) — este contexto só
// guarda o estado de sessão para UX (esconder/mostrar telas); o backend sempre valida de novo.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const me = await apiClient.get<MeResponse>('/me');
    setUser(me);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const refreshed = await refreshAccessToken();
      if (refreshed && mounted) {
        try {
          await fetchMe();
        } catch {
          setUser(null);
        }
      }
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [fetchMe]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiClient.post<LoginResponse>('/auth/login', { email, password });
    setAccessToken(result.accessToken);
    const me = await apiClient.get<MeResponse>('/me');
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refetchMe: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider.');
  return context;
}
