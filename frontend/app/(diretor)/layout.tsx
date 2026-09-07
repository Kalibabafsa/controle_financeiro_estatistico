'use client';

import { RequireRole } from '@/lib/auth/RequireRole';

export default function DiretorLayout({ children }: { children: React.ReactNode }) {
  return <RequireRole role="DIRETOR">{children}</RequireRole>;
}
