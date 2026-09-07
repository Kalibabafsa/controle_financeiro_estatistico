'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import type { Role } from './types';
import { LoaderCircle } from 'lucide-react';

interface RequireRoleProps {
  role: Role;
  children: React.ReactNode;
}

// Guarda de rota no client — só UX (evita flash de tela errada). A autorização
// de verdade é sempre reforçada pelo backend em cada chamada de API (defesa real).
export function RequireRole({ role, children }: RequireRoleProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== role) {
      router.replace(user.role === 'DIRETOR' ? '/dashboard' : '/inicio');
    }
  }, [loading, user, role, router]);

  if (loading || !user || user.role !== role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoaderCircle className="h-8 w-8 animate-spin text-navy-600" />
      </div>
    );
  }

  return <>{children}</>;
}
